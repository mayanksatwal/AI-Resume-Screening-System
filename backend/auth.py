
import os
import secrets

from pathlib import Path
from datetime import datetime, timedelta, timezone

import psycopg
from psycopg.rows import dict_row

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field, EmailStr
from pwdlib import PasswordHash

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


# =====================================================
# CONFIGURATION
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from the project .env file.")

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from the project .env file.")

if not GOOGLE_CLIENT_ID:
    raise RuntimeError("GOOGLE_CLIENT_ID is missing from the project .env file.")

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(prefix="/auth", tags=["Company Authentication"])
password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# =====================================================
# DATABASE
# =====================================================

def get_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )


def initialize_auth_tables():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                id BIGSERIAL PRIMARY KEY,
                company_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                setup_completed BOOLEAN NOT NULL DEFAULT FALSE
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS company_users (
                id BIGSERIAL PRIMARY KEY,
                company_id BIGINT NOT NULL REFERENCES companies(id),
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'company_admin',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_company_users_email_unique
            ON company_users (LOWER(email))
        """)


initialize_auth_tables()


# =====================================================
# REQUEST MODELS
# =====================================================

class CompanyRegister(BaseModel):
    company_name: str = Field(min_length=2, max_length=120)
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=1)


class CompanySetupRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=120)


# =====================================================
# JWT
# =====================================================

def create_access_token(user_id, company_id, role):
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "company_id": company_id,
        "role": role,
        "exp": expiration
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired login session. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload["sub"])
        token_company_id = int(payload["company_id"])

    except (JWTError, KeyError, TypeError, ValueError):
        raise credentials_error

    with get_connection() as conn:
        user = conn.execute("""
            SELECT
                u.id,
                u.company_id,
                u.full_name,
                u.email,
                u.role,
                u.is_active,
                c.company_name,
                c.setup_completed
            FROM company_users u
            JOIN companies c ON c.id = u.company_id
            WHERE u.id = %s AND u.company_id = %s
        """, (user_id, token_company_id)).fetchone()

    if not user or not user["is_active"]:
        raise credentials_error

    return dict(user)


# =====================================================
# STANDARD AUTH RESPONSE
# =====================================================

def create_auth_response(user_id, company_id, full_name, email, role):
    with get_connection() as conn:
        company = conn.execute("""
            SELECT company_name, setup_completed
            FROM companies
            WHERE id = %s
        """, (company_id,)).fetchone()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company workspace not found."
        )

    token = create_access_token(user_id, company_id, role)

    return {
        "message": "Authentication successful.",
        "access_token": token,
        "token_type": "bearer",
        "setup_required": not bool(company["setup_completed"]),
        "company": {
            "id": company_id,
            "company_name": company["company_name"],
            "setup_completed": bool(company["setup_completed"])
        },
        "user": {
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "role": role
        }
    }


# =====================================================
# COMPANY REGISTRATION
# =====================================================

@router.post("/register", status_code=201)
def register_company(data: CompanyRegister):
    company_name = data.company_name.strip()
    full_name = data.full_name.strip()
    email = str(data.email).strip().lower()

    if len(company_name) < 2 or len(full_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid company name and full name."
        )

    current_time = datetime.now(timezone.utc).isoformat()
    hashed_password = password_hash.hash(data.password)

    try:
        with get_connection() as conn:
            company = conn.execute("""
                INSERT INTO companies (
                    company_name, created_at, setup_completed
                )
                VALUES (%s, %s, TRUE)
                RETURNING id
            """, (company_name, current_time)).fetchone()

            company_id = company["id"]

            user = conn.execute("""
                INSERT INTO company_users (
                    company_id, full_name, email,
                    password_hash, role, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                company_id,
                full_name,
                email,
                hashed_password,
                "company_admin",
                current_time
            )).fetchone()

            user_id = user["id"]

    except psycopg.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered. Please sign in instead."
        )

    return create_auth_response(
        user_id, company_id, full_name, email, "company_admin"
    )


# =====================================================
# EMAIL AND PASSWORD LOGIN
# =====================================================

@router.post("/login")
def login(data: LoginRequest):
    email = str(data.email).strip().lower()

    with get_connection() as conn:
        user = conn.execute("""
            SELECT *
            FROM company_users
            WHERE LOWER(email) = %s
        """, (email,)).fetchone()

    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )

    try:
        password_valid = password_hash.verify(
            data.password,
            user["password_hash"]
        )
    except Exception:
        password_valid = False

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )

    return create_auth_response(
        user["id"],
        user["company_id"],
        user["full_name"],
        user["email"],
        user["role"]
    )


# =====================================================
# GOOGLE LOGIN
# =====================================================

@router.post("/google")
def google_login(data: GoogleLoginRequest):
    try:
        google_user = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Google credential."
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Google authentication is temporarily unavailable."
        )

    email = (google_user.get("email") or "").strip().lower()

    if not email or google_user.get("email_verified") is not True:
        raise HTTPException(
            status_code=401,
            detail="Google email could not be verified."
        )

    full_name = google_user.get("name") or email.split("@")[0]
    current_time = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        user = conn.execute("""
            SELECT *
            FROM company_users
            WHERE LOWER(email) = %s
        """, (email,)).fetchone()

        if user:
            if not user["is_active"]:
                raise HTTPException(
                    status_code=403,
                    detail="This account is inactive."
                )

            user_id = user["id"]
            company_id = user["company_id"]
            full_name = user["full_name"]
            role = user["role"]

        else:
            company = conn.execute("""
                INSERT INTO companies (
                    company_name, created_at, setup_completed
                )
                VALUES (%s, %s, FALSE)
                RETURNING id
            """, ("My Workspace", current_time)).fetchone()

            company_id = company["id"]

            random_password = secrets.token_urlsafe(32)
            hashed_password = password_hash.hash(random_password)

            user = conn.execute("""
                INSERT INTO company_users (
                    company_id, full_name, email,
                    password_hash, role, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                company_id,
                full_name,
                email,
                hashed_password,
                "company_admin",
                current_time
            )).fetchone()

            user_id = user["id"]
            role = "company_admin"

    return create_auth_response(
        user_id, company_id, full_name, email, role
    )


# =====================================================
# COMPLETE COMPANY SETUP
# =====================================================

@router.post("/setup")
def complete_company_setup(
    data: CompanySetupRequest,
    current_user: dict = Depends(get_current_user)
):
    company_name = data.company_name.strip()

    if len(company_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid company name."
        )

    with get_connection() as conn:
        conn.execute("""
            UPDATE companies
            SET company_name = %s, setup_completed = TRUE
            WHERE id = %s
        """, (company_name, current_user["company_id"]))

    return create_auth_response(
        current_user["id"],
        current_user["company_id"],
        current_user["full_name"],
        current_user["email"],
        current_user["role"]
    )


# =====================================================
# CURRENT USER PROFILE
# =====================================================

@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

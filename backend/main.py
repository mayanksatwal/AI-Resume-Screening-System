
from typing import Annotated
from io import BytesIO
from datetime import datetime, timezone
import re

import psycopg
from psycopg.rows import dict_row

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from PyPDF2 import PdfReader

from .auth import (
    router as auth_router,
    get_current_user,
    DATABASE_URL,
)
from .ml_engine import analyze_resume


# ==========================================
# 1. DATABASE SETUP - NEON POSTGRESQL
# ==========================================

def get_db_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )


def initialize_database():
    with get_db_connection() as connection:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS screening_history (
                id BIGSERIAL PRIMARY KEY,
                company_id BIGINT REFERENCES companies(id),
                filename TEXT NOT NULL,
                score DOUBLE PRECISION NOT NULL,
                matched_skills TEXT NOT NULL,
                missing_skills TEXT NOT NULL,
                total_required_skills INTEGER NOT NULL,
                status TEXT NOT NULL,
                screened_at TEXT NOT NULL,
                summary TEXT DEFAULT ''
            )
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_screening_history_company
            ON screening_history(company_id)
        """)


# ==========================================
# 2. CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="TalentAI API",
    description=(
        "AI-Based Resume Screening and "
        "Company-Wise Candidate Management System"
    ),
    version="2.1.0"
)

app.include_router(auth_router)
app.openapi_version = "3.0.3"


# ==========================================
# 3. CONNECT REACT FRONTEND
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ai-resume-screening-system-kappa.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 4. HOME ROUTE
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Welcome to TalentAI API",
        "status": "Running successfully",
        "version": "2.1.0"
    }


# ==========================================
# 5. HEALTH CHECK
# ==========================================

@app.get("/health")
def health():

    try:
        with get_db_connection() as connection:
            connection.execute("SELECT 1")

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception:
        return {
            "status": "unhealthy",
            "database": "disconnected"
        }


# ==========================================
# 6. EXTRACT TEXT FROM PDF
# ==========================================

def extract_pdf_text(pdf_content: bytes) -> str:

    reader = PdfReader(BytesIO(pdf_content))

    if reader.is_encrypted:
        raise ValueError(
            "Password-protected PDFs are not supported."
        )

    extracted_text = ""

    for page in reader.pages:
        extracted_text += (page.extract_text() or "") + "\n"

    return extracted_text.strip()


# ==========================================
# 7. EXTRACT TECHNICAL SKILLS
# ==========================================

SKILL_LIST = [
    "python",
    "java",
    "javascript",
    "react",
    "html",
    "css",
    "sql",
    "mongodb",
    "flask",
    "fastapi",
    "django",
    "machine learning",
    "deep learning",
    "pandas",
    "numpy",
    "excel",
    "data analysis",
    "node.js",
    "git",
    "c++"
]


def extract_skills(text: str) -> list[str]:

    text = text.lower()
    found_skills = []

    for skill in SKILL_LIST:

        pattern = (
            r"(?<!\w)"
            + re.escape(skill)
            + r"(?!\w)"
        )

        if re.search(pattern, text):
            found_skills.append(skill)

    return found_skills


# ==========================================
# 8. SAVE SCREENING RESULTS
# ==========================================

def save_screening_results(results, company_id):

    screened_at = datetime.now(timezone.utc).isoformat()

    with get_db_connection() as connection:

        for result in results:

            if "error" in result:
                continue

            connection.execute(
                """
                INSERT INTO screening_history (
                    company_id,
                    filename,
                    score,
                    matched_skills,
                    missing_skills,
                    total_required_skills,
                    status,
                    screened_at,
                    summary
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    company_id,
                    result["filename"],
                    result["score"],
                    ", ".join(result["matched_skills"]),
                    ", ".join(result["missing_skills"]),
                    result["total_required_skills"],
                    result["status"],
                    screened_at,
                    result["summary"]
                )
            )


# ==========================================
# 9. RESUME SCREENING API
# ==========================================

@app.post("/screen-resumes")
async def screen_resumes(

    job_description: Annotated[str, Form(...)],

    files: Annotated[
        list[UploadFile],
        File(description="Upload one or more PDF resumes")
    ],

    current_user: dict = Depends(get_current_user)

):

    company_id = current_user["company_id"]

    required_skills = extract_skills(job_description)

    if not required_skills:

        return {
            "message": "No supported skills found in job description.",
            "required_skills": [],
            "total_resumes": 0,
            "successful_resumes": 0,
            "results": []
        }

    results = []

    for file in files:

        try:

            if (
                not file.filename
                or not file.filename.lower().endswith(".pdf")
            ):
                raise ValueError(
                    "Only PDF files are supported."
                )

            pdf_content = await file.read()

            if len(pdf_content) > 10 * 1024 * 1024:
                raise ValueError(
                    "PDF exceeds the 10 MB size limit."
                )

            if not pdf_content:
                raise ValueError(
                    "Uploaded file is empty."
                )

            resume_text = extract_pdf_text(pdf_content)

            if not resume_text.strip():
                raise ValueError(
                    "No readable text found. "
                    "Scanned PDFs need OCR support."
                )

            candidate_skills = extract_skills(resume_text)

            matched_skills = [
                skill
                for skill in required_skills
                if skill in candidate_skills
            ]

            missing_skills = [
                skill
                for skill in required_skills
                if skill not in candidate_skills
            ]

            skill_score = round(
                (len(matched_skills) / len(required_skills)) * 100,
                2
            )

            ml_result = analyze_resume(
                job_description,
                resume_text
            )

            ml_score = ml_result["ml_score"]

            score = round(
                (0.60 * skill_score) + (0.40 * ml_score),
                2
            )

            candidate_status = (
                "Shortlisted for review"
                if score >= 60
                else "Needs further review"
            )

            summary = ml_result.get(
                "summary",
                "Summary could not be generated."
            )

            results.append({
                "filename": file.filename,
                "score": score,
                "skill_score": skill_score,
                "ml_score": ml_score,
                "ml_status": ml_result["ml_status"],
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "total_required_skills": len(required_skills),
                "status": candidate_status,
                "summary": summary
            })

        except Exception as error:

            results.append({
                "filename": file.filename or "Unknown file",
                "error": str(error)
            })

        finally:
            await file.close()

    results.sort(
        key=lambda item: item.get("score", -1),
        reverse=True
    )

    save_screening_results(
        results,
        company_id
    )

    successful_count = sum(
        1
        for result in results
        if "error" not in result
    )

    return {
        "message": "Resume screening completed successfully.",
        "company_id": company_id,
        "required_skills": required_skills,
        "total_resumes": len(files),
        "successful_resumes": successful_count,
        "results": results
    }


# ==========================================
# 10. COMPANY-WISE SCREENING HISTORY
# ==========================================

@app.get("/screening-history")
def get_screening_history(

    current_user: dict = Depends(get_current_user)

):

    company_id = current_user["company_id"]

    with get_db_connection() as connection:

        rows = connection.execute(
            """
            SELECT *
            FROM screening_history
            WHERE company_id = %s
            ORDER BY id DESC
            """,
            (company_id,)
        ).fetchall()

    history = []

    for row in rows:

        history.append({
            "id": row["id"],
            "filename": row["filename"],
            "score": row["score"],
            "matched_skills": [
                skill
                for skill in row["matched_skills"].split(", ")
                if skill
            ],
            "missing_skills": [
                skill
                for skill in row["missing_skills"].split(", ")
                if skill
            ],
            "total_required_skills": row["total_required_skills"],
            "status": row["status"],
            "screened_at": row["screened_at"],
            "summary": row["summary"] or ""
        })

    total = len(history)

    shortlisted = sum(
        1
        for item in history
        if "shortlist" in item["status"].lower()
    )

    average_score = (
        round(
            sum(item["score"] for item in history) / total,
            2
        )
        if total else 0
    )

    return {
        "company_id": company_id,
        "total_candidates": total,
        "shortlisted": shortlisted,
        "needs_review": total - shortlisted,
        "average_score": average_score,
        "history": history
    }


# ==========================================
# 11. CUSTOM SWAGGER OPENAPI SCHEMA
# ==========================================

def custom_openapi():

    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        openapi_version="3.0.3"
    )

    def fix_binary_format(item):

        if isinstance(item, dict):

            if item.get("contentMediaType") == "application/octet-stream":
                item.pop("contentMediaType", None)
                item["format"] = "binary"

            for value in item.values():
                fix_binary_format(value)

        elif isinstance(item, list):

            for value in item:
                fix_binary_format(value)

    fix_binary_format(schema)

    app.openapi_schema = schema

    return app.openapi_schema


# ==========================================
# 12. INITIALIZE DATABASE
# ==========================================

initialize_database()

app.openapi = custom_openapi

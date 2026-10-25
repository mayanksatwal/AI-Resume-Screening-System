
import streamlit as st
import pandas as pd
import PyPDF2
import io
import re

# ==========================================
# 1. PAGE CONFIGURATION
# ==========================================

st.set_page_config(
    page_title="TalentAI | AI Recruitment",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# 2. CUSTOM DARK NAVY + PURPLE CSS
# ==========================================

st.markdown("""
<style>

.stApp {
    background: #0b1020;
    color: #e6e9f5;
}

header[data-testid="stHeader"] {
    background: rgba(11,16,32,0.9);
}

#MainMenu, footer {
    visibility: hidden;
}

.block-container {
    padding-top: 2rem;
    padding-bottom: 2rem;
    max-width: 1450px;
}

section[data-testid="stSidebar"] {
    background: #11182b;
    border-right: 1px solid #252d45;
}

section[data-testid="stSidebar"] * {
    color: #e6e9f5;
}

h1, h2, h3 {
    color: #ffffff !important;
}

p, label {
    color: #c4c9dc;
}

/* Hero section */

.hero {
    background: linear-gradient(
        120deg,
        #171d38,
        #30205b,
        #512c88
    );
    border: 1px solid #6244a5;
    padding: 32px;
    border-radius: 18px;
    margin-bottom: 25px;
    box-shadow: 0 8px 35px rgba(92, 50, 180, 0.15);
}

.hero h1 {
    color: #ffffff !important;
    font-size: 34px;
    margin-bottom: 8px;
}

.hero p {
    color: #d6c9ff;
    font-size: 15px;
}

/* Metric cards */

.metric-card {
    background: linear-gradient(145deg, #171f36, #1c2340);
    border: 1px solid #343b60;
    border-radius: 15px;
    padding: 22px;
    min-height: 135px;
    box-shadow: 0 5px 18px rgba(0,0,0,0.15);
}

.metric-label {
    color: #a8afd0;
    font-size: 14px;
    font-weight: 600;
}

.metric-value {
    color: #c4a7ff;
    font-size: 32px;
    font-weight: 800;
    margin-top: 12px;
}

/* Content cards */

.content-card {
    background: #151d32;
    border: 1px solid #303a59;
    border-radius: 15px;
    padding: 22px;
    margin-bottom: 20px;
}

/* Buttons */

.stButton > button {
    background: linear-gradient(90deg, #7040d8, #9258ed);
    color: white;
    border: 1px solid #9667ef;
    border-radius: 10px;
    padding: 10px 18px;
    font-weight: 650;
}

.stButton > button:hover {
    background: #a078f5;
    color: white;
    border: 1px solid #b99aff;
}

/* Download button */

.stDownloadButton > button {
    background: #39236b;
    color: white;
    border: 1px solid #8156d8;
    border-radius: 10px;
}

/* Inputs */

.stTextInput input,
.stTextArea textarea {
    background: #171f36;
    color: white;
    border: 1px solid #414a6b;
    border-radius: 9px;
}

div[data-baseweb="select"] > div {
    background: #171f36;
    border-color: #414a6b;
    color: white;
}

/* Dataframes */

div[data-testid="stDataFrame"] {
    border: 1px solid #343b60;
    border-radius: 12px;
}

/* File uploader */

div[data-testid="stFileUploader"] {
    background: #151d32;
    border: 1px dashed #8056cf;
    border-radius: 14px;
    padding: 15px;
}

/* Dividers */

hr {
    border-color: #303a59;
}

/* Small text */

.small-note {
    color: #929bb9;
    font-size: 13px;
}

</style>
""", unsafe_allow_html=True)


# ==========================================
# 3. SESSION STATE
# ==========================================

if "results" not in st.session_state:
    st.session_state.results = pd.DataFrame()

if "required_skills" not in st.session_state:
    st.session_state.required_skills = [
        "Python",
        "SQL",
        "Machine Learning",
        "Pandas",
        "NumPy",
        "Flask"
    ]

if "job_description" not in st.session_state:
    st.session_state.job_description = ""


# ==========================================
# 4. PDF TEXT EXTRACTION
# ==========================================

def extract_pdf_text(uploaded_file):

    try:
        reader = PyPDF2.PdfReader(
            io.BytesIO(uploaded_file.getvalue())
        )

        text = ""

        for page in reader.pages:
            text += page.extract_text() or ""

        return text

    except Exception as error:
        st.warning(
            f"Could not read {uploaded_file.name}: {error}"
        )
        return ""


# ==========================================
# 5. RESUME ANALYSIS
# ==========================================

def analyze_resume(resume_text, required_skills):

    text = re.sub(
        r"\s+", " ", resume_text.lower()
    )

    matched = []
    missing = []

    for skill in required_skills:

        pattern = (
            r"(?<![a-z0-9+#])"
            + re.escape(skill.lower())
            + r"(?![a-z0-9+#])"
        )

        if re.search(pattern, text):
            matched.append(skill)
        else:
            missing.append(skill)

    score = (
        (len(matched) / len(required_skills)) * 100
        if required_skills else 0
    )

    return matched, missing, round(score, 2)


# ==========================================
# 6. METRIC CARD
# ==========================================

def metric_card(title, value, icon):

    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">{icon} &nbsp; {title}</div>
        <div class="metric-value">{value}</div>
    </div>
    """, unsafe_allow_html=True)


# ==========================================
# 7. SIDEBAR
# ==========================================

with st.sidebar:

    st.markdown("""
    <div style="padding:12px 4px;">
        <h1 style="color:#b58aff !important;
                   font-size:28px;">
            ✦ TalentAI
        </h1>
        <p style="color:#929bb9;">
            Intelligent Recruitment
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    st.markdown("##### MAIN MENU")

    page = st.radio(
        "Navigation",
        [
            "Dashboard",
            "Resume Screening",
            "Job Requirements",
            "About"
        ],
        label_visibility="collapsed"
    )

    st.divider()

    st.markdown("##### SYSTEM STATUS")

    st.success("● Application Active")

    st.markdown("""
    <p class="small-note">
        TalentAI v2.0<br>
        Resume Intelligence Platform
    </p>
    """, unsafe_allow_html=True)


# ==========================================
# 8. DASHBOARD
# ==========================================

if page == "Dashboard":

    st.markdown("""
    <div class="hero">
        <h1>Welcome to TalentAI 👋</h1>
        <p>
            Smarter recruitment starts here.
            Screen resumes, analyze skills and discover
            promising candidates.
        </p>
    </div>
    """, unsafe_allow_html=True)

    results = st.session_state.results

    total = len(results)

    shortlisted = (
        int((results["Score"] >= 60).sum())
        if total else 0
    )

    rejected = total - shortlisted

    average = (
        round(results["Score"].mean(), 1)
        if total else 0
    )

    st.subheader("Recruitment Overview")

    c1, c2, c3, c4 = st.columns(4)

    with c1:
        metric_card(
            "Total Resumes", total, "📄"
        )

    with c2:
        metric_card(
            "Shortlisted", shortlisted, "✅"
        )

    with c3:
        metric_card(
            "Not Shortlisted", rejected, "📋"
        )

    with c4:
        metric_card(
            "Average Match", f"{average}%", "📊"
        )

    st.write("")

    left, right = st.columns([1.5, 1])

    with left:

        st.subheader("Recent Candidates")

        if total:

            st.dataframe(
                results.sort_values(
                    "Score", ascending=False
                ),
                use_container_width=True,
                hide_index=True
            )

        else:

            st.info(
                "No candidates available. "
                "Start by uploading resumes."
            )

    with right:

        st.subheader("Candidate Distribution")

        if total:

            chart = pd.DataFrame({
                "Status": [
                    "Shortlisted",
                    "Not Shortlisted"
                ],
                "Candidates": [
                    shortlisted,
                    rejected
                ]
            })

            st.bar_chart(
                chart.set_index("Status")
            )

        else:

            st.info(
                "Your analytics will appear here "
                "after resume screening."
            )

    st.caption(
        "Shortlisting currently uses a 60% keyword "
        "matching threshold."
    )


# ==========================================
# 9. RESUME SCREENING
# ==========================================

elif page == "Resume Screening":

    st.title("📄 Resume Screening")

    st.write(
        "Upload PDF resumes to evaluate candidate "
        "skills against your job requirements."
    )

    st.markdown(
        '<div class="content-card">',
        unsafe_allow_html=True
    )

    st.subheader("Upload Candidate Resumes")

    uploaded_files = st.file_uploader(
        "Choose PDF files",
        type=["pdf"],
        accept_multiple_files=True
    )

    st.markdown("</div>", unsafe_allow_html=True)

    skills = st.session_state.required_skills

    st.subheader("Skills Being Evaluated")

    st.write(
        "  •  ".join(skills)
        if skills else "No skills configured."
    )

    if st.button(
        "🚀 Analyze Resumes",
        use_container_width=True
    ):

        if not uploaded_files:

            st.warning(
                "Please upload at least one PDF resume."
            )

        elif not skills:

            st.warning(
                "Add job skills before screening resumes."
            )

        else:

            records = []

            progress = st.progress(0)

            status_text = st.empty()

            for index, file in enumerate(uploaded_files):

                status_text.write(
                    f"Analyzing: {file.name}"
                )

                text = extract_pdf_text(file)

                if not text.strip():

                    st.warning(
                        f"No readable text in {file.name}"
                    )

                    continue

                matched, missing, score = analyze_resume(
                    text, skills
                )

                status = (
                    "Shortlisted"
                    if score >= 60
                    else "Not Shortlisted"
                )

                records.append({
                    "Candidate": file.name,
                    "Score": score,
                    "Matched Skills": ", ".join(matched),
                    "Missing Skills": ", ".join(missing),
                    "Status": status
                })

                progress.progress(
                    (index + 1) / len(uploaded_files)
                )

            st.session_state.results = pd.DataFrame(records)

            status_text.empty()

            if records:

                st.success(
                    f"Successfully analyzed {len(records)} resumes!"
                )

                st.rerun()

            else:

                st.error(
                    "No readable resumes found."
                )

    results = st.session_state.results

    if not results.empty:

        st.divider()

        st.subheader("Screening Results")

        sorted_results = results.sort_values(
            "Score", ascending=False
        )

        st.dataframe(
            sorted_results,
            use_container_width=True,
            hide_index=True
        )

        csv = sorted_results.to_csv(
            index=False
        ).encode("utf-8")

        st.download_button(
            "⬇ Download Candidate Report",
            data=csv,
            file_name="talentai_results.csv",
            mime="text/csv"
        )


# ==========================================
# 10. JOB REQUIREMENTS
# ==========================================

elif page == "Job Requirements":

    st.title("⚙️ Job Requirements")

    st.write(
        "Customize the skills required for your vacancy."
    )

    skills_input = st.text_area(
        "Required Skills (comma separated)",
        value=", ".join(
            st.session_state.required_skills
        ),
        height=120
    )

    job_description = st.text_area(
        "Job Description",
        value=st.session_state.job_description,
        height=180,
        placeholder=(
            "Example: Looking for a Python developer "
            "with knowledge of SQL and Machine Learning."
        )
    )

    if st.button("💾 Save Requirements"):

        new_skills = list(dict.fromkeys(
            skill.strip()
            for skill in skills_input.split(",")
            if skill.strip()
        ))

        if not new_skills:

            st.error("Please enter at least one skill.")

        else:

            st.session_state.required_skills = new_skills

            st.session_state.job_description = (
                job_description
            )

            st.success(
                "Job requirements saved successfully!"
            )


# ==========================================
# 11. ABOUT
# ==========================================

elif page == "About":

    st.title("🤖 About TalentAI")

    st.markdown("""
    <div class="content-card">

    ### Intelligent Resume Screening Platform

    TalentAI is a Python-based recruitment assistant
    designed to simplify initial resume screening.

    **Core Features**

    - PDF resume extraction
    - Skill-based matching
    - Candidate scoring
    - Candidate ranking
    - Shortlisting
    - CSV report generation

    **Technology Stack**

    - Python
    - Streamlit
    - Pandas
    - NumPy
    - PyPDF2

    **Developer**

    Mayank Singh Satwal

    B.Tech – Computer Science and Engineering

    </div>
    """, unsafe_allow_html=True)

    st.info(
        "This version uses keyword-based matching. "
        "Advanced NLP and machine learning are "
        "planned as future enhancements."
    )

    st.caption(
        "TalentAI © 2026 | Intelligent Recruitment Platform"
    )

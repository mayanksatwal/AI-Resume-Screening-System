
import streamlit as st
import pandas as pd
import numpy as np
from PyPDF2 import PdfReader
import io

# ---------------- PAGE CONFIG ----------------

st.set_page_config(
    page_title="TalentAI | Resume Intelligence",
    page_icon="✦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------------- CUSTOM CSS ----------------

st.markdown("""
<style>

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

.stApp {
    background: linear-gradient(135deg, #080d1b, #11182c);
    color: #f5f7ff;
}

[data-testid="stSidebar"] {
    background: #0c1325;
    border-right: 1px solid #25304a;
}

[data-testid="stSidebar"] * {
    color: #e5e9f5;
}

.main-title {
    font-size: 38px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -1.5px;
}

.subtitle {
    color: #9ba9c5;
    font-size: 15px;
    margin-bottom: 25px;
}

.gradient-text {
    background: linear-gradient(90deg, #8b7bff, #41d9e8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.metric-card {
    background: linear-gradient(145deg, #182541, #111a30);
    border: 1px solid #2b3a5b;
    border-radius: 16px;
    padding: 23px;
    min-height: 125px;
}

.metric-label {
    color: #a5b2cc;
    font-size: 13px;
    font-weight: 600;
}

.metric-value {
    color: white;
    font-size: 32px;
    font-weight: 800;
    margin-top: 12px;
}

.panel {
    background: #111c32;
    border: 1px solid #293957;
    border-radius: 17px;
    padding: 23px;
    margin-bottom: 18px;
}

.section-heading {
    font-size: 21px;
    font-weight: 700;
    color: #ffffff;
}

.small-text {
    color: #9ba9c5;
    font-size: 13px;
}

div[data-testid="stFileUploader"] {
    background: #111c32;
    border: 1px dashed #7768e9;
    border-radius: 15px;
    padding: 12px;
}

.stButton > button {
    background: linear-gradient(90deg, #7565ed, #438eea);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-weight: 700;
    width: 100%;
}

.stButton > button:hover {
    border: 1px solid #a99cff;
    color: white;
    background: linear-gradient(90deg, #6254d9, #3479d5);
}

hr {
    border-color: #293957;
}

[data-testid="stMetric"] {
    background: #182541;
    padding: 15px;
    border: 1px solid #293957;
    border-radius: 13px;
}

</style>
""", unsafe_allow_html=True)


# ---------------- SKILLS ----------------

required_skills = [
    "Python",
    "SQL",
    "Machine Learning",
    "Pandas",
    "NumPy",
    "Flask"
]


# ---------------- SIDEBAR ----------------

with st.sidebar:

    st.markdown(
        "<h2>✦ <span style='color:#9585ff'>TalentAI</span></h2>",
        unsafe_allow_html=True
    )

    st.caption("SMART RECRUITMENT PLATFORM")

    st.markdown("---")

    page = st.radio(
        "NAVIGATION",
        [
            "Dashboard",
            "Resume Screening",
            "Job Requirements",
            "About Project"
        ]
    )

    st.markdown("---")

    st.markdown("### Screening Settings")

    threshold = st.slider(
        "Shortlisting Threshold",
        min_value=0,
        max_value=100,
        value=60
    )

    st.markdown("---")
    st.caption("AI Resume Intelligence v1.0")


# ---------------- HEADER ----------------

st.markdown(
    '<div class="main-title">Welcome to <span class="gradient-text">TalentAI</span></div>',
    unsafe_allow_html=True
)

st.markdown(
    '<div class="subtitle">Intelligent resume screening and candidate shortlisting platform.</div>',
    unsafe_allow_html=True
)


# ---------------- FILE UPLOAD ----------------

if "screening_results" not in st.session_state:
    st.session_state.screening_results = []

if page == "Dashboard" or page == "Resume Screening":

    st.markdown(
        '<div class="section-heading">Resume Intelligence Center</div>',
        unsafe_allow_html=True
    )

    st.markdown(
        '<p class="small-text">Upload multiple candidate resumes to analyze and rank their skill compatibility.</p>',
        unsafe_allow_html=True
    )

    uploaded_files = st.file_uploader(
        "Drag and drop PDF resumes here",
        type=["pdf"],
        accept_multiple_files=True
    )

    if st.button("✦ Analyze Resumes"):

        if not uploaded_files:
            st.warning("Please upload at least one PDF resume.")

        else:

            results = []

            progress = st.progress(0)
            status = st.empty()

            for i, uploaded_file in enumerate(uploaded_files):

                try:

                    reader = PdfReader(uploaded_file)

                    resume_text = ""

                    for page_data in reader.pages:
                        extracted = page_data.extract_text()

                        if extracted:
                            resume_text += extracted + "\n"

                    text_lower = resume_text.lower()

                    matched = [
                        skill for skill in required_skills
                        if skill.lower() in text_lower
                    ]

                    missing = [
                        skill for skill in required_skills
                        if skill not in matched
                    ]

                    score = (
                        len(matched) / len(required_skills)
                    ) * 100

                    results.append({
                        "Candidate": uploaded_file.name,
                        "Matched Skills": len(matched),
                        "Total Skills": len(required_skills),
                        "Score (%)": round(score, 2),
                        "Matched Skill Names": ", ".join(matched),
                        "Missing Skills": ", ".join(missing),
                        "Status": (
                            "Shortlisted"
                            if score >= threshold
                            else "Needs Review"
                        )
                    })

                except Exception as error:

                    st.error(
                        f"Could not process {uploaded_file.name}: {error}"
                    )

                progress.progress((i + 1) / len(uploaded_files))
                status.write(
                    f"Analyzing {i + 1} of {len(uploaded_files)} resumes..."
                )

            st.session_state.screening_results = sorted(
                results,
                key=lambda x: x["Score (%)"],
                reverse=True
            )

            status.success("Resume analysis completed!")

    # ---------------- RESULTS ----------------

    results = st.session_state.screening_results

    if results:

        df = pd.DataFrame(results)

        shortlisted = df[
            df["Score (%)"] >= threshold
        ]

        avg_score = df["Score (%)"].mean()

        st.markdown("---")
        st.markdown("### Recruitment Overview")

        c1, c2, c3, c4 = st.columns(4)

        with c1:
            st.markdown(
                f'<div class="metric-card"><div class="metric-label">TOTAL RESUMES</div><div class="metric-value">{len(df)}</div></div>',
                unsafe_allow_html=True
            )

        with c2:
            st.markdown(
                f'<div class="metric-card"><div class="metric-label">SHORTLISTED</div><div class="metric-value">{len(shortlisted)}</div></div>',
                unsafe_allow_html=True
            )

        with c3:
            st.markdown(
                f'<div class="metric-card"><div class="metric-label">AVERAGE SCORE</div><div class="metric-value">{avg_score:.1f}%</div></div>',
                unsafe_allow_html=True
            )

        with c4:
            st.markdown(
                f'<div class="metric-card"><div class="metric-label">REVIEW REQUIRED</div><div class="metric-value">{len(df)-len(shortlisted)}</div></div>',
                unsafe_allow_html=True
            )

        st.markdown("---")

        # Candidate ranking

        st.markdown("### 🏆 Top Candidates")

        top_candidates = df.head(10)

        chart_df = top_candidates.set_index("Candidate")[
            ["Score (%)"]
        ]

        st.bar_chart(chart_df, height=300)

        # Candidate table

        st.markdown("### Candidate Ranking Table")

        display_df = df[
            [
                "Candidate",
                "Matched Skills",
                "Score (%)",
                "Status"
            ]
        ]

        st.dataframe(
            display_df,
            use_container_width=True,
            hide_index=True
        )

        # Candidate details

        st.markdown("### Candidate Skill Details")

        selected_candidate = st.selectbox(
            "Select a candidate",
            df["Candidate"].tolist()
        )

        candidate = next(
            item for item in results
            if item["Candidate"] == selected_candidate
        )

        left, right = st.columns(2)

        with left:

            st.markdown("#### ✅ Matched Skills")

            if candidate["Matched Skill Names"]:
                for skill in candidate["Matched Skill Names"].split(", "):
                    st.success(skill)
            else:
                st.info("No matched skills.")

        with right:

            st.markdown("#### 📌 Missing Skills")

            if candidate["Missing Skills"]:
                for skill in candidate["Missing Skills"].split(", "):
                    st.warning(skill)
            else:
                st.success("All required skills matched!")

        st.metric(
            "Candidate Skill Match",
            f'{candidate["Score (%)"]:.2f}%'
        )

        st.progress(
            int(candidate["Score (%)"])
        )

        # Download reports

        st.markdown("---")
        st.markdown("### Export Screening Report")

        csv_data = df.to_csv(index=False).encode("utf-8")

        st.download_button(
            label="⬇ Download Complete Report (CSV)",
            data=csv_data,
            file_name="resume_screening_report.csv",
            mime="text/csv"
        )

    else:

        st.markdown("---")

        st.info(
            "Your dashboard is ready. Upload PDF resumes and click Analyze Resumes to see results."
        )


# ---------------- JOB REQUIREMENTS ----------------

elif page == "Job Requirements":

    st.markdown("## Job Requirements")

    st.write(
        "The current screening model checks resumes against these skills:"
    )

    for skill in required_skills:
        st.success(skill)

    st.info(
        "These are demonstration requirements. You can customize them in app.py."
    )


# ---------------- ABOUT PROJECT ----------------

elif page == "About Project":

    st.markdown("## About TalentAI")

    st.write(
        """
        TalentAI is an academic prototype for resume screening
        and candidate shortlisting.

        It uses Python, NumPy, Pandas, PyPDF2 and Streamlit.

        The current model uses keyword-based skill matching
        to calculate a candidate's skill compatibility score.
        """
    )

    st.markdown("### Technologies Used")

    technologies = [
        "Python",
        "NumPy",
        "Pandas",
        "Streamlit",
        "PyPDF2"
    ]

    for technology in technologies:
        st.success(technology)

    st.warning(
        "This prototype is a screening aid, not a validated hiring model. "
        "Scores should not be used as the sole basis for hiring decisions."
    )


# ---------------- FOOTER ----------------

st.markdown("---")

st.markdown(
    """
    <div style="text-align:center;color:#8291ad;padding:15px;">
        ✦ TalentAI | AI-Powered Resume Screening System
        <br>
        <small>Academic Project Prototype</small>
    </div>
    """,
    unsafe_allow_html=True
)

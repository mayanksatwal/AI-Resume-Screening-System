
from backend.ml_engine import analyze_resume

job_description = """
Python developer with knowledge of SQL,
Machine Learning, NumPy, Pandas and Flask.
"""

resume_text = """
I have experience in Python programming,
SQL databases, Machine Learning,
NumPy and Pandas.
"""

result = analyze_resume(job_description, resume_text)

print("TalentAI ML Analysis")
print("--------------------")
print("ML Score:", result["ml_score"])
print("ML Status:", result["ml_status"])

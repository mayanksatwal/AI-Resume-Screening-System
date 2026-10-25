
import re
import math
from collections import Counter


def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9+#.\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text):
    return clean_text(text).split()


def calculate_similarity(job_description, resume_text):
    job_words = tokenize(job_description)
    resume_words = tokenize(resume_text)

    if not job_words or not resume_words:
        return 0.0

    job_counts = Counter(job_words)
    resume_counts = Counter(resume_words)
    vocabulary = set(job_counts) | set(resume_counts)

    dot_product = sum(
        job_counts[word] * resume_counts[word]
        for word in vocabulary
    )

    job_length = math.sqrt(sum(v ** 2 for v in job_counts.values()))
    resume_length = math.sqrt(sum(v ** 2 for v in resume_counts.values()))

    if job_length == 0 or resume_length == 0:
        return 0.0

    similarity = dot_product / (job_length * resume_length)
    return round(similarity * 100, 2)


def generate_resume_summary(resume_text, max_sentences=4):
    """Create a short extractive summary using sentences from the resume."""

    text = re.sub(r"\s+", " ", resume_text).strip()

    if not text:
        return "No readable text was found in this resume."

    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip().split()) >= 5
    ]

    if not sentences:
        return text[:500]

    keywords = {
        "python", "java", "javascript", "sql", "machine learning",
        "data analysis", "react", "node", "flask", "django",
        "communication", "leadership", "project", "developer",
        "engineering", "experience", "education", "certification"
    }

    scored_sentences = []

    for index, sentence in enumerate(sentences):
        sentence_lower = sentence.lower()
        score = sum(
            1 for keyword in keywords
            if keyword in sentence_lower
        )

        # Give a small preference to earlier resume sentences.
        score += max(0, 1 - index * 0.02)

        scored_sentences.append((score, index, sentence))

    selected = sorted(
        scored_sentences,
        key=lambda item: item[0],
        reverse=True
    )[:max_sentences]

    selected.sort(key=lambda item: item[1])

    return " ".join(item[2] for item in selected)


def analyze_resume(job_description, resume_text):
    score = calculate_similarity(job_description, resume_text)

    if score >= 50:
        status = "Strong Match"
    elif score >= 25:
        status = "Moderate Match"
    else:
        status = "Low Match"

    summary = generate_resume_summary(resume_text)

    return {
        "ml_score": score,
        "ml_status": status,
        "summary": summary
    }

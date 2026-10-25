import { useState } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Brain,
  Award,
  Target,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

function ScoreBar({ label, value, color = "bg-purple-500" }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function Screening() {
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== selectedFiles.length) {
      setError("Only PDF files are supported.");
    } else {
      setError("");
    }

    setFiles((previous) => {
      const combined = [...previous, ...pdfFiles];
      return combined.filter(
        (file, index, array) =>
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified
          ) === index
      );
    });

    event.target.value = "";
  };

  const removeFile = (indexToRemove) => {
    setFiles((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleScreening = async () => {
    setError("");
    setSuccess("");
    setResults([]);

    if (!jobDescription.trim()) {
      setError("Please enter the job description.");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one PDF resume.");
      return;
    }

    const token = sessionStorage.getItem("talentai_token");

    if (!token) {
      setError("Your login session is missing. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("job_description", jobDescription);

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/screen-resumes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      if (response.status === 403) {
        throw new Error("You are not authorized to perform this action.");
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Screening failed (${response.status}).`
        );
      }

      setResults(data.results || []);
      setSuccess(
        data.message || "Resume screening completed successfully."
      );
    } catch (err) {
      console.error("Resume screening error:", err);

      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to TalentAI backend. Please check the server."
          : err.message || "Something went wrong during screening."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJobDescription("");
    setFiles([]);
    setResults([]);
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-purple-300 mb-2">
              <Sparkles size={18} />
              <span className="text-sm font-medium">
                AI POWERED RECRUITMENT
              </span>
            </div>
            <h1 className="text-3xl font-bold">Resume Screening</h1>
            <p className="text-gray-400 mt-2">
              Compare candidate resumes against your job requirements.
            </p>
          </div>

          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-purple-500/15 text-purple-300">
                <Target size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Job Requirements</h2>
                <p className="text-gray-400 text-sm">
                  Enter the job description and required skills.
                </p>
              </div>
            </div>

            <label className="block text-sm text-gray-300 mb-2">
              Job Description
            </label>

            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Example: We are looking for a Python developer with SQL, Machine Learning, Pandas, NumPy and Flask experience..."
              className="w-full h-56 resize-y rounded-xl bg-[#11182b] border border-white/10 p-4 text-white placeholder-gray-500 outline-none focus:border-purple-500"
            />

            <p className="text-gray-500 text-xs mt-2">
              Include responsibilities, qualifications and important skills.
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-blue-500/15 text-blue-300">
                <UploadCloud size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Upload Resumes</h2>
                <p className="text-gray-400 text-sm">
                  Select one or more candidate PDF files.
                </p>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center min-h-56 rounded-xl border-2 border-dashed border-purple-400/40 bg-purple-500/5 hover:bg-purple-500/10 cursor-pointer transition">
              <UploadCloud size={42} className="text-purple-300 mb-3" />
              <span className="font-medium">
                Click to upload PDF resumes
              </span>
              <span className="text-gray-500 text-sm mt-2">
                You can select multiple PDF files
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Selected files
                </span>
                <span className="text-xs text-purple-300">
                  {files.length} file(s)
                </span>
              </div>

              {files.length === 0 ? (
                <div className="text-sm text-gray-500 bg-[#11182b] rounded-xl p-4 text-center">
                  No resumes selected yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center justify-between gap-3 bg-[#11182b] rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          size={18}
                          className="text-purple-300 shrink-0"
                        />
                        <span className="text-sm text-gray-300 truncate">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <button
          onClick={handleScreening}
          disabled={loading}
          className="w-full mt-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Screening Resumes...
            </>
          ) : (
            <>
              <Brain size={20} />
              Screen Resumes
            </>
          )}
        </button>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-300">
            <CheckCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {results.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <Award size={25} className="text-purple-300" />
              <div>
                <h2 className="text-2xl font-bold">Screening Results</h2>
                <p className="text-gray-400 text-sm">
                  {results.length} candidate result(s) returned by the backend.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {results.map((candidate, index) => {
                const score = Number(
                  candidate.score ?? candidate.final_score ?? 0
                );
                const matchedSkills = candidate.matched_skills || [];
                const missingSkills = candidate.missing_skills || [];

                return (
                  <article
                    key={`${candidate.filename || "candidate"}-${index}`}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-3 rounded-xl bg-purple-500/15 text-purple-300">
                          <FileText size={22} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {candidate.filename || `Candidate ${index + 1}`}
                          </h3>
                          <p className="text-gray-500 text-xs">
                            Resume screening result
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-300">
                          {score}%
                        </div>
                        <div className="text-xs text-gray-400">
                          Match score
                        </div>
                      </div>
                    </div>

                    <ScoreBar
                      label="Overall match"
                      value={score}
                      color="bg-purple-500"
                    />

                    {candidate.skill_score !== undefined && (
                      <ScoreBar
                        label="Skill match"
                        value={candidate.skill_score}
                        color="bg-blue-500"
                      />
                    )}

                    {candidate.similarity_score !== undefined && (
                      <ScoreBar
                        label="Text similarity"
                        value={candidate.similarity_score}
                        color="bg-indigo-500"
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                      <div>
                        <h4 className="text-sm font-semibold text-green-300 mb-3">
                          Matched Skills ({matchedSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matchedSkills.length > 0 ? (
                            matchedSkills.map((skill, skillIndex) => (
                              <span
                                key={`${skill}-${skillIndex}`}
                                className="px-3 py-1 rounded-full bg-green-500/10 text-green-300 text-xs"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">
                              No matched skills returned.
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-red-300 mb-3">
                          Missing Skills ({missingSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {missingSkills.length > 0 ? (
                            missingSkills.map((skill, skillIndex) => (
                              <span
                                key={`${skill}-${skillIndex}`}
                                className="px-3 py-1 rounded-full bg-red-500/10 text-red-300 text-xs"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">
                              No missing skills returned.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {candidate.status && (
                      <p className="mt-5 pt-4 border-t border-white/10 text-sm text-gray-400">
                        Status: {candidate.status}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-5">
              Match scores are decision-support estimates, not final hiring
              decisions. Review each candidate's resume manually.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
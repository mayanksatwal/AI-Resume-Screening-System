import { useEffect, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import * as XLSX from "xlsx";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

function HistoryPage({ token }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadHistory() {
    if (!token) {
      setRecords([]);
      setError("Please log in again to view screening history.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/screening-history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error("Could not load screening history.");
      }

      const data = await response.json();

      const history = Array.isArray(data)
        ? data
        : data.history || data.records || data.results || [];

      setRecords(Array.isArray(history) ? history : []);
    } catch (err) {
      setError(err.message || "Unable to connect to TalentAI backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [token]);

  const filteredRecords = records.filter((record) =>
    (record.filename || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const shortlisted = records.filter((record) =>
    String(record.status || "").toLowerCase().includes("shortlisted")
  ).length;

  const averageScore = records.length
    ? (
        records.reduce(
          (total, record) => total + Number(record.score || 0),
          0
        ) / records.length
      ).toFixed(2)
    : "0.00";

  function exportExcel() {
    if (filteredRecords.length === 0) {
      alert("No records available to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredRecords.map((record) => ({
        Filename: record.filename || "",
        Score: record.score ?? 0,
        Status: record.status || "",
        Matched_Skills: Array.isArray(record.matched_skills)
          ? record.matched_skills.join(", ")
          : "",
        Missing_Skills: Array.isArray(record.missing_skills)
          ? record.missing_skills.join(", ")
          : "",
        Screened_At: record.screened_at || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Screening History"
    );

    XLSX.writeFile(workbook, "TalentAI_Screening_History.xlsx");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Screening History</h1>
          <p className="mt-2 text-gray-400">
            View your previous resume screening results.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={exportExcel}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-3 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Resumes" value={records.length} />
        <StatCard title="Shortlisted" value={shortlisted} />
        <StatCard title="Average Score" value={`${averageScore}%`} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#11162b] p-5">
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resume filename..."
            className="w-full bg-transparent text-white outline-none"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Loading history...</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-400">{error}</p>
            <button onClick={loadHistory} className="text-purple-400">
              Try again
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <p className="py-8 text-center text-gray-400">
            {records.length === 0
              ? "No screening records yet. Upload resumes to get started."
              : "No records match your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/10 text-gray-400">
                <tr>
                  <th className="p-3">Resume</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Screened At</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className="border-b border-white/5"
                  >
                    <td className="p-3">
                      {record.filename || "Unnamed resume"}
                    </td>
                    <td className="p-3">
                      {Number(record.score || 0).toFixed(1)}%
                    </td>
                    <td className="p-3">
                      {record.status || "Not available"}
                    </td>
                    <td className="p-3 text-gray-400">
                      {record.screened_at
                        ? new Date(record.screened_at).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11162b] p-5">
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className="mt-3 text-3xl font-bold">{value}</h2>
    </div>
  );
}

export default HistoryPage;
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileSearch,
  History,
  BarChart3,
  Bell,
  Search,
  Menu,
  X,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  AlertCircle,
  Sparkles,
  BrainCircuit,
  LogOut,
  ChevronRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Screening from "./Screening.jsx";
import HistoryPage from "./pages/history.jsx";

const API =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Candidates", icon: Users },
  { name: "Resume Screening", icon: FileSearch },
  { name: "Screening History", icon: History },
  { name: "Analytics", icon: BarChart3 },
];

const COLORS = ["#A78BFA", "#38BDF8"];

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

async function fetchHistory(token) {
  if (!token) {
    throw new Error("Please log in again to view screening records.");
  }

  const response = await fetch(`${API}/screening-history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error("Unable to load screening records.");
  }

  const data = await response.json();

  const history = Array.isArray(data)
    ? data
    : data.history || data.records || data.results || [];

  return Array.isArray(history) ? history : [];
}

function useScreeningRecords(token) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    if (!token) {
      setRecords([]);
      setError("Please log in to view screening records.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const history = await fetchHistory(token);
      setRecords(history);
    } catch (err) {
      setRecords([]);
      setError(err.message || "Unable to load screening records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  return { records, loading, error, refresh };
}

const isShortlisted = (record) =>
  String(record.status || "").toLowerCase().includes("shortlisted");

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    const duration = 900;

    let frame;

    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(target * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(update);
      }
    };

    frame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{Number(display.toFixed(1))}</>;
}

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{
          x: [0, 35, 0],
          y: [0, -25, 0],
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-purple-700/15 blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 35, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(#64748b10_1px,transparent_1px)] [background-size:28px_28px]" />
    </div>
  );
}

function PageHeading({ title, description, refresh, loading }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
          <Sparkles size={14} /> TalentAI Intelligence
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>

      {refresh && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 backdrop-blur-xl transition hover:border-purple-400/40 hover:bg-purple-500/10 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </motion.button>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, accent, suffix = "" }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-xl"
    >
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${accent} opacity-[0.12] blur-2xl transition duration-500 group-hover:opacity-30`}
      />

      <div className="relative flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>

        <div
          className={`rounded-xl border border-white/10 bg-white/5 p-3 ${accent.replace("bg-", "text-")}`}
        >
          <Icon size={20} />
        </div>
      </div>

      <div className="relative mt-6">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          <AnimatedNumber value={value} />
          {suffix}
        </h2>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "75%" }}
            transition={{ duration: 1.1, delay: 0.2 }}
            className={`h-full rounded-full ${accent}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
      <AlertCircle size={18} />
      {children}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="py-12 text-center text-sm text-slate-400">
      <FileText size={32} className="mx-auto mb-3 opacity-40" />
      {children}
    </div>
  );
}

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-xl shadow-black/10 backdrop-blur-xl";

// =====================================================
// OVERVIEW
// =====================================================

function Overview({ token, onNavigate }) {
  const { records, loading, error, refresh } =
    useScreeningRecords(token);

  const shortlisted = records.filter(isShortlisted).length;
  const review = records.length - shortlisted;

  const scores = records
    .map((item) => Number(item.score))
    .filter(Number.isFinite);

  const average = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const chartData = [
    { name: "Shortlisted", count: shortlisted },
    { name: "Needs Review", count: review },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <PageHeading
        title="Welcome back"
        description="Here's what's happening in your recruitment workspace."
        refresh={refresh}
        loading={loading}
      />

      <ErrorMessage>{error}</ErrorMessage>

      <motion.div
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="visible"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total Resumes"
          value={records.length}
          icon={FileText}
          accent="bg-purple-500"
        />

        <StatCard
          title="Shortlisted"
          value={shortlisted}
          icon={CheckCircle2}
          accent="bg-emerald-500"
        />

        <StatCard
          title="Needs Review"
          value={review}
          icon={Clock3}
          accent="bg-orange-500"
        />

        <StatCard
          title="Average Match"
          value={average}
          suffix="%"
          icon={BarChart3}
          accent="bg-blue-500"
        />
      </motion.div>

      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`${panelClass} xl:col-span-2`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Screening Overview
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Candidate status distribution
              </p>
            </div>

            <span className="rounded-lg bg-purple-500/10 px-3 py-2 text-xs text-purple-300">
              Live records
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  stroke="#263047"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#9B7AFF"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-600/25 via-[#17132e] to-[#10182c] p-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-purple-300/10"
          />

          <div className="relative">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-400/15 text-purple-200">
              <BrainCircuit size={25} />
            </div>

            <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">
              AI powered
            </span>

            <h2 className="mt-3 text-2xl font-bold text-white">
              Intelligent Resume Screening
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Compare resumes against job descriptions and
              organize skills-based screening results.
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate("Resume Screening")}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30"
            >
              Start Screening <ArrowUpRight size={17} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`${panelClass} mt-7`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Recent Activity
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Your latest screening records
            </p>
          </div>

          <button
            onClick={() => onNavigate("Screening History")}
            className="text-sm text-purple-300 hover:text-purple-200"
          >
            View all <ChevronRight size={15} className="inline" />
          </button>
        </div>

        {loading ? (
          <EmptyState>Loading records...</EmptyState>
        ) : records.length === 0 ? (
          <EmptyState>No screening records yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-3">Resume</th>
                  <th className="py-3">Score</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {records.slice(0, 5).map((record, index) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.06 }}
                    key={record.id || index}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >
                    <td className="py-4 text-white">
                      {record.filename || "Unnamed resume"}
                    </td>
                    <td className="py-4 font-semibold text-purple-300">
                      {Number(record.score || 0).toFixed(1)}%
                    </td>
                    <td className="py-4 text-slate-300">
                      {record.status || "—"}
                    </td>
                    <td className="py-4 text-slate-400">
                      {record.screened_at
                        ? new Date(record.screened_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// CANDIDATES
// =====================================================

function Candidates({ token, searchTerm }) {
  const { records, loading, error, refresh } =
    useScreeningRecords(token);

  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const query = searchTerm.toLowerCase().trim();

      const matchedSkills = Array.isArray(record.matched_skills)
        ? record.matched_skills.join(" ")
        : "";

      const matchesSearch =
        !query ||
        String(record.filename || "").toLowerCase().includes(query) ||
        matchedSkills.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        (filter === "Shortlisted"
          ? isShortlisted(record)
          : !isShortlisted(record));

      return matchesSearch && matchesFilter;
    });
  }, [records, searchTerm, filter]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <PageHeading
        title="Candidates"
        description="Search and review your screened resume records."
        refresh={refresh}
        loading={loading}
      />

      <ErrorMessage>{error}</ErrorMessage>

      <div
        className={`${panelClass} mb-6 flex flex-wrap items-center justify-between gap-4`}
      >
        <div>
          <p className="text-sm text-slate-400">Total records</p>
          <h2 className="mt-1 text-3xl font-bold text-white">
            {records.length}
          </h2>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
        >
          <option>All</option>
          <option>Shortlisted</option>
          <option>Needs Review</option>
        </select>
      </div>

      <div className={panelClass}>
        <h2 className="mb-5 font-semibold text-white">
          Candidate Records
        </h2>

        {loading ? (
          <EmptyState>Loading records...</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>No matching records found.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-4">Resume</th>
                  <th className="py-4">Score</th>
                  <th className="py-4">Matched Skills</th>
                  <th className="py-4">Missing Skills</th>
                  <th className="py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((record, index) => (
                  <motion.tr
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    key={record.id || index}
                    className="border-b border-white/5 hover:bg-white/[0.025]"
                  >
                    <td className="py-4 text-white">
                      {record.filename || "Unnamed resume"}
                    </td>
                    <td className="py-4 text-purple-300">
                      {Number(record.score || 0).toFixed(1)}%
                    </td>
                    <td className="max-w-48 py-4 text-green-300">
                      {Array.isArray(record.matched_skills)
                        ? record.matched_skills.join(", ") || "—"
                        : "—"}
                    </td>
                    <td className="max-w-48 py-4 text-orange-300">
                      {Array.isArray(record.missing_skills)
                        ? record.missing_skills.join(", ") || "—"
                        : "—"}
                    </td>
                    <td className="py-4 text-slate-300">
                      {record.status || "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          Records are identified by resume filename. Separate
          candidate profiles are not stored by the current API.
        </p>
      </div>
    </motion.div>
  );
}

// =====================================================
// ANALYTICS
// =====================================================

function Analytics({ token }) {
  const { records, loading, error, refresh } =
    useScreeningRecords(token);

  const shortlisted = records.filter(isShortlisted).length;
  const review = records.length - shortlisted;

  const scores = records
    .map((record) => Number(record.score))
    .filter(Number.isFinite);

  const average = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const scoreGroups = [
    { name: "0–39%", count: 0 },
    { name: "40–59%", count: 0 },
    { name: "60–79%", count: 0 },
    { name: "80–100%", count: 0 },
  ];

  records.forEach((record) => {
    const score = Number(record.score) || 0;

    if (score < 40) scoreGroups[0].count++;
    else if (score < 60) scoreGroups[1].count++;
    else if (score < 80) scoreGroups[2].count++;
    else scoreGroups[3].count++;
  });

  const statusData = [
    { name: "Shortlisted", value: shortlisted },
    { name: "Needs Review", value: review },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <PageHeading
        title="Analytics"
        description="Explore match scores and screening performance."
        refresh={refresh}
        loading={loading}
      />

      <ErrorMessage>{error}</ErrorMessage>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          title="Total Screened"
          value={records.length}
          icon={FileText}
          accent="bg-purple-500"
        />
        <StatCard
          title="Average Score"
          value={average}
          suffix="%"
          icon={BarChart3}
          accent="bg-blue-500"
        />
        <StatCard
          title="Shortlisted"
          value={shortlisted}
          icon={CheckCircle2}
          accent="bg-emerald-500"
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <div className={panelClass}>
          <h2 className="font-semibold text-white">
            Match Score Distribution
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Resumes grouped by recorded score
          </p>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreGroups}>
                <CartesianGrid
                  stroke="#263047"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis
                  allowDecimals={false}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#9B7AFF"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={panelClass}>
          <h2 className="font-semibold text-white">
            Screening Status
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Current status breakdown
          </p>

          <div className="mt-6 h-72">
            {records.length === 0 ? (
              <EmptyState>No analytics data available.</EmptyState>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                    animationDuration={1200}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-slate-300">
            <span>● Shortlisted: {shortlisted}</span>
            <span>● Needs Review: {review}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// MAIN DASHBOARD
// =====================================================

export default function Dashboard({ user, token, onLogout }) {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [workspaceUser, setWorkspaceUser] = useState(user);

  useEffect(() => {
    setWorkspaceUser(user);
  }, [user]);

  const { records: notifications } = useScreeningRecords(token);

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setNotificationsOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case "Overview":
        return (
          <Overview
            token={token}
            onNavigate={navigate}
          />
        );

      case "Candidates":
        return (
          <Candidates
            token={token}
            searchTerm={searchTerm}
          />
        );

      case "Resume Screening":
        return <Screening token={token} />;

      case "Screening History":
        return <HistoryPage token={token} />;

      case "Analytics":
        return <Analytics token={token} />;

      default:
        return (
          <Overview
            token={token}
            onNavigate={navigate}
          />
        );
    }
  };

  const displayName =
    workspaceUser?.full_name ||
    workspaceUser?.email ||
    "Workspace";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080B18] text-white">
      <AmbientBackground />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : 0 }}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.08] bg-[#0C1222]/95 backdrop-blur-2xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/[0.08] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-900/40">
              <BrainCircuit size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Talent<span className="text-purple-400">AI</span>
              </h1>
              <p className="text-[9px] font-semibold tracking-[0.25em] text-slate-500">
                INTELLIGENCE
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            <X />
          </button>
        </div>

        <div className="px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace Menu
          </p>

          <nav className="space-y-2">
            {navigation.map(({ name, icon: Icon }) => {
              const active = activePage === name;

              return (
                <motion.button
                  key={name}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(name)}
                  className={`relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-3.5 text-sm transition ${
                    active
                      ? "bg-gradient-to-r from-purple-600/25 to-indigo-600/10 text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="activeNavigation"
                      className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-purple-400"
                    />
                  )}

                  <Icon
                    size={19}
                    className={active ? "text-purple-300" : ""}
                  />

                  <span className="flex-1 text-left">{name}</span>

                  {active && (
                    <ChevronRight
                      size={15}
                      className="text-purple-300"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="relative overflow-hidden rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-600/15 to-indigo-600/5 p-4">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-purple-500/20 blur-2xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-200">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {workspaceUser?.company_name || "My Workspace"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {workspaceUser?.email || "Workspace account"}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="mt-4 flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut size={15} /> Log out
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-[10px] tracking-wider text-slate-600">
            TALENTAI • AI RECRUITMENT
          </p>
        </div>
      </motion.aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#080B18]/75 px-5 backdrop-blur-2xl md:px-8">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </motion.button>

            <div>
              <p className="text-sm font-semibold text-white">
                {activePage}
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Your intelligent recruitment workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 md:flex">
              <Search size={16} className="text-slate-500" />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);

                  if (e.target.value.trim()) {
                    setActivePage("Candidates");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate("Candidates");
                  }
                }}
                placeholder="Search resumes..."
                className="w-36 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 lg:w-48"
              />
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={() =>
                  setNotificationsOpen((open) => !open)
                }
                className="relative rounded-xl border border-white/10 bg-white/[0.035] p-3 text-slate-300 hover:bg-white/10"
                aria-label="Notifications"
              >
                <Bell size={18} />

                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_10px_#a78bfa]" />
                )}
              </motion.button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 top-14 z-50 w-80 max-w-[85vw] rounded-2xl border border-white/10 bg-[#111827]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-white">
                        Recent Activity
                      </h3>

                      <button
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <p className="py-5 text-center text-sm text-slate-400">
                        No screening activity yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.slice(0, 5).map((record, index) => (
                          <div
                            key={record.id || index}
                            className="border-b border-white/5 pb-3 last:border-0"
                          >
                            <p className="break-all text-sm text-white">
                              {record.filename || "Resume screened"}
                            </p>

                            <p className="mt-1 text-xs text-purple-300">
                              {Number(record.score || 0).toFixed(1)}% match
                              {" · "}
                              {record.status || "Processed"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => navigate("Screening History")}
                      className="mt-3 w-full rounded-xl bg-purple-500/15 py-2.5 text-sm font-medium text-purple-300 transition hover:bg-purple-500/25"
                    >
                      View all activity
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden h-10 w-px bg-white/10 sm:block" />

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/30 bg-gradient-to-br from-purple-500 to-indigo-600 font-bold text-white shadow-lg shadow-purple-900/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-5 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activePage}>
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
import { useState } from "react";
import {
  Building2,
  Mail,
  Lock,
  UserPlus,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

export default function Signup({ onSignup, onShowLogin }) {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !companyName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Registration failed."
        );
      }

      if (data.access_token && data.user) {
        onSignup({
          token: data.access_token,
          user: data.user,
        });
      } else {
        onShowLogin(email.trim());
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to TalentAI backend. Please check the server."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b18] text-white flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-purple-500/15 text-purple-300 mb-4">
            <Sparkles size={30} />
          </div>

          <h1 className="text-4xl font-bold">
            Talent<span className="text-purple-400">AI</span>
          </h1>

          <p className="text-gray-400 mt-2">
            Create your company account
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          className="bg-white/5 border border-white/10 rounded-2xl p-7 space-y-5"
        >
          <h2 className="text-2xl font-semibold">Create Account</h2>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Company Name
            </label>

            <div className="relative">
              <Building2
                className="absolute left-3 top-3.5 text-gray-500"
                size={19}
              />

              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Demo Technologies"
                required
                minLength={2}
                maxLength={120}
                className="w-full bg-[#11182b] border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Company Email
            </label>

            <div className="relative">
              <Mail
                className="absolute left-3 top-3.5 text-gray-500"
                size={19}
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className="w-full bg-[#11182b] border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3 top-3.5 text-gray-500"
                size={19}
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                className="w-full bg-[#11182b] border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Confirm Password
            </label>

            <div className="relative">
              <Lock
                className="absolute left-3 top-3.5 text-gray-500"
                size={19}
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter password again"
                autoComplete="new-password"
                maxLength={128}
                required
                className="w-full bg-[#11182b] border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2"
          >
            <UserPlus size={19} />
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onShowLogin}
              className="text-purple-300 hover:text-purple-200 font-semibold"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
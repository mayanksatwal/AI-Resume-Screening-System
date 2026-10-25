
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import {
  Building2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BriefcaseBusiness,
  FileSearch,
  ChartNoAxesCombined,
  CheckCircle2,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";
import "./Login.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      "Cannot connect to TalentAI server. Please check that the backend is running."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    const detail = data.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : "Request failed. Please try again."
    );
  }

  return data;
}

export default function Login({ onLogin, initialSetupToken = "" }) {
  const [mode, setMode] = useState(
    initialSetupToken ? "setup" : "login"
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    full_name: "",
    email: "",
    password: "",
  });

  const [setupToken, setSetupToken] = useState(initialSetupToken);
  const [setupCompany, setSetupCompany] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const saveSession = async (token) => {
    if (!token) {
      throw new Error("The server did not return an access token.");
    }

    const user = await apiRequest("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!user || typeof user !== "object") {
      throw new Error("Unable to retrieve your account information.");
    }

    sessionStorage.setItem("talentai_token", token);
    sessionStorage.setItem(
      "talentai_user",
      JSON.stringify(user)
    );

    if (typeof onLogin === "function") {
      onLogin(token, user);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const isRegister = mode === "register";

      if (isRegister && form.password.length < 10) {
        throw new Error(
          "Password must contain at least 10 characters."
        );
      }

      const endpoint = isRegister
        ? "/auth/register"
        : "/auth/login";

      const payload = isRegister
        ? {
            company_name: form.company_name.trim(),
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const data = await apiRequest(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (data.setup_required) {
        if (!data.access_token) {
          throw new Error("The server did not return a setup token.");
        }

        setSetupToken(data.access_token);
        setSetupCompany(data.company?.company_name || "");
        setMode("setup");
        setSuccess("Please complete your company workspace setup.");
        return;
      }

      await saveSession(data.access_token);
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    clearMessages();
    setLoading(true);

    try {
      if (!credentialResponse?.credential) {
        throw new Error("Google did not return a login credential.");
      }

      const data = await apiRequest("/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      if (!data.access_token) {
        throw new Error("The server did not return an access token.");
      }

      if (data.setup_required) {
        setSetupToken(data.access_token);
        setSetupCompany(data.company?.company_name || "");
        setMode("setup");
        setSuccess("Enter your company name to continue.");
        return;
      }

      await saveSession(data.access_token);
    } catch (err) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (event) => {
    event.preventDefault();
    clearMessages();

    if (setupCompany.trim().length < 2) {
      setError("Company name must contain at least 2 characters.");
      return;
    }

    if (!setupToken) {
      setError("Your setup session has expired. Please sign in again.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${setupToken}`,
        },
        body: JSON.stringify({
          company_name: setupCompany.trim(),
        }),
      });

      if (!data.access_token) {
        throw new Error(
          "The setup API did not return a new access token."
        );
      }

      await saveSession(data.access_token);
    } catch (err) {
      setError(err.message || "Unable to complete company setup.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    clearMessages();
    setShowPassword(false);

    setForm({
      company_name: "",
      full_name: "",
      email: "",
      password: "",
    });
  };

  const signOut = () => {
    sessionStorage.removeItem("talentai_token");
    sessionStorage.removeItem("talentai_user");

    setSetupToken("");
    setSetupCompany("");
    setMode("login");
    clearMessages();
  };

  return (
    <main className="talentai-auth">
      <div className="auth-background">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-grid" />
      </div>

      <div className="auth-layout">
        <motion.section
          className="auth-showcase"
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="brand">
            <div className="brand-icon">
              <Sparkles size={23} />
            </div>
            <span>
              Talent<span className="brand-highlight">AI</span>
            </span>
          </div>

          <div className="showcase-content">
            <div className="showcase-tag">
              <span className="live-dot" />
              INTELLIGENT RECRUITMENT PLATFORM
            </div>

            <h1>
              Hire smarter.
              <br />
              Build your
              <br />
              <span>best team.</span>
            </h1>

            <p className="showcase-description">
              Transform your recruitment process with intelligent resume
              screening, candidate insights and streamlined shortlisting.
            </p>

            <div className="showcase-features">
              <div className="showcase-feature">
                <div className="feature-icon">
                  <FileSearch size={20} />
                </div>
                <div>
                  <strong>AI Resume Screening</strong>
                  <p>Analyze resumes against job requirements.</p>
                </div>
              </div>

              <div className="showcase-feature">
                <div className="feature-icon">
                  <ChartNoAxesCombined size={20} />
                </div>
                <div>
                  <strong>Candidate Insights</strong>
                  <p>Understand skills and matching scores.</p>
                </div>
              </div>

              <div className="showcase-feature">
                <div className="feature-icon">
                  <BriefcaseBusiness size={20} />
                </div>
                <div>
                  <strong>Smarter Shortlisting</strong>
                  <p>Organize candidates in one workspace.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <ShieldCheck size={17} />
            Secure company workspace
            <span>•</span>
            Built for modern recruitment
          </div>
        </motion.section>

        <motion.section
          className="auth-card"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {mode === "setup" ? (
              <motion.div
                key="setup"
                className="auth-form-content"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
              >
                <button
                  className="back-button"
                  type="button"
                  onClick={signOut}
                  disabled={loading}
                >
                  <ArrowLeft size={17} />
                  Sign out
                </button>

                <div className="form-icon">
                  <Building2 size={25} />
                </div>

                <div className="form-heading">
                  <span className="eyebrow">WORKSPACE SETUP</span>
                  <h2>Set up your company</h2>
                  <p>
                    Give your TalentAI workspace a name to get started.
                  </p>
                </div>

                <form onSubmit={handleSetup}>
                  <label htmlFor="setupCompany">Company name</label>

                  <div className="input-wrap">
                    <Building2 size={18} />
                    <input
                      id="setupCompany"
                      type="text"
                      value={setupCompany}
                      onChange={(e) => setSetupCompany(e.target.value)}
                      placeholder="Enter your company name"
                      minLength={2}
                      maxLength={120}
                      required
                    />
                  </div>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="spin" size={19} />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Save and Continue
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                {error && (
                  <div className="message error-message" role="alert">
                    <span>!</span>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="message success-message" role="status">
                    <CheckCircle2 size={17} />
                    {success}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                className="auth-form-content"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
              >
                <div className="mobile-brand">
                  <div className="brand-icon">
                    <Sparkles size={21} />
                  </div>
                  Talent<span className="brand-highlight">AI</span>
                </div>

                <div className="form-heading">
                  <span className="eyebrow">
                    {mode === "register"
                      ? "CREATE YOUR WORKSPACE"
                      : "WELCOME BACK"}
                  </span>

                  <h2>
                    {mode === "register"
                      ? "Create your account"
                      : "Welcome back"}
                  </h2>

                  <p>
                    {mode === "register"
                      ? "Start building a smarter recruitment process."
                      : "Sign in to continue to your TalentAI dashboard."}
                  </p>
                </div>

                <div className="auth-tabs">
                  <button
                    type="button"
                    className={mode === "login" ? "active" : ""}
                    onClick={() => switchMode("login")}
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    className={mode === "register" ? "active" : ""}
                    onClick={() => switchMode("register")}
                  >
                    Create account
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {mode === "register" && (
                    <>
                      <label htmlFor="company_name">Company name</label>
                      <div className="input-wrap">
                        <Building2 size={18} />
                        <input
                          id="company_name"
                          name="company_name"
                          value={form.company_name}
                          onChange={updateField}
                          placeholder="Your company name"
                          minLength={2}
                          maxLength={120}
                          required
                        />
                      </div>

                      <label htmlFor="full_name">Your full name</label>
                      <div className="input-wrap">
                        <User size={18} />
                        <input
                          id="full_name"
                          name="full_name"
                          value={form.full_name}
                          onChange={updateField}
                          placeholder="Enter your full name"
                          minLength={2}
                          maxLength={100}
                          required
                        />
                      </div>
                    </>
                  )}

                  <label htmlFor="email">Work email</label>
                  <div className="input-wrap">
                    <Mail size={18} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={updateField}
                      placeholder="name@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <label htmlFor="password">Password</label>
                  <div className="input-wrap">
                    <Lock size={18} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={updateField}
                      placeholder={
                        mode === "register"
                          ? "Create a password (10+ characters)"
                          : "Enter your password"
                      }
                      autoComplete={
                        mode === "register"
                          ? "new-password"
                          : "current-password"
                      }
                      minLength={mode === "register" ? 10 : undefined}
                      maxLength={128}
                      required
                    />

                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {mode === "register" && (
                    <p className="password-hint">
                      Use at least 10 characters for your password.
                    </p>
                  )}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="spin" size={19} />
                        Please wait...
                      </>
                    ) : (
                      <>
                        {mode === "register"
                          ? "Create company account"
                          : "Sign in to TalentAI"}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="divider">
                  <span />
                  <p>OR CONTINUE WITH</p>
                  <span />
                </div>

                <div className="google-button">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setError("Google sign-in was unsuccessful.");
                    }}
                    useOneTap={false}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width={350}
                  />
                </div>

                {error && (
                  <div className="message error-message" role="alert">
                    <span>!</span>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="message success-message" role="status">
                    <CheckCircle2 size={17} />
                    {success}
                  </div>
                )}

                <p className="terms-text">
                  By continuing, you agree to use TalentAI responsibly and
                  keep your account credentials secure.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auth-card-footer">
            <span>© {new Date().getFullYear()} TalentAI</span>
            <span>Intelligent recruitment, simplified.</span>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

import { useState } from "react";

// Simulated user database stored in memory
const USERS_DB = {};

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const simulateAuth = async () => {
    await new Promise(r => setTimeout(r, 1200));
  };

  const handleRegister = async () => {
    setError(""); setSuccess("");
    if (!form.name || !form.email || !form.password || !form.confirm) return setError("All fields are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (USERS_DB[form.email]) return setError("Account already exists. Please log in.");

    setLoading(true);
    await simulateAuth();
    USERS_DB[form.email] = { name: form.name, email: form.email, password: form.password };
    setSuccess("Account created! Redirecting...");
    await new Promise(r => setTimeout(r, 800));
    onLogin({ name: form.name, email: form.email });
    setLoading(false);
  };

  const handleLogin = async () => {
    setError(""); setSuccess("");
    if (!form.email || !form.password) return setError("Email and password are required.");

    setLoading(true);
    await simulateAuth();

    const user = USERS_DB[form.email];
    if (!user || user.password !== form.password) {
      setLoading(false);
      return setError("Invalid email or password.");
    }

    setSuccess("Login successful! Redirecting...");
    await new Promise(r => setTimeout(r, 600));
    onLogin({ name: user.name, email: user.email });
    setLoading(false);
  };

  const handleSubmit = () => mode === "login" ? handleLogin() : handleRegister();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0e1a",
      fontFamily: "'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d1b2a, #1a2744, #0d2137)",
        borderBottom: "1px solid #1e3a5f",
        padding: "14px 32px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, boxShadow: "0 0 20px rgba(59,130,246,0.5)",
        }}>☁️</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1, color: "#f0f9ff" }}>
            CloudExtract <span style={{ color: "#3b82f6" }}>PDF</span>
          </div>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>
            IAAS · PAAS · DBAAS · STORAGE · SECURITY-AS-A-SERVICE
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Cloud Security Badge */}
          <div style={{
            textAlign: "center", marginBottom: 28,
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)",
              borderRadius: 20, padding: "5px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 12 }}>🛡️</span>
              <span style={{ fontSize: 10, color: "#ff6b35", letterSpacing: 2 }}>SECURITY AS A SERVICE</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f9ff", letterSpacing: 1 }}>
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
              {mode === "login"
                ? "Sign in to access the cloud pipeline"
                : "Register to start extracting PDF content"}
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(13,27,42,0.8)",
            border: "1px solid #1e3a5f",
            borderRadius: 14,
            padding: "28px 28px",
            backdropFilter: "blur(10px)",
          }}>

            {/* Mode Toggle */}
            <div style={{
              display: "flex", background: "rgba(0,0,0,0.3)",
              borderRadius: 8, padding: 4, marginBottom: 24,
            }}>
              {["login", "register"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); setForm({ name: "", email: "", password: "", confirm: "" }); }} style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, border: "none",
                  background: mode === m ? "rgba(59,130,246,0.2)" : "transparent",
                  color: mode === m ? "#93c5fd" : "#475569",
                  fontSize: 12, cursor: "pointer", letterSpacing: 1,
                  textTransform: "uppercase", transition: "all 0.2s",
                  borderBottom: mode === m ? "2px solid #3b82f6" : "2px solid transparent",
                }}>{m === "login" ? "🔑 Sign In" : "✨ Register"}</button>
              ))}
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {mode === "register" && (
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, display: "block", marginBottom: 6 }}>FULL NAME</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="John Doe"
                    style={inputStyle}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, display: "block", marginBottom: 6 }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, display: "block", marginBottom: 6 }}>PASSWORD</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                  <button onClick={() => setShowPass(p => !p)} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#475569",
                  }}>{showPass ? "🙈" : "👁️"}</button>
                </div>
              </div>

              {mode === "register" && (
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, display: "block", marginBottom: 6 }}>CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={e => set("confirm", e.target.value)}
                    placeholder="Re-enter password"
                    style={inputStyle}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                </div>
              )}
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{
                marginTop: 14, padding: "10px 14px", borderRadius: 8,
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171", fontSize: 12,
              }}>❌ {error}</div>
            )}
            {success && (
              <div style={{
                marginTop: 14, padding: "10px 14px", borderRadius: 8,
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)",
                color: "#34d399", fontSize: 12,
              }}>✅ {success}</div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", marginTop: 20, padding: "13px 0",
                background: loading ? "rgba(30,58,95,0.4)" : "linear-gradient(135deg, #1d4ed8, #0891b2)",
                border: "none", borderRadius: 10,
                color: loading ? "#64748b" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 2, transition: "all 0.3s",
                boxShadow: loading ? "none" : "0 0 20px rgba(29,78,216,0.35)",
              }}>
              {loading
                ? "⟳  AUTHENTICATING..."
                : mode === "login" ? "🔐  SIGN IN" : "🚀  CREATE ACCOUNT"}
            </button>

            {/* Switch mode link */}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#475569" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
                style={{ color: "#3b82f6", cursor: "pointer", textDecoration: "underline" }}>
                {mode === "login" ? "Register" : "Sign In"}
              </span>
            </div>
          </div>

          {/* Security Info */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { icon: "🔒", label: "TLS 1.3", sub: "Encrypted Transit" },
              { icon: "🪪", label: "JWT Tokens", sub: "Session Auth" },
              { icon: "🛡️", label: "AWS Cognito", sub: "Identity Pool" },
            ].map(b => (
              <div key={b.label} style={{
                background: "rgba(13,27,42,0.5)", border: "1px solid #1e3a5f",
                borderRadius: 8, padding: "10px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 16 }}>{b.icon}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{b.label}</div>
                <div style={{ fontSize: 9, color: "#334155", letterSpacing: 1 }}>{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #1e3a5f", padding: "10px 32px",
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: "#334155",
      }}>
        <span>☁️ CloudExtract PDF</span>
        <span>Secured by AWS Cognito · IAM · KMS</span>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid #1e3a5f",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#e2e8f0",
  fontSize: 13,
  fontFamily: "'Courier New', monospace",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

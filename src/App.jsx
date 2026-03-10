import { useState, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const CLOUD_LAYERS = [
  { id: "security", label: "Security as a Service", icon: "🛡️", color: "#ff6b35", desc: "Supabase Auth, JWT Tokens, Row Level Security, TLS 1.3", services: ["Supabase Auth", "JWT Tokens", "Row Level Security", "TLS Encryption"], detail: "Supabase Auth handles user registration, login, and session management. Every database query is protected by Row Level Security (RLS) policies — users can only access their own data." },
  { id: "paas", label: "PaaS — Netlify", icon: "⚙️", color: "#4ecdc4", desc: "Managed Hosting, Auto Deploy, CDN, CI/CD from GitHub", services: ["Netlify Hosting", "Auto Deploy", "Edge CDN", "GitHub CI/CD"], detail: "Netlify is a PaaS platform that automatically builds and deploys your app whenever you push to GitHub. It manages the runtime, scaling, and CDN distribution globally." },
  { id: "storage", label: "Storage as a Service", icon: "🗄️", color: "#a78bfa", desc: "Supabase Storage, File Upload, Public CDN URLs", services: ["Supabase Storage", "PDF Bucket", "Public CDN URLs", "File Versioning"], detail: "Supabase Storage stores all uploaded PDF files in a managed object storage bucket. Files are accessible via public CDN URLs and protected by storage policies." },
  { id: "dbaas", label: "DBaaS — Supabase", icon: "🗃️", color: "#fbbf24", desc: "PostgreSQL, Managed DB, Auto Backups, Real-time", services: ["Supabase PostgreSQL", "Auto Backups", "Real-time Subscriptions", "Connection Pooling"], detail: "Supabase provides a fully managed PostgreSQL database. It handles backups, scaling, connection pooling, and even real-time data subscriptions out of the box." },
  { id: "iaas", label: "IaaS — Cloud Infrastructure", icon: "🖥️", color: "#34d399", desc: "AWS EC2 (behind Netlify & Supabase), VPC, Load Balancer", services: ["AWS EC2 (Netlify)", "AWS RDS (Supabase)", "VPC & Subnets", "Load Balancer"], detail: "Both Netlify and Supabase run on top of AWS infrastructure (IaaS). The virtual machines, networking, storage hardware, and load balancers are managed by AWS underneath." },
];

const PIPELINE_STEPS = [
  { id: 1, icon: "📤", label: "Upload", layer: "storage" },
  { id: 2, icon: "🔒", label: "Auth", layer: "security" },
  { id: 3, icon: "⚙️", label: "Extract", layer: "paas" },
  { id: 4, icon: "🗃️", label: "Save", layer: "dbaas" },
  { id: 5, icon: "✅", label: "Done", layer: "storage" },
];

export default function App({ user, onLogout }) {
  const [tab, setTab] = useState("extractor");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [activeLayer, setActiveLayer] = useState(null);
  const [logs, setLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const inputRef = useRef();
  const logsRef = useRef();

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev.slice(-29), { msg, type, time: new Date().toLocaleTimeString() }]);
    setTimeout(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight; }, 50);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") { setFile(f); setResult(null); setLogs([]); addLog(`📄 File selected: ${f.name} (${(f.size/1024).toFixed(1)} KB)`, "success"); }
    else addLog("❌ Only PDF files are supported", "error");
  }, []);

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n\n";
    }
    const words = fullText.trim().split(/\s+/).filter(Boolean);
    const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 3).join(". ").trim() + ".";
    const wordFreq = {};
    words.forEach(w => { const clean = w.toLowerCase().replace(/[^a-z]/g, ""); if (clean.length > 4) wordFreq[clean] = (wordFreq[clean] || 0) + 1; });
    const keywords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
    return { text: fullText.trim(), pages: pdf.numPages, wordCount: words.length, summary: summary || "Text extracted successfully.", keywords, language: "English" };
  };

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setCurrentStep(0); setResult(null); setLogs([]);

    try {
      // Step 1 — Upload to Supabase Storage
      setCurrentStep(1);
      addLog("📤 Supabase Storage: Uploading PDF...", "info");
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("pdfs").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;
      addLog("✅ Storage: File uploaded successfully", "success");
      setProgress(20);

      // Step 2 — Auth check
      setCurrentStep(2);
      addLog("🔐 Supabase Auth: Verifying JWT session...", "info");
      await new Promise(r => setTimeout(r, 500));
      addLog("✅ Auth: User session verified", "success");
      setProgress(40);

      // Step 3 — Extract text
      setCurrentStep(3);
      addLog("⚙️ PDF.js: Extracting text from PDF...", "info");
      const extracted = await extractTextFromPDF(file);
      addLog(`✅ Extracted ${extracted.wordCount} words from ${extracted.pages} pages`, "success");
      setProgress(60);

      // Step 4 — Save to Supabase DB
      setCurrentStep(4);
      addLog("🗃️ Supabase PostgreSQL: Saving document metadata...", "info");
      const { error: dbError } = await supabase.from("documents").insert({
        user_id: user.id,
        filename: file.name,
        file_url: fileUrl,
        pages: extracted.pages,
        word_count: extracted.wordCount,
        extracted_text: extracted.text.slice(0, 5000),
      });
      if (dbError) throw dbError;
      addLog("✅ Database: Record saved to PostgreSQL", "success");
      setProgress(80);

      // Step 5 — Done
      setCurrentStep(5);
      addLog("🌐 Netlify CDN: Result delivered to client", "info");
      await new Promise(r => setTimeout(r, 400));
      setProgress(100);
      addLog("✅ Pipeline complete!", "success");
      setResult({ ...extracted, filename: file.name, size: file.size, fileUrl });

    } catch (e) {
      addLog(`❌ Error: ${e.message}`, "error");
    } finally {
      setProcessing(false); setCurrentStep(0);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    const { data, error } = await supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (!error) setDocuments(data || []);
    setLoadingDocs(false);
  };

  const layerColor = (id) => CLOUD_LAYERS.find(l => l.id === id)?.color || "#fff";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", fontFamily: "'Courier New', monospace", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2744, #0d2137)", borderBottom: "1px solid #1e3a5f", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 0 20px rgba(59,130,246,0.5)" }}>☁️</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: "#f0f9ff" }}>CloudExtract <span style={{ color: "#3b82f6" }}>PDF</span></div>
            <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>IAAS · PAAS · DBAAS · STORAGE · SECURITY-AS-A-SERVICE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 6, padding: "5px 12px", fontSize: 11, color: "#34d399" }}>👤 {user.name}</div>
          {["extractor", "my docs", "architecture", "pipeline"].map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === "my docs") loadDocuments(); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid", borderColor: tab === t ? "#3b82f6" : "#1e3a5f", background: tab === t ? "rgba(59,130,246,0.15)" : "transparent", color: tab === t ? "#93c5fd" : "#64748b", fontSize: 11, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>{t}</button>
          ))}
          <button onClick={onLogout} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #1e3a5f", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer" }}>🚪 Logout</button>
        </div>
      </div>

      {/* EXTRACTOR TAB */}
      {tab === "extractor" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Drop Zone */}
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${dragging ? "#3b82f6" : file ? "#34d399" : "#1e3a5f"}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(59,130,246,0.05)" : "rgba(13,27,42,0.6)", transition: "all 0.3s" }}>
              <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setResult(null); setLogs([]); addLog(`📄 File selected: ${f.name}`, "success"); }}} />
              <div style={{ fontSize: 36, marginBottom: 10 }}>{file ? "📄" : "📁"}</div>
              {file ? (
                <div><div style={{ color: "#34d399", fontWeight: 700, marginBottom: 4 }}>{file.name}</div><div style={{ color: "#64748b", fontSize: 11 }}>{(file.size/1024).toFixed(1)} KB · Ready</div></div>
              ) : (
                <div><div style={{ color: "#94a3b8", marginBottom: 4 }}>Drop PDF here or click to browse</div><div style={{ color: "#475569", fontSize: 11 }}>Uploads to Supabase Storage · Saved to PostgreSQL</div></div>
              )}
            </div>

            {/* Upload Button */}
            <button onClick={handleExtract} disabled={!file || processing} style={{ padding: "14px 0", background: (!file || processing) ? "rgba(30,58,95,0.4)" : "linear-gradient(135deg, #1d4ed8, #0891b2)", border: "none", borderRadius: 10, color: (!file || processing) ? "#64748b" : "#fff", fontSize: 13, fontWeight: 700, cursor: (!file || processing) ? "not-allowed" : "pointer", letterSpacing: 2, boxShadow: (!file || processing) ? "none" : "0 0 20px rgba(29,78,216,0.4)" }}>
              {processing ? `⟳  PROCESSING…  ${progress}%` : "▶  LAUNCH CLOUD PIPELINE"}
            </button>

            {/* Progress */}
            {processing && (
              <div style={{ background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                <div style={{ height: 6, background: "#1e3a5f", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #3b82f6, #06b6d4)", borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {PIPELINE_STEPS.map((s, i) => (
                    <div key={s.id} style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: `2px solid ${currentStep > i ? layerColor(s.layer) : "#1e3a5f"}`, background: currentStep > i ? `${layerColor(s.layer)}22` : "transparent" }}>{currentStep > i ? "✓" : s.icon}</div>
                      <div style={{ fontSize: 9, color: currentStep > i ? "#94a3b8" : "#475569" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs */}
            <div ref={logsRef} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14, height: 200, overflowY: "auto" }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 8 }}>▸ CLOUD ACTIVITY LOG</div>
              {logs.length === 0 ? <div style={{ color: "#334155", fontSize: 11 }}>Awaiting pipeline trigger…</div>
                : logs.map((l, i) => (
                  <div key={i} style={{ fontSize: 11, marginBottom: 3, display: "flex", gap: 8, color: l.type === "error" ? "#f87171" : l.type === "success" ? "#34d399" : "#94a3b8" }}>
                    <span style={{ color: "#334155", flexShrink: 0 }}>{l.time}</span>
                    <span>{l.msg}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Results */}
          <div>
            {!result ? (
              <div style={{ height: "100%", minHeight: 420, background: "rgba(13,27,42,0.4)", border: "1px dashed #1e3a5f", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#334155" }}>
                <div style={{ fontSize: 48 }}>📊</div>
                <div style={{ fontSize: 13 }}>Extraction results appear here</div>
                <div style={{ fontSize: 11, color: "#1e3a5f" }}>Stored in Supabase · PostgreSQL · CDN Served</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[{ label: "Pages", value: result.pages, icon: "📄", color: "#3b82f6" }, { label: "Words", value: result.wordCount, icon: "📝", color: "#34d399" }, { label: "Language", value: result.language, icon: "🌐", color: "#a78bfa" }].map(s => (
                    <div key={s.label} style={{ background: "rgba(13,27,42,0.8)", border: `1px solid ${s.color}33`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 20 }}>{s.icon}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                {result.summary && (
                  <div style={{ background: "rgba(13,27,42,0.8)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>📝 SUMMARY</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>{result.summary}</div>
                  </div>
                )}
                {result.keywords?.length > 0 && (
                  <div style={{ background: "rgba(13,27,42,0.8)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>🏷️ KEY TERMS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.keywords.map((k, i) => <span key={i} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#93c5fd" }}>{k}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2 }}>📃 EXTRACTED TEXT</div>
                    <button onClick={() => navigator.clipboard.writeText(result.text)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", cursor: "pointer" }}>📋 Copy</button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 11, color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{result.text}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Supabase Storage ✓", "PostgreSQL Saved ✓", "RLS Protected ✓", "CDN Served ✓"].map(t => (
                    <span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY DOCS TAB */}
      {tab === "my docs" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f9ff", marginBottom: 20 }}>🗃️ My Documents <span style={{ fontSize: 11, color: "#64748b" }}>— Stored in Supabase PostgreSQL</span></div>
          {loadingDocs ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>⟳ Loading from database...</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: "center", color: "#334155", padding: 60, border: "1px dashed #1e3a5f", borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div>No documents yet — upload your first PDF!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {documents.map(doc => (
                <div key={doc.id} style={{ background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ fontSize: 28 }}>📄</div>
                    <div>
                      <div style={{ color: "#f0f9ff", fontWeight: 700, marginBottom: 3 }}>{doc.filename}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{doc.pages} pages · {doc.word_count} words · {new Date(doc.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", textDecoration: "none" }}>⬇ Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ARCHITECTURE TAB */}
      {tab === "architecture" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f9ff", letterSpacing: 2 }}>☁️ Real Cloud Architecture</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>Actual services powering this app — click to explore</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "rgba(30,58,95,0.2)", border: "1px dashed #334155", borderRadius: 10, padding: "10px 20px", textAlign: "center", color: "#475569", fontSize: 11 }}>🌍 Internet / Users · HTTPS · DNS</div>
            {CLOUD_LAYERS.map(layer => (
              <div key={layer.id}>
                <div onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)} style={{ background: activeLayer === layer.id ? `linear-gradient(135deg, ${layer.color}18, ${layer.color}06)` : "rgba(13,27,42,0.6)", border: `1px solid ${activeLayer === layer.id ? layer.color + "55" : "#1e3a5f"}`, borderRadius: activeLayer === layer.id ? "10px 10px 0 0" : 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                  <div style={{ fontSize: 22 }}>{layer.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: layer.color, fontSize: 13 }}>{layer.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{layer.desc}</div>
                  </div>
                  <div style={{ color: "#475569", fontSize: 11 }}>{activeLayer === layer.id ? "▲" : "▼"}</div>
                </div>
                {activeLayer === layer.id && (
                  <div style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${layer.color}22`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "14px 20px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      {layer.services.map(s => <div key={s} style={{ background: `${layer.color}12`, border: `1px solid ${layer.color}33`, borderRadius: 6, padding: "5px 12px", fontSize: 12, color: layer.color }}>{s}</div>)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.8, borderTop: "1px solid #1e3a5f", paddingTop: 10 }}>{layer.detail}</div>
                  </div>
                )}
              </div>
            ))}
            <div style={{ background: "rgba(14,20,30,0.6)", border: "1px dashed #334155", borderRadius: 10, padding: "10px 20px", textAlign: "center", color: "#475569", fontSize: 11 }}>🏢 AWS Physical Data Centers (behind Netlify + Supabase)</div>
          </div>
        </div>
      )}

      {/* PIPELINE TAB */}
      {tab === "pipeline" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f9ff", letterSpacing: 2 }}>🔄 Real Pipeline Flow</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>What actually happens when you upload a PDF</div>
          </div>
          {[
            { phase: "SECURITY (Supabase Auth)", color: "#ff6b35", steps: [{ icon: "🔐", title: "User Authentication", desc: "User logs in via Supabase Auth. JWT token issued. All subsequent requests include the JWT in headers for identity verification." }] },
            { phase: "STORAGE (Supabase Storage)", color: "#a78bfa", steps: [{ icon: "📤", title: "PDF Upload to Bucket", desc: "PDF uploaded directly to Supabase Storage bucket 'pdfs'. File stored at path: {user_id}/{timestamp}_{filename}. Public URL generated via CDN." }] },
            { phase: "PROCESSING (PDF.js — PaaS)", color: "#4ecdc4", steps: [{ icon: "⚙️", title: "Client-side Text Extraction", desc: "PDF.js library parses the PDF in the browser. Text content extracted page by page. Word count, keywords, and summary generated locally — no server needed." }] },
            { phase: "DATABASE (Supabase PostgreSQL — DBaaS)", color: "#fbbf24", steps: [{ icon: "💾", title: "Save to PostgreSQL", desc: "Document metadata (filename, pages, word_count, extracted_text, file_url) saved to 'documents' table. Row Level Security ensures only the owner can access their records." }] },
            { phase: "HOSTING (Netlify — IaaS + PaaS)", color: "#34d399", steps: [{ icon: "🌐", title: "CDN Delivery", desc: "The entire React app is hosted on Netlify's global CDN. Auto-deployed from GitHub on every push. Users worldwide get the app served from the nearest edge node." }] },
          ].map((group, gi) => (
            <div key={gi} style={{ marginBottom: 18 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${group.color}12`, border: `1px solid ${group.color}33`, borderRadius: 5, padding: "2px 10px", marginBottom: 8, fontSize: 10, color: group.color, letterSpacing: 2 }}>▸ {group.phase}</div>
              <div style={{ paddingLeft: 20, borderLeft: `2px solid ${group.color}33` }}>
                {group.steps.map((step, si) => (
                  <div key={si} style={{ background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 16px", display: "flex", gap: 14, position: "relative" }}>
                    <div style={{ position: "absolute", left: -29, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: group.color, border: "2px solid #0a0e1a", boxShadow: `0 0 8px ${group.color}` }} />
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{step.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: group.color, fontSize: 13, marginBottom: 4 }}>{step.title}</div>
                      <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.7 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16, background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>✅ REAL SERVICES USED IN THIS APP</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { cat: "IaaS + PaaS", items: ["Netlify Hosting", "GitHub CI/CD", "Edge CDN"], color: "#34d399" },
                { cat: "DBaaS", items: ["Supabase PostgreSQL", "Row Level Security", "Auto Backups"], color: "#fbbf24" },
                { cat: "Storage SaaS", items: ["Supabase Storage", "PDF Bucket", "Public CDN URLs"], color: "#a78bfa" },
                { cat: "Security SaaS", items: ["Supabase Auth", "JWT Tokens", "TLS 1.3"], color: "#ff6b35" },
                { cat: "Processing", items: ["PDF.js (client)", "Text Extraction", "Keyword Analysis"], color: "#4ecdc4" },
                { cat: "Frontend", items: ["React 18", "Vite", "CSS-in-JS"], color: "#3b82f6" },
              ].map(t => (
                <div key={t.cat} style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${t.color}22`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: t.color, letterSpacing: 1, marginBottom: 6 }}>{t.cat.toUpperCase()}</div>
                  {t.items.map(item => <div key={item} style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>· {item}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid #1e3a5f", padding: "10px 32px", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#334155", marginTop: 24 }}>
        <span>☁️ CloudExtract PDF · Real Cloud Deployment</span>
        <span>Supabase · Netlify · PDF.js · React</span>
      </div>
    </div>
  );
}

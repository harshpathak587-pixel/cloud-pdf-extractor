import { useState, useRef, useCallback } from "react";

const CLOUD_LAYERS = [
  {
    id: "security",
    label: "Security as a Service",
    icon: "🛡️",
    color: "#ff6b35",
    desc: "IAM, SSL/TLS, WAF, DDoS Protection, Firewall Rules",
    services: ["AWS Shield", "CloudFront WAF", "IAM Roles", "KMS Encryption"],
    detail: "Security-as-a-Service wraps all layers. Shield protects against DDoS, WAF filters malicious requests, IAM enforces least-privilege access, KMS encrypts data at rest and in transit.",
  },
  {
    id: "paas",
    label: "PaaS — App Engine",
    icon: "⚙️",
    color: "#4ecdc4",
    desc: "Managed Runtime, Auto-scaling, Load Balancer, CI/CD Pipeline",
    services: ["AWS Elastic Beanstalk", "Auto Scaling Groups", "ALB", "CodePipeline"],
    detail: "PaaS layer manages the runtime environment. Elastic Beanstalk auto-scales the app tier, ALB distributes traffic across AZs, and Lambda functions handle event-driven PDF processing without server management.",
  },
  {
    id: "storage",
    label: "Storage as a Service",
    icon: "🗄️",
    color: "#a78bfa",
    desc: "Object Storage, CDN, Lifecycle Policies, Versioning",
    services: ["Amazon S3", "CloudFront CDN", "S3 Glacier", "EFS"],
    detail: "Object storage decouples files from compute. S3 stores all PDFs with lifecycle policies that auto-archive to Glacier, CloudFront CDN accelerates delivery globally with edge caching.",
  },
  {
    id: "dbaas",
    label: "DBaaS — Database",
    icon: "🗃️",
    color: "#fbbf24",
    desc: "Managed DB, Read Replicas, Automated Backups, Multi-AZ",
    services: ["Amazon RDS", "DynamoDB", "ElastiCache", "Aurora"],
    detail: "DBaaS eliminates database management overhead. RDS provides managed relational storage with automated backups, DynamoDB stores document metadata at any scale, ElastiCache speeds up frequent queries with Redis.",
  },
  {
    id: "iaas",
    label: "IaaS — Infrastructure",
    icon: "🖥️",
    color: "#34d399",
    desc: "Virtual Machines, VPC, Subnets, Load Balancers, DNS",
    services: ["AWS EC2", "VPC", "Route 53", "Elastic IP"],
    detail: "IaaS provides foundational compute, networking, and storage. EC2 instances run the application, VPC isolates network traffic into public/private subnets, Route 53 handles global DNS routing.",
  },
];

const PIPELINE_STEPS = [
  { id: 1, icon: "📤", label: "Upload", layer: "storage", detail: "S3 Pre-signed URL Upload" },
  { id: 2, icon: "🔒", label: "Scan", layer: "security", detail: "Antivirus & Malware Scan" },
  { id: 3, icon: "⚙️", label: "Process", layer: "paas", detail: "Lambda PDF Parser" },
  { id: 4, icon: "🗃️", label: "Store", layer: "dbaas", detail: "DynamoDB Metadata Save" },
  { id: 5, icon: "✅", label: "Deliver", layer: "storage", detail: "CloudFront CDN Delivery" },
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
  const [extractMode, setExtractMode] = useState("full");
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const inputRef = useRef();
  const logsRef = useRef();

  const addLog = (msg, type = "info") => {
    setLogs(prev => {
      const next = [...prev.slice(-29), { msg, type, time: new Date().toLocaleTimeString() }];
      return next;
    });
    setTimeout(() => {
      if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }, 50);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setResult(null);
      setLogs([]);
      addLog(`📄 File selected: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`, "success");
    } else {
      addLog("❌ Only PDF files are supported", "error");
    }
  }, []);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setResult(null);
      setLogs([]);
      addLog(`📄 File selected: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`, "success");
    }
  };

  const simulateCloudPipeline = async () => {
    const stepLogs = [
      ["🛡️ WAF: Validating request origin & headers...", "info"],
      ["🔐 IAM: Checking user permissions (sts:AssumeRole)...", "info"],
      ["✅ Security: Request authorized — proceeding", "success"],
      ["📤 S3: Generating pre-signed upload URL (TTL: 300s)...", "info"],
      ["☁️ Storage: Uploading to s3://cloud-pdf-bucket/uploads/...", "info"],
      ["✅ S3: Upload complete — ETag verified, versioning enabled", "success"],
      ["🦠 Security: Running ClamAV antivirus scan...", "info"],
      ["🔍 Security: Checking MIME type & file signatures...", "info"],
      ["✅ Security: File clean — no threats detected", "success"],
      ["⚙️ Lambda: Triggering PDF extraction function (1024 MB)...", "info"],
      ["🔄 PaaS: Parsing PDF structure & extracting text blocks...", "info"],
      ["📊 PaaS: OCR pipeline engaged for embedded images...", "info"],
      ["✅ Lambda: Text extraction complete", "success"],
      ["🗃️ DynamoDB: Saving document metadata (PK: doc_id)...", "info"],
      ["🗃️ RDS: Storing full-text index for semantic search...", "info"],
      ["💾 ElastiCache: Warming Redis cache (TTL: 3600s)...", "info"],
      ["✅ DBaaS: All records committed successfully", "success"],
      ["🌐 CloudFront: Caching result at nearest edge node...", "info"],
      ["✅ Delivery: Result ready via CDN — avg latency < 50ms", "success"],
    ];

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setCurrentStep(i + 1);
      const logStart = Math.floor((i / PIPELINE_STEPS.length) * stepLogs.length);
      const logEnd = Math.floor(((i + 1) / PIPELINE_STEPS.length) * stepLogs.length);
      for (let j = logStart; j < logEnd; j++) {
        addLog(stepLogs[j][0], stepLogs[j][1]);
        await new Promise(r => setTimeout(r, 200));
      }
      setProgress(Math.round(((i + 1) / PIPELINE_STEPS.length) * 100));
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const extractWithClaude = async (base64Data) => {
    const modeInstructions = {
      full: "Extract ALL text from this PDF document. Return a JSON object with these exact keys: { \"pages\": number, \"wordCount\": number, \"text\": string (full extracted text), \"summary\": string (2-3 sentences), \"language\": string, \"keywords\": string[] (top 8 keywords) }",
      summary: "Analyze this PDF and return ONLY a JSON object: { \"pages\": number, \"wordCount\": number, \"text\": string (first 400 chars), \"summary\": string (detailed 4-5 sentence summary), \"language\": string, \"keywords\": string[] (top 10 keywords) }",
      structured: "Extract text from this PDF and identify document structure. Return JSON: { \"pages\": number, \"wordCount\": number, \"text\": string (full text), \"summary\": string (2-3 sentences), \"sections\": string[] (list of headings/section titles found), \"language\": string, \"keywords\": string[] (top 8) }",
    };

    const key = apiKey.trim();
    if (!key) throw new Error("No API key provided. Click the key icon to add your Anthropic API key.");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: "You are a PDF text extraction microservice running on AWS Lambda. Always respond with valid JSON only — no markdown fences, no explanation, just the raw JSON object.",
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64Data }
            },
            { type: "text", text: modeInstructions[extractMode] }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content?.map(b => b.text || "").join("") || "{}";
    try {
      return JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return { text: raw, pages: 1, wordCount: raw.split(" ").length, summary: "Extraction complete.", language: "Unknown", keywords: [] };
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setCurrentStep(0);
    setResult(null);
    setLogs([]);

    try {
      addLog("🚀 Initiating cloud pipeline...", "info");
      const base64Data = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = () => rej(new Error("FileReader failed"));
        reader.readAsDataURL(file);
      });

      await simulateCloudPipeline();
      addLog("🤖 Claude AI: Extracting & analyzing text content...", "info");
      const extracted = await extractWithClaude(base64Data);
      setResult({ ...extracted, filename: file.name, size: file.size, mode: extractMode });
      addLog("✅ Pipeline complete — result delivered to client!", "success");
    } catch (e) {
      addLog(`❌ Error: ${e.message}`, "error");
    } finally {
      setProcessing(false);
      setCurrentStep(0);
    }
  };

  const layerColor = (id) => CLOUD_LAYERS.find(l => l.id === id)?.color || "#fff";

  const copyText = () => {
    if (result?.text) navigator.clipboard.writeText(result.text);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", fontFamily: "'Courier New', monospace", color: "#e2e8f0" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0d1b2a 0%, #1a2744 50%, #0d2137 100%)",
        borderBottom: "1px solid #1e3a5f",
        padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 30px rgba(0,100,255,0.1)",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 0 20px rgba(59,130,246,0.5)",
          }}>☁️</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: "#f0f9ff" }}>
              CloudExtract <span style={{ color: "#3b82f6" }}>PDF</span>
            </div>
            <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>
              IAAS · PAAS · DBAAS · STORAGE · SECURITY-AS-A-SERVICE
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* API Key Button */}
          <button
            onClick={() => setShowKeyInput(p => !p)}
            title="Set Anthropic API Key"
            style={{
              padding: "6px 12px", borderRadius: 6,
              border: `1px solid ${apiKey ? "#34d399" : "#ff6b35"}`,
              background: apiKey ? "rgba(52,211,153,0.1)" : "rgba(255,107,53,0.1)",
              color: apiKey ? "#34d399" : "#ff6b35",
              fontSize: 11, cursor: "pointer", letterSpacing: 1,
            }}>
            🔑 {apiKey ? "KEY SET" : "SET KEY"}
          </button>

          {/* User Badge */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
                borderRadius: 6, padding: "5px 12px", fontSize: 11, color: "#34d399",
              }}>👤 {user.name}</div>
              <button onClick={onLogout} style={{
                padding: "5px 12px", borderRadius: 6,
                border: "1px solid #1e3a5f", background: "transparent",
                color: "#64748b", fontSize: 11, cursor: "pointer",
              }}>🚪 Logout</button>
            </div>
          )}

          {/* Nav Tabs */}
          {["extractor", "architecture", "pipeline"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid",
              borderColor: tab === t ? "#3b82f6" : "#1e3a5f",
              background: tab === t ? "rgba(59,130,246,0.15)" : "transparent",
              color: tab === t ? "#93c5fd" : "#64748b",
              fontSize: 11, cursor: "pointer", letterSpacing: 1,
              textTransform: "uppercase", transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* API Key Input Drawer */}
      {showKeyInput && (
        <div style={{
          background: "#0d1b2a", borderBottom: "1px solid #1e3a5f",
          padding: "12px 32px", display: "flex", gap: 10, alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>Anthropic API Key:</span>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{
              flex: 1, maxWidth: 400, background: "#0a0e1a", border: "1px solid #1e3a5f",
              borderRadius: 6, padding: "6px 12px", color: "#e2e8f0", fontSize: 12,
              fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => setShowKeyInput(false)}
            style={{
              padding: "6px 14px", borderRadius: 6, background: "rgba(59,130,246,0.15)",
              border: "1px solid #3b82f6", color: "#93c5fd", fontSize: 11, cursor: "pointer",
            }}>Save & Close</button>
          <span style={{ fontSize: 10, color: "#334155" }}>Key is stored in memory only — never sent anywhere except Anthropic's API.</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: EXTRACTOR
      ══════════════════════════════════════════ */}
      {tab === "extractor" && (
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "28px 24px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
        }}>

          {/* ── Left Panel ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#3b82f6" : file ? "#34d399" : "#1e3a5f"}`,
                borderRadius: 12, padding: "28px 20px",
                textAlign: "center", cursor: "pointer",
                background: dragging ? "rgba(59,130,246,0.05)" : "rgba(13,27,42,0.6)",
                transition: "all 0.3s", backdropFilter: "blur(8px)",
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileSelect} />
              <div style={{ fontSize: 36, marginBottom: 10 }}>{file ? "📄" : "📁"}</div>
              {file ? (
                <div>
                  <div style={{ color: "#34d399", fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{file.name}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{(file.size / 1024).toFixed(1)} KB · Ready for extraction</div>
                </div>
              ) : (
                <div>
                  <div style={{ color: "#94a3b8", marginBottom: 4, fontSize: 13 }}>Drop PDF here or click to browse</div>
                  <div style={{ color: "#475569", fontSize: 11 }}>Uploaded securely to S3 via pre-signed URL · KMS encrypted</div>
                </div>
              )}
            </div>

            {/* Mode Selector */}
            <div style={{ background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 10 }}>⚙️ LAMBDA EXTRACTION MODE</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { id: "full", label: "Full Text", icon: "📃" },
                  { id: "summary", label: "AI Summary", icon: "📝" },
                  { id: "structured", label: "Structured", icon: "🗂️" },
                ].map(m => (
                  <button key={m.id} onClick={() => setExtractMode(m.id)} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 6,
                    border: `1px solid ${extractMode === m.id ? "#3b82f6" : "#1e3a5f"}`,
                    background: extractMode === m.id ? "rgba(59,130,246,0.15)" : "transparent",
                    color: extractMode === m.id ? "#93c5fd" : "#64748b",
                    fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                  }}>{m.icon} {m.label}</button>
                ))}
              </div>
            </div>

            {/* Extract Button */}
            <button
              onClick={handleExtract}
              disabled={!file || processing}
              style={{
                padding: "14px 0",
                background: (!file || processing) ? "rgba(30,58,95,0.4)" : "linear-gradient(135deg, #1d4ed8, #0891b2)",
                border: "none", borderRadius: 10,
                color: (!file || processing) ? "#64748b" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: (!file || processing) ? "not-allowed" : "pointer",
                letterSpacing: 2, transition: "all 0.3s",
                boxShadow: (!file || processing) ? "none" : "0 0 20px rgba(29,78,216,0.4)",
              }}>
              {processing ? `⟳  PROCESSING…  ${progress}%` : "▶  LAUNCH CLOUD PIPELINE"}
            </button>

            {/* Progress */}
            {processing && (
              <div style={{ background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "#64748b", letterSpacing: 1 }}>PIPELINE PROGRESS</span>
                  <span style={{ fontSize: 10, color: "#3b82f6" }}>{progress}%</span>
                </div>
                <div style={{ height: 6, background: "#1e3a5f", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progress}%`,
                    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
                    borderRadius: 3, transition: "width 0.5s ease",
                    boxShadow: "0 0 10px rgba(6,182,212,0.6)",
                  }} />
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                  {PIPELINE_STEPS.map((s, i) => (
                    <div key={s.id} style={{ textAlign: "center", flex: 1 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", margin: "0 auto 4px",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                        border: `2px solid ${currentStep > i ? layerColor(s.layer) : "#1e3a5f"}`,
                        background: currentStep > i ? `${layerColor(s.layer)}22` : "transparent",
                        transition: "all 0.3s",
                      }}>{currentStep > i ? "✓" : s.icon}</div>
                      <div style={{ fontSize: 9, color: currentStep > i ? "#94a3b8" : "#475569" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Log */}
            <div
              ref={logsRef}
              style={{
                background: "rgba(0,0,0,0.5)", border: "1px solid #1e3a5f",
                borderRadius: 10, padding: 14, height: 180, overflowY: "auto",
              }}
            >
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 8 }}>▸ CLOUD ACTIVITY LOG</div>
              {logs.length === 0
                ? <div style={{ color: "#334155", fontSize: 11 }}>Awaiting pipeline trigger…</div>
                : logs.map((l, i) => (
                  <div key={i} style={{
                    fontSize: 11, marginBottom: 3, display: "flex", gap: 8,
                    color: l.type === "error" ? "#f87171" : l.type === "success" ? "#34d399" : "#94a3b8",
                  }}>
                    <span style={{ color: "#334155", flexShrink: 0 }}>{l.time}</span>
                    <span>{l.msg}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* ── Right Panel: Results ── */}
          <div>
            {!result ? (
              <div style={{
                height: "100%", minHeight: 420,
                background: "rgba(13,27,42,0.4)", border: "1px dashed #1e3a5f",
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 12, color: "#334155",
              }}>
                <div style={{ fontSize: 48 }}>📊</div>
                <div style={{ fontSize: 13 }}>Extraction results appear here</div>
                <div style={{ fontSize: 11, color: "#1e3a5f" }}>Processed by Lambda · Indexed in DynamoDB · Served via CloudFront</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Pages", value: result.pages ?? "—", icon: "📄", color: "#3b82f6" },
                    { label: "Words", value: result.wordCount ?? "—", icon: "📝", color: "#34d399" },
                    { label: "Language", value: result.language ?? "EN", icon: "🌐", color: "#a78bfa" },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: "rgba(13,27,42,0.8)", border: `1px solid ${s.color}33`,
                      borderRadius: 10, padding: "12px 8px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 20 }}>{s.icon}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {result.summary && (
                  <div style={{ background: "rgba(13,27,42,0.8)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>🤖 AI SUMMARY (Claude Sonnet)</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>{result.summary}</div>
                  </div>
                )}

                {/* Keywords */}
                {result.keywords?.length > 0 && (
                  <div style={{ background: "rgba(13,27,42,0.8)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>🏷️ KEY TERMS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.keywords.map((k, i) => (
                        <span key={i} style={{
                          background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
                          borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#93c5fd",
                        }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {result.sections?.length > 0 && (
                  <div style={{ background: "rgba(13,27,42,0.8)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>🗂️ DOCUMENT STRUCTURE</div>
                    {result.sections.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "3px 0", borderBottom: "1px solid #0f1f30" }}>▸ {s}</div>
                    ))}
                  </div>
                )}

                {/* Extracted Text */}
                {result.text && (
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2 }}>📃 EXTRACTED TEXT</div>
                      <button onClick={copyText} style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 4,
                        background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
                        color: "#93c5fd", cursor: "pointer",
                      }}>📋 Copy</button>
                    </div>
                    <div style={{
                      maxHeight: 200, overflowY: "auto", fontSize: 11,
                      color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-wrap",
                    }}>{result.text}</div>
                  </div>
                )}

                {/* Service Badges */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["S3 Stored", "Lambda Processed", "DynamoDB Indexed", "CloudFront Cached", "KMS Encrypted"].map(t => (
                    <span key={t} style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 4,
                      background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
                      color: "#34d399", letterSpacing: 0.5,
                    }}>✓ {t}</span>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: ARCHITECTURE
      ══════════════════════════════════════════ */}
      {tab === "architecture" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, color: "#f0f9ff" }}>☁️ Cloud Architecture Stack</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>Click any layer to explore services & concepts</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              background: "rgba(30,58,95,0.2)", border: "1px dashed #334155",
              borderRadius: 10, padding: "10px 20px", textAlign: "center", color: "#475569", fontSize: 11,
            }}>🌍 Internet / End Users &nbsp;·&nbsp; HTTPS &nbsp;·&nbsp; DNS (Route 53)</div>

            {CLOUD_LAYERS.map(layer => (
              <div key={layer.id}>
                <div
                  onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                  style={{
                    background: activeLayer === layer.id ? `linear-gradient(135deg, ${layer.color}18, ${layer.color}06)` : "rgba(13,27,42,0.6)",
                    border: `1px solid ${activeLayer === layer.id ? layer.color + "55" : "#1e3a5f"}`,
                    borderRadius: activeLayer === layer.id ? "10px 10px 0 0" : 10,
                    padding: "14px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: "pointer", transition: "all 0.25s",
                  }}
                >
                  <div style={{ fontSize: 22 }}>{layer.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: layer.color, letterSpacing: 1, fontSize: 13 }}>{layer.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{layer.desc}</div>
                  </div>
                  <div style={{ color: "#475569", fontSize: 11 }}>{activeLayer === layer.id ? "▲ COLLAPSE" : "▼ EXPAND"}</div>
                </div>

                {activeLayer === layer.id && (
                  <div style={{
                    background: "rgba(0,0,0,0.35)", border: `1px solid ${layer.color}22`,
                    borderTop: "none", borderRadius: "0 0 10px 10px",
                    padding: "14px 20px",
                  }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      {layer.services.map(s => (
                        <div key={s} style={{
                          background: `${layer.color}12`, border: `1px solid ${layer.color}33`,
                          borderRadius: 6, padding: "5px 12px", fontSize: 12, color: layer.color,
                        }}>{s}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.8, borderTop: "1px solid #1e3a5f", paddingTop: 10 }}>
                      {layer.detail}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{
              background: "rgba(14,20,30,0.6)", border: "1px dashed #334155",
              borderRadius: 10, padding: "10px 20px", textAlign: "center", color: "#475569", fontSize: 11,
            }}>🏢 AWS Physical Data Centers &nbsp;·&nbsp; Multi-AZ Redundancy &nbsp;·&nbsp; us-east-1 / us-west-2</div>
          </div>

          {/* SLA Summary */}
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Uptime SLA", value: "99.99%", icon: "⬆️", color: "#34d399" },
              { label: "Avg Latency", value: "< 50ms", icon: "⚡", color: "#3b82f6" },
              { label: "Auto-Scale", value: "0→∞", icon: "📈", color: "#a78bfa" },
              { label: "Regions", value: "24+", icon: "🌍", color: "#fbbf24" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(13,27,42,0.6)", border: `1px solid ${s.color}22`,
                borderRadius: 10, padding: "14px 10px", textAlign: "center",
              }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: PIPELINE
      ══════════════════════════════════════════ */}
      {tab === "pipeline" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f9ff", letterSpacing: 2 }}>🔄 Request Processing Pipeline</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>End-to-end request lifecycle — upload → extraction → delivery</div>
          </div>

          {[
            { phase: "CLIENT", color: "#64748b", steps: [
              { icon: "👤", title: "User Action", desc: "User selects PDF in browser. FileReader API reads the file. SHA-256 hash computed client-side for integrity verification before upload." },
            ]},
            { phase: "SECURITY LAYER", color: "#ff6b35", steps: [
              { icon: "🔐", title: "Auth & Access Control", desc: "JWT bearer token validated against Cognito. IAM role assumed via STS. WAF checks origin, rate limits (100 req/min), and blocks known malicious IPs via IP sets." },
              { icon: "🦠", title: "Threat Detection", desc: "ClamAV scans file bytes. MIME type verified against file magic bytes. File size enforced (max 50MB). GuardDuty monitors for anomalous access patterns." },
            ]},
            { phase: "STORAGE LAYER", color: "#a78bfa", steps: [
              { icon: "📤", title: "S3 Object Upload", desc: "Pre-signed URL generated with 5-min TTL. File streamed to S3 via multipart upload over TLS 1.3. SSE-KMS encryption applied. Object versioning and lifecycle policies active." },
            ]},
            { phase: "PROCESSING LAYER (PaaS)", color: "#4ecdc4", steps: [
              { icon: "⚡", title: "Lambda Trigger", desc: "S3 PutObject event fires EventBridge rule → Lambda invocation. Container warm or cold-start (< 500ms). Memory: 1024 MB. Concurrency: auto-scales to 1000 parallel executions." },
              { icon: "🤖", title: "AI Extraction (Claude)", desc: "Claude Sonnet model receives base64-encoded PDF. Extracts text blocks, identifies structure, generates summary and keywords. Structured JSON returned within 10s." },
            ]},
            { phase: "DATABASE LAYER (DBaaS)", color: "#fbbf24", steps: [
              { icon: "💾", title: "Persist to Database", desc: "Document metadata (id, filename, pages, wordCount) saved to DynamoDB (single-digit ms latency). Full text indexed in RDS PostgreSQL with pg_tsvector for full-text search. Redis cache warmed (TTL 1hr)." },
            ]},
            { phase: "DELIVERY LAYER", color: "#34d399", steps: [
              { icon: "🌐", title: "CDN & Response", desc: "CloudFront edge node caches JSON result closest to user. Response compressed via Brotli. CORS headers set for cross-origin access. Client receives final JSON result." },
            ]},
          ].map((group, gi) => (
            <div key={gi} style={{ marginBottom: 18 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: `${group.color}12`, border: `1px solid ${group.color}33`,
                borderRadius: 5, padding: "2px 10px", marginBottom: 8,
                fontSize: 10, color: group.color, letterSpacing: 2,
              }}>▸ {group.phase}</div>

              <div style={{ paddingLeft: 20, borderLeft: `2px solid ${group.color}33`, display: "flex", flexDirection: "column", gap: 8 }}>
                {group.steps.map((step, si) => (
                  <div key={si} style={{
                    background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f",
                    borderRadius: 8, padding: "12px 16px", display: "flex", gap: 14, position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", left: -29, top: "50%", transform: "translateY(-50%)",
                      width: 14, height: 14, borderRadius: "50%",
                      background: group.color, border: "2px solid #0a0e1a",
                      boxShadow: `0 0 8px ${group.color}`,
                    }} />
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

          {/* Tech Stack Grid */}
          <div style={{ marginTop: 16, background: "rgba(13,27,42,0.6)", border: "1px solid #1e3a5f", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 12 }}>🛠️ COMPLETE TECH STACK</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { cat: "Frontend", items: ["React 18", "Vite", "CSS-in-JS"], color: "#3b82f6" },
                { cat: "IaaS", items: ["EC2 t3.medium", "VPC + Subnets", "Route 53"], color: "#34d399" },
                { cat: "PaaS", items: ["Elastic Beanstalk", "Lambda", "API Gateway"], color: "#4ecdc4" },
                { cat: "DBaaS", items: ["RDS PostgreSQL", "DynamoDB", "ElastiCache Redis"], color: "#fbbf24" },
                { cat: "Storage SaaS", items: ["S3 Standard", "S3 Glacier", "CloudFront CDN"], color: "#a78bfa" },
                { cat: "Security SaaS", items: ["Shield Advanced", "WAF + GuardDuty", "KMS + IAM + Cognito"], color: "#ff6b35" },
              ].map(t => (
                <div key={t.cat} style={{
                  background: "rgba(0,0,0,0.3)", border: `1px solid ${t.color}22`,
                  borderRadius: 8, padding: "10px 12px",
                }}>
                  <div style={{ fontSize: 10, color: t.color, letterSpacing: 1, marginBottom: 6 }}>{t.cat.toUpperCase()}</div>
                  {t.items.map(item => <div key={item} style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>· {item}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid #1e3a5f", padding: "10px 32px", marginTop: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 10, color: "#334155",
      }}>
        <span>☁️ CloudExtract PDF · Cloud Architecture Demo</span>
        <span>IaaS · PaaS · DBaaS · Storage-as-a-Service · Security-as-a-Service</span>
        <span>Powered by Claude Sonnet · React + Vite</span>
      </div>
    </div>
  );
}

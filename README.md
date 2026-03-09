# ☁️ CloudExtract PDF — Local Setup Guide

A Cloud Architecture demo app showcasing **IaaS, PaaS, DBaaS, Storage-as-a-Service, and Security-as-a-Service** concepts, with a real AI-powered PDF text extractor.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- An [Anthropic API Key](https://console.anthropic.com/) (for real PDF extraction)

### 1. Install dependencies
```bash
cd cloud-pdf-extractor
npm install
```

### 2. Start the dev server
```bash
npm run dev
```

The app opens automatically at **http://localhost:3000**

---

## 🔑 Setting Your API Key

1. Click the **"🔑 SET KEY"** button in the top-right header
2. Paste your Anthropic API key (`sk-ant-...`)
3. Click **Save & Close**

> Your key is stored **in memory only** — it's never persisted to disk or sent anywhere except Anthropic's API.

---

## 📖 How to Use

1. **Upload a PDF** — drag & drop or click to browse
2. **Choose extraction mode:**
   - **Full Text** — extracts all text content
   - **AI Summary** — generates a detailed summary + keywords
   - **Structured** — identifies document sections and structure
3. **Click "Launch Cloud Pipeline"** — watch the simulated AWS pipeline run
4. **View results** — text, summary, keywords, page count, language

---

## 🏗️ Cloud Architecture Concepts Covered

| Tab | What it shows |
|-----|---------------|
| **Extractor** | Live pipeline simulation with activity logs |
| **Architecture** | Interactive IaaS/PaaS/DBaaS/Storage/Security stack |
| **Pipeline** | Full request lifecycle from client → CDN |

### Services Demonstrated
- **IaaS** — EC2, VPC, Route 53, Elastic IP
- **PaaS** — Elastic Beanstalk, Lambda, API Gateway, Auto Scaling
- **DBaaS** — RDS PostgreSQL, DynamoDB, ElastiCache Redis
- **Storage as a Service** — Amazon S3, CloudFront CDN, S3 Glacier
- **Security as a Service** — AWS Shield, WAF, IAM, KMS, GuardDuty, Cognito

---

## 🏗️ Project Structure

```
cloud-pdf-extractor/
├── index.html          # Entry point
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── src/
    ├── main.jsx        # React bootstrap
    ├── App.jsx         # Main application
    └── index.css       # Global styles
```

## 🔨 Build for Production

```bash
npm run build
npm run preview   # Preview the production build locally
```

---

## 🛠️ Tech Stack

- **Frontend** — React 18, Vite 5
- **AI** — Claude Sonnet (Anthropic API)
- **Styling** — CSS-in-JS (no external CSS framework needed)

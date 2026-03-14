// ResumeMint v8 — Complete Rewrite
// FIXES: localStorage persistence, responsive, autocomplete off, print PDF, payment success state
import { useState, useEffect, useRef, useCallback } from "react";

const BACKEND = "https://resumemint-backend.onrender.com";
const RAZORPAY_KEY = "rzp_live_SPxfWRaOw9vYcS";
const STORAGE_KEY = "resumemint_form_v8";
const PAID_KEY = "resumemint_paid_v8";

// ── THEME ──────────────────────────────────────────────────
const C = {
  bg: "#0d0d14", surface: "#13131e", card: "#1a1a28", border: "#252535",
  accent: "#22c55e", accentDim: "rgba(34,197,94,0.1)", accentBorder: "rgba(34,197,94,0.25)",
  gold: "#f59e0b", red: "#ef4444",
  text: "#f0f0ff", sub: "#8888aa", muted: "#44445a",
  white: "#ffffff",
};

// ── GLOBAL STYLES ──────────────────────────────────────────
const GS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;font-family:'Outfit',sans-serif;background:${C.bg};}
input,textarea,select,button{font-family:'Outfit',sans-serif;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:${C.surface};}
::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes successPop{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}

/* Responsive grid helpers */
.rm-landing{min-height:100vh;background:${C.bg};color:${C.text};}
.rm-hero{padding:64px 24px 48px;max-width:1100px;margin:0 auto;}
.rm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:580px;}
.rm-feats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.rm-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.rm-testis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.rm-section{padding:48px 24px;max-width:1100px;margin:0 auto;}

/* Builder layout */
.rm-builder{display:flex;height:100vh;background:${C.bg};flex-direction:column;}
.rm-topbar{display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;background:${C.surface};border-bottom:1px solid ${C.border};
  flex-shrink:0;gap:8px;flex-wrap:wrap;position:sticky;top:0;z-index:50;}
.rm-split{flex:1;display:flex;overflow:hidden;min-height:0;}
.rm-formpanel{width:400px;min-width:320px;flex-shrink:0;display:flex;
  flex-direction:column;border-right:1px solid ${C.border};background:${C.surface};}
.rm-prevpanel{flex:1;display:flex;flex-direction:column;background:#1e1e2e;overflow:hidden;}

.feat-card:hover{border-color:${C.accent}55!important;transform:translateY(-3px);transition:all .2s;}
.tab-btn:hover{color:${C.text}!important;}
.rm-inp:focus{border-color:${C.accent}!important;outline:none;}
.rm-inp{transition:border-color .15s;}

/* Mobile */
/* Desktop: always show both panels */
@media(min-width:769px){
  .rm-formpanel{display:flex!important;}
  #rm-preview-panel{display:flex!important;}
}
@media(max-width:768px){
  .rm-stats{grid-template-columns:repeat(2,1fr);}
  .rm-feats{grid-template-columns:1fr 1fr;}
  .rm-steps{grid-template-columns:1fr 1fr;}
  .rm-testis{grid-template-columns:1fr;}
  .rm-hero{padding:40px 16px 32px;}
  .rm-section{padding:32px 16px;}
  .rm-formpanel{width:100%;}
  .rm-split{flex-direction:column;}
  .rm-topbar{padding:8px 12px;}
  .hide-mobile{display:none!important;}
  .rm-nav{padding:12px 16px!important;}
}
@media(max-width:480px){
  .rm-feats{grid-template-columns:1fr;}
  .rm-steps{grid-template-columns:1fr;}
}

/* Print — handled dynamically via JS style injection */
#rm-print-target{display:none;}
`;

// ── RATE LIMITER ───────────────────────────────────────────
const _rl = {};
const rateLimit = (k, max, win) => {
  const now = Date.now();
  if (!_rl[k]) _rl[k] = [];
  _rl[k] = _rl[k].filter(t => now - t < win);
  if (_rl[k].length >= max) return false;
  _rl[k].push(now); return true;
};

// ── SAFE STORAGE ───────────────────────────────────────────
const store = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

// ── DEFAULT DATA ───────────────────────────────────────────
const EMPTY = {
  name: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", summary: "",
  education: [{ degree: "", school: "", year: "", gpa: "" }],
  experience: [{ role: "", company: "", duration: "", bullets: "" }],
  projects: [{ name: "", tech: "", description: "", link: "" }],
  skills: { technical: "", languages: "", soft: "", tools: "" },
  certifications: "", achievements: "", customSections: [],
};

const SAMPLE = {
  name: "Rahul Sharma", email: "rahul.sharma@gmail.com", phone: "+91 98765 43210",
  location: "Bangalore, Karnataka", linkedin: "linkedin.com/in/rahulsharma",
  github: "github.com/rahulsharma", website: "rahulsharma.dev",
  summary: "Final year B.Tech CSE student with 1+ year internship experience in full-stack development. Built 3 production projects with 500+ active users. Strong in React, Node.js and AWS. Seeking SDE role at product-based company.",
  education: [{ degree: "B.Tech Computer Science Engineering", school: "RV College of Engineering, Bangalore", year: "2021–2025", gpa: "8.7 CGPA" }],
  experience: [{ role: "Software Development Intern", company: "Razorpay, Bangalore", duration: "Jun 2024 – Aug 2024",
    bullets: "Built payment analytics dashboard reducing reporting time by 40%\nIntegrated webhook system processing 10k+ events/day with 99.9% uptime\nWrote unit tests achieving 90% coverage using Jest & React Testing Library" }],
  projects: [
    { name: "ResumeMint — ATS Resume Builder", tech: "React, Node.js, MongoDB, Razorpay", description: "SaaS tool for Indian job seekers. 500+ resumes downloaded in first month.", link: "resumemint.in" },
    { name: "Smart Attendance System", tech: "Python, OpenCV, Flask, MySQL", description: "Face recognition attendance. 95% accuracy. Used by 400+ students.", link: "github.com/rahulsharma" },
  ],
  skills: {
    technical: "React.js, Node.js, Express, MongoDB, MySQL, REST APIs, Git, Docker, AWS EC2/S3",
    languages: "JavaScript, Python, Java, C++, SQL",
    soft: "Problem Solving, Team Leadership, Communication, Time Management",
    tools: "VS Code, Postman, Figma, Jira, Linux"
  },
  certifications: "AWS Certified Cloud Practitioner — Amazon (2024)\nGoogle Data Analytics Professional Certificate (2023)",
  achievements: "Academic Rank 3 in Department (2023)\nWinner — Internal Hackathon 2024 (Team of 4)\nGoogle DSC Lead — RVCE Chapter (150+ members)",
  customSections: [],
};

// ══════════════════════════════════════════════════════════
// RESUME TEMPLATES (clean, print-ready)
// ══════════════════════════════════════════════════════════

function Watermark() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: "rotate(-35deg)", textAlign: "center", userSelect: "none" }}>
        <div style={{ fontSize: "28px", fontWeight: "800", color: "rgba(0,0,0,0.07)", letterSpacing: "8px", textTransform: "uppercase" }}>PREVIEW ONLY</div>
        <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.05)", letterSpacing: "3px", marginTop: "6px" }}>Pay ₹9 to unlock</div>
      </div>
    </div>
  );
}

function TemplateClassic({ form, watermark }) {
  const S = {
    page: { fontFamily: "'Times New Roman',Georgia,serif", fontSize: "10.5pt", color: "#111", background: "#fff", padding: "0.65in 0.75in", lineHeight: 1.55, maxWidth: "760px", margin: "0 auto", position: "relative", minHeight: "1056px" },
    name: { fontSize: "22pt", fontWeight: "700", color: "#000", textAlign: "center", marginBottom: "4px" },
    contacts: { fontSize: "9.5pt", color: "#333", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "6px" },
    hr: { borderTop: "1.5pt solid #000", margin: "6px 0" },
    thr: { borderTop: "0.5pt solid #aaa", margin: "4px 0 6px" },
    sh: { fontSize: "10.5pt", fontWeight: "700", color: "#000", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "10px", marginBottom: "2px" },
    row: { display: "flex", justifyContent: "space-between", gap: "6px" },
    bold: { fontWeight: "700", fontSize: "10.5pt" },
    sub: { color: "#555", fontSize: "9.5pt" },
    ul: { marginLeft: "14px", marginTop: "3px" },
    li: { marginBottom: "2px", fontSize: "10pt", lineHeight: 1.5 },
  };
  return (
    <div style={{ position: "relative" }}>
      {watermark && <Watermark />}
      <div style={S.page}>
        <div style={S.name}>{form.name || "Your Name"}</div>
        <div style={S.contacts}>
          {[form.location, form.email, form.phone, form.linkedin, form.github, form.website].filter(Boolean).map((v, i, a) => (
            <span key={i}>{v}{i < a.length - 1 ? " |" : ""}</span>
          ))}
        </div>
        <div style={S.hr} />
        {form.summary && <><div style={S.sh}>Professional Summary</div><div style={S.thr} /><p style={{ fontSize: "10pt", lineHeight: 1.7, marginTop: "3px" }}>{form.summary}</p></>}
        {form.education?.[0]?.degree && <><div style={S.sh}>Education</div><div style={S.thr} />{form.education.map((e, i) => (<div key={i} style={{ ...S.row, marginBottom: "5px", marginTop: "4px" }}><div><div style={S.bold}>{e.degree}</div><div style={S.sub}>{e.school}</div></div><div style={{ textAlign: "right", fontSize: "9.5pt", color: "#444", flexShrink: 0 }}><div>{e.year}</div>{e.gpa && <div>{e.gpa}</div>}</div></div>))}</>}
        {form.experience?.[0]?.role && <><div style={S.sh}>Work Experience</div><div style={S.thr} />{form.experience.map((e, i) => (<div key={i} style={{ marginBottom: "9px", marginTop: "4px" }}><div style={S.row}><span style={S.bold}>{e.role}{e.company && <span style={{ fontWeight: "400" }}> — {e.company}</span>}</span><span style={{ ...S.sub, flexShrink: 0 }}>{e.duration}</span></div>{e.bullets && <ul style={S.ul}>{e.bullets.split("\n").filter(Boolean).map((b, j) => <li key={j} style={S.li}>{b}</li>)}</ul>}</div>))}</>}
        {form.projects?.[0]?.name && <><div style={S.sh}>Projects</div><div style={S.thr} />{form.projects.map((p, i) => (<div key={i} style={{ marginBottom: "7px", marginTop: "4px" }}><div style={S.row}><span style={S.bold}>{p.name}</span>{p.link && <span style={{ ...S.sub, flexShrink: 0 }}>{p.link}</span>}</div>{p.tech && <div style={{ fontSize: "9.5pt", fontStyle: "italic", color: "#555" }}>{p.tech}</div>}{p.description && <div style={{ fontSize: "10pt", marginTop: "2px" }}>{p.description}</div>}</div>))}</>}
        {(form.skills?.technical || form.skills?.languages) && <><div style={S.sh}>Technical Skills</div><div style={S.thr} /><div style={{ marginTop: "3px" }}>{[["Core Skills", form.skills?.technical], ["Languages", form.skills?.languages], ["Tools", form.skills?.tools], ["Soft Skills", form.skills?.soft]].filter(([, v]) => v).map(([k, v], i) => (<div key={i} style={{ fontSize: "10pt", marginBottom: "2px" }}><strong>{k}: </strong>{v}</div>))}</div></>}
        {form.certifications && <><div style={S.sh}>Certifications</div><div style={S.thr} /><ul style={{ ...S.ul, marginTop: "3px" }}>{form.certifications.split("\n").filter(Boolean).map((c, i) => <li key={i} style={S.li}>{c}</li>)}</ul></>}
        {form.achievements && <><div style={S.sh}>Achievements & Activities</div><div style={S.thr} /><ul style={{ ...S.ul, marginTop: "3px" }}>{form.achievements.split("\n").filter(Boolean).map((a, i) => <li key={i} style={S.li}>{a}</li>)}</ul></>}
        {form.customSections?.map((sec, i) => sec.title && sec.content ? (<div key={i}><div style={S.sh}>{sec.title}</div><div style={S.thr} /><ul style={{ ...S.ul, marginTop: "3px" }}>{sec.content.split("\n").filter(Boolean).map((l, j) => <li key={j} style={S.li}>{l}</li>)}</ul></div>) : null)}
      </div>
    </div>
  );
}

function SideSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "8.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.5px", color: accent, marginBottom: "7px", paddingBottom: "3px", borderBottom: "1px solid #334155" }}>{title}</div>
      {children}
    </div>
  );
}
function MSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontWeight: "700", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: accent, marginBottom: "7px", paddingBottom: "3px", borderBottom: `2px solid ${accent}` }}>{title}</div>
      {children}
    </div>
  );
}

function TemplateModern({ form, watermark }) {
  const acc = "#2563eb";
  return (
    <div style={{ position: "relative" }}>
      {watermark && <Watermark />}
      <div style={{ display: "flex", fontFamily: "Arial,Helvetica,sans-serif", fontSize: "10.5px", background: "#fff", color: "#1e293b", maxWidth: "760px", margin: "0 auto", minHeight: "1056px" }}>
        <div style={{ width: "215px", background: "#1e293b", padding: "28px 16px", flexShrink: 0, color: "#e2e8f0" }}>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#fff", marginBottom: "3px", lineHeight: 1.2 }}>{form.name || "Your Name"}</div>
          <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "18px" }}>{form.experience?.[0]?.role || "Software Engineer"}</div>
          <SideSection title="Contact" accent={acc}>{[[form.email, "✉"], [form.phone, "✆"], [form.location, "📍"], [form.linkedin, "🔗"], [form.github, "⌥"], [form.website, "🌐"]].filter(([v]) => v).map(([v, icon], i) => (<div key={i} style={{ fontSize: "9px", marginBottom: "5px", display: "flex", gap: "5px", wordBreak: "break-all" }}><span style={{ flexShrink: 0 }}>{icon}</span><span style={{ color: "#cbd5e1" }}>{v}</span></div>))}</SideSection>
          {form.skills?.technical && <SideSection title="Skills" accent={acc}><div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>{form.skills.technical.split(",").map((s, i) => (<span key={i} style={{ fontSize: "8px", padding: "2px 6px", background: "#334155", color: "#94a3b8", borderRadius: "3px" }}>{s.trim()}</span>))}</div></SideSection>}
          {form.skills?.languages && <SideSection title="Languages" accent={acc}><div style={{ fontSize: "9px", color: "#cbd5e1", lineHeight: 1.6 }}>{form.skills.languages}</div></SideSection>}
          {form.certifications && <SideSection title="Certifications" accent={acc}>{form.certifications.split("\n").filter(Boolean).map((c, i) => (<div key={i} style={{ fontSize: "8.5px", color: "#cbd5e1", marginBottom: "4px", lineHeight: 1.4 }}>• {c}</div>))}</SideSection>}
        </div>
        <div style={{ flex: 1, padding: "28px 22px" }}>
          {form.summary && <MSection title="Summary" accent={acc}><p style={{ fontSize: "10.5px", lineHeight: 1.75, color: "#374151" }}>{form.summary}</p></MSection>}
          {form.experience?.[0]?.role && <MSection title="Experience" accent={acc}>{form.experience.map((e, i) => (<div key={i} style={{ marginBottom: "11px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ fontSize: "11px" }}>{e.role}</strong><span style={{ fontSize: "9.5px", color: "#94a3b8", flexShrink: 0 }}>{e.duration}</span></div>{e.company && <div style={{ color: acc, fontSize: "10px", marginBottom: "3px" }}>{e.company}</div>}<ul style={{ marginLeft: "14px" }}>{e.bullets?.split("\n").filter(Boolean).map((b, j) => <li key={j} style={{ fontSize: "10px", marginBottom: "2px", lineHeight: 1.5 }}>{b}</li>)}</ul></div>))}</MSection>}
          {form.education?.[0]?.degree && <MSection title="Education" accent={acc}>{form.education.map((e, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><div><strong style={{ fontSize: "11px" }}>{e.degree}</strong><div style={{ color: "#64748b", fontSize: "10px" }}>{e.school}</div></div><div style={{ textAlign: "right", fontSize: "10px", color: "#94a3b8", flexShrink: 0 }}>{e.year}<br />{e.gpa}</div></div>))}</MSection>}
          {form.projects?.[0]?.name && <MSection title="Projects" accent={acc}>{form.projects.map((p, i) => (<div key={i} style={{ marginBottom: "8px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ fontSize: "11px" }}>{p.name}</strong>{p.link && <span style={{ fontSize: "9.5px", color: "#94a3b8", flexShrink: 0 }}>{p.link}</span>}</div>{p.tech && <div style={{ fontSize: "9.5px", color: "#64748b", fontStyle: "italic" }}>{p.tech}</div>}{p.description && <div style={{ fontSize: "10px", marginTop: "2px", color: "#374151" }}>{p.description}</div>}</div>))}</MSection>}
          {form.achievements && <MSection title="Achievements" accent={acc}><ul style={{ marginLeft: "14px" }}>{form.achievements.split("\n").filter(Boolean).map((a, i) => <li key={i} style={{ fontSize: "10px", marginBottom: "2px" }}>{a}</li>)}</ul></MSection>}
          {form.customSections?.map((sec, i) => sec.title && sec.content ? (<MSection key={i} title={sec.title} accent={acc}><ul style={{ marginLeft: "14px" }}>{sec.content.split("\n").filter(Boolean).map((l, j) => <li key={j} style={{ fontSize: "10px", marginBottom: "2px" }}>{l}</li>)}</ul></MSection>) : null)}
        </div>
      </div>
    </div>
  );
}

function TemplateExecutive({ form, watermark }) {
  const gold = "#92702a";
  const ESH = ({ title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0 7px" }}>
      <div style={{ width: "22px", height: "1px", background: gold }} />
      <div style={{ fontSize: "9pt", fontWeight: "700", color: gold, textTransform: "uppercase", letterSpacing: "2px" }}>{title}</div>
      <div style={{ flex: 1, height: "0.5px", background: "#d6d0c4" }} />
    </div>
  );
  return (
    <div style={{ position: "relative" }}>
      {watermark && <Watermark />}
      <div style={{ fontFamily: "Georgia,serif", fontSize: "10.5px", background: "#fdfbf7", color: "#2c2c2c", padding: "36px 44px", maxWidth: "760px", margin: "0 auto", minHeight: "1056px" }}>
        <div style={{ textAlign: "center", marginBottom: "18px", paddingBottom: "14px", borderBottom: `2px solid ${gold}` }}>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "28px", color: "#1a1a1a", letterSpacing: "3px", marginBottom: "4px" }}>{form.name || "Your Name"}</div>
          <div style={{ fontSize: "9px", letterSpacing: "3px", color: gold, textTransform: "uppercase", marginBottom: "8px" }}>{form.experience?.[0]?.role || "Software Engineer"}</div>
          <div style={{ fontSize: "9.5px", color: "#666", display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>{[form.email, form.phone, form.location, form.linkedin].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}</div>
        </div>
        {form.summary && <><ESH title="Profile" /><p style={{ fontStyle: "italic", color: "#555", fontSize: "10.5px", lineHeight: 1.9 }}>{form.summary}</p></>}
        {form.education?.[0]?.degree && <><ESH title="Education" />{form.education.map((e, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><div><strong>{e.degree}</strong><div style={{ color: "#666", fontSize: "10px" }}>{e.school}</div></div><div style={{ textAlign: "right", color: "#666", fontSize: "10px", flexShrink: 0 }}>{e.year}<br />{e.gpa}</div></div>))}</>}
        {form.experience?.[0]?.role && <><ESH title="Experience" />{form.experience.map((e, i) => (<div key={i} style={{ marginBottom: "12px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ fontSize: "11px" }}>{e.role}</strong><span style={{ color: "#888", fontSize: "10px", flexShrink: 0 }}>{e.duration}</span></div>{e.company && <div style={{ color: gold, fontSize: "10px", fontStyle: "italic", marginBottom: "3px" }}>{e.company}</div>}<ul style={{ marginLeft: "16px" }}>{e.bullets?.split("\n").filter(Boolean).map((b, j) => <li key={j} style={{ fontSize: "10.5px", marginBottom: "3px", lineHeight: 1.5 }}>{b}</li>)}</ul></div>))}</>}
        {form.projects?.[0]?.name && <><ESH title="Projects" />{form.projects.map((p, i) => (<div key={i} style={{ marginBottom: "8px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ fontSize: "11px" }}>{p.name}</strong>{p.link && <span style={{ fontSize: "9.5px", color: "#888", fontStyle: "italic", flexShrink: 0 }}>{p.link}</span>}</div>{p.tech && <span style={{ fontSize: "9.5px", color: "#888", fontStyle: "italic" }}>{p.tech}</span>}{p.description && <div style={{ fontSize: "10.5px", marginTop: "2px" }}>{p.description}</div>}</div>))}</>}
        {form.skills?.technical && <><ESH title="Skills" /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>{[["Technical", form.skills.technical], ["Languages", form.skills.languages], ["Tools", form.skills.tools], ["Soft Skills", form.skills.soft]].filter(([, v]) => v).map(([k, v], i) => (<div key={i} style={{ fontSize: "10px" }}><strong style={{ color: gold }}>{k}: </strong>{v}</div>))}</div></>}
        {form.certifications && <><ESH title="Certifications" /><div style={{ columnCount: 2, gap: "12px" }}>{form.certifications.split("\n").filter(Boolean).map((c, i) => <div key={i} style={{ fontSize: "10px", marginBottom: "3px" }}>◆ {c}</div>)}</div></>}
        {form.achievements && <><ESH title="Achievements" /><div style={{ columnCount: 2, gap: "12px" }}>{form.achievements.split("\n").filter(Boolean).map((a, i) => <div key={i} style={{ fontSize: "10px", marginBottom: "3px" }}>◆ {a}</div>)}</div></>}
        {form.customSections?.map((sec, i) => sec.title && sec.content ? (<div key={i}><ESH title={sec.title} /><ul style={{ marginLeft: "16px" }}>{sec.content.split("\n").filter(Boolean).map((l, j) => <li key={j} style={{ fontSize: "10.5px", marginBottom: "3px" }}>{l}</li>)}</ul></div>) : null)}
      </div>
    </div>
  );
}

const TEMPLATES = [
  { id: "classic", name: "Classic ATS", icon: "📋", desc: "Clean B&W, best ATS score" },
  { id: "modern", name: "Modern", icon: "💼", desc: "Two-column dark sidebar" },
  { id: "executive", name: "Executive", icon: "✨", desc: "Serif, gold accents" },
];

// ══════════════════════════════════════════════════════════
// PDF DOWNLOAD — proper print isolation
// ══════════════════════════════════════════════════════════
// No-op placeholder — actual download is triggerDownload() in Builder
function downloadPDF() {}

// ══════════════════════════════════════════════════════════
// PAYMENT MODAL
// ══════════════════════════════════════════════════════════
function PaymentModal({ onClose, onSuccess, form }) {
  const [step, setStep] = useState("pay");
  const [err, setErr] = useState("");
  const [orderId, setOrderId] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [wakeMsg, setWakeMsg] = useState("");
  const pollRef = useRef(null);
  const cdRef = useRef(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (cdRef.current) clearInterval(cdRef.current);
  }, []);

  const startPolling = (oid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${BACKEND}/check-payment`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: oid })
        });
        const d = await r.json();
        if (d.paid) {
          clearInterval(pollRef.current);
          handleSuccess();
        }
      } catch (e) { /* keep polling */ }
    }, 3000);
    setTimeout(() => { if (pollRef.current) clearInterval(pollRef.current); }, 600000);
  };

  const handleSuccess = () => {
    setStep("success");
    store.set(PAID_KEY, { paid: true, ts: Date.now() });
    setTimeout(() => onSuccess(), 2000);
  };

  const startCountdown = () => {
    setCountdown(5);
    cdRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(cdRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // Wake up Render free-tier server (sleeps after 15 min of inactivity)
  // Takes up to 50 seconds to wake. We ping with retries until it responds.
  const wakeServer = async () => {
    setWakeMsg("Waking up server (first payment of the day may take ~30s)...");
    for (let attempt = 1; attempt <= 8; attempt++) {
      try {
        setWakeMsg(`Connecting to server... (${attempt * 6}s)`);
        const r = await fetch(`${BACKEND}/`, { signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
        if (r.ok) { setWakeMsg(""); return true; }
      } catch (e) { /* keep retrying */ }
      // Wait 4 seconds between attempts
      await new Promise(res => setTimeout(res, 4000));
    }
    return false; // gave up
  };

  const startPay = async () => {
    if (!rateLimit("pay", 5, 300000)) { setErr("Too many attempts. Please wait 5 minutes."); return; }
    setStep("loading"); setErr(""); setWakeMsg("");
    try {
      // Wake server first — this is the key fix for Render free tier
      await wakeServer();
      setWakeMsg("Creating secure order...");
      const r = await fetch(`${BACKEND}/create-order`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 900 }),
      });
      setWakeMsg("");
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Server error. Please try again."); }
      const order = await r.json();
      if (!order.id) throw new Error("Invalid order. Please try again.");
      setOrderId(order.id);
      if (!window.Razorpay) throw new Error("Payment system failed to load. Please refresh page.");
      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY, amount: 900, currency: "INR",
        name: "ResumeMint", description: "ATS Resume PDF — ₹9",
        order_id: order.id,
        prefill: { name: form.name || "", email: form.email || "", contact: form.phone || "" },
        theme: { color: "#22c55e" },
        modal: { ondismiss: () => setStep("waiting"), escape: false },
        handler: async (resp) => {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("verifying");
          try {
            const vr = await fetch(`${BACKEND}/verify-payment`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                name: form.name, email: form.email
              })
            });
            const vd = await vr.json();
            if (vd.success) handleSuccess();
            else throw new Error(vd.error || "Verification failed.");
          } catch (e) {
            setErr("Payment received but verification pending. Your resume will unlock — please wait 30 seconds or refresh.");
            setStep("error");
          }
        }
      });
      rzp.open();
      setStep("waiting");
      startPolling(order.id);
      startCountdown();
    } catch (e) {
      setErr(e.message || "Connection failed. Please try again.");
      setStep("error");
    }
  };

  const Box = ({ children, style }) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", overflow: "hidden", width: "100%", maxWidth: "380px", animation: "slideIn .25s ease", ...style }}>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <Box>
        {(step === "pay" || step === "error") && <>
          <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: "700", fontSize: "18px", color: C.text }}>Unlock Your Resume</div>
            <div style={{ color: C.sub, fontSize: "12px", marginTop: "3px" }}>Powered by Razorpay · Secure payment</div>
          </div>
          <div style={{ padding: "18px 22px" }}>
            <div style={{ background: C.bg, border: `1px solid ${C.accentBorder}`, borderRadius: "14px", padding: "20px", textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: C.sub, marginBottom: "6px" }}>One Resume • Watermark-free PDF • No subscription</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "52px", color: C.accent, lineHeight: 1 }}>₹9</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                {["✓ Clean PDF", "✓ Instant download", "✓ ATS-ready"].map((t, i) => (
                  <span key={i} style={{ fontSize: "11px", color: C.sub }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "14px", justifyContent: "center" }}>
              {["UPI", "GPay", "PhonePe", "Paytm", "Cards", "Net Banking"].map(m => (
                <span key={m} style={{ fontSize: "10px", padding: "3px 8px", background: C.card, color: C.sub, borderRadius: "5px", border: `1px solid ${C.border}` }}>{m}</span>
              ))}
            </div>
            {err && <div style={{ color: "#fca5a5", fontSize: "12px", marginBottom: "12px", padding: "10px 12px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", lineHeight: 1.6 }}>⚠ {err}</div>}
            <button onClick={startPay} style={{ width: "100%", padding: "14px", background: C.accent, color: "#000", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "16px", cursor: "pointer" }}>
              Pay ₹9 & Download →
            </button>
            <button onClick={onClose} style={{ width: "100%", marginTop: "8px", padding: "9px", background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: "12px" }}>
              Cancel
            </button>
          </div>
        </>}

        {step === "loading" && (
          <div style={{ padding: "48px 22px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 20px", animation: "spin .8s linear infinite" }} />
            <div style={{ fontWeight: "700", fontSize: "17px", color: C.text, marginBottom: "8px" }}>
              {wakeMsg && wakeMsg.includes("Waking") ? "Starting up server..." : "Setting up payment..."}
            </div>
            <div style={{ color: C.sub, fontSize: "12px", lineHeight: 1.7, minHeight: "36px" }}>
              {wakeMsg || "Connecting to Razorpay securely..."}
            </div>
            {wakeMsg && wakeMsg.includes("Connecting") && (
              <div style={{ marginTop: "16px", padding: "10px 14px", background: C.bg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "11px", color: C.muted, lineHeight: 1.7 }}>
                  ℹ️ Server was sleeping. First payment of the day takes ~30s to start.<br/>
                  <strong style={{ color: C.sub }}>Please keep this tab open.</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "waiting" && (
          <div style={{ padding: "32px 22px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }}>💳</div>
            <div style={{ fontWeight: "700", fontSize: "18px", color: C.text, marginBottom: "8px" }}>Complete payment in popup</div>
            <div style={{ color: C.sub, fontSize: "13px", lineHeight: 1.8, marginBottom: "18px" }}>
              Use UPI, QR, card or net banking.<br />
              <strong style={{ color: C.text }}>Keep this tab open</strong> — it auto-unlocks after payment.
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 14px", background: C.bg, borderRadius: "8px", marginBottom: "16px", border: `1px solid ${C.border}` }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accent, animation: "pulse 1.2s infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: C.sub }}>Checking every 3 seconds...</span>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button onClick={startPay} style={{ fontSize: "12px", color: C.sub, background: "transparent", border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
                Reopen popup
              </button>
              <button onClick={() => setStep("pay")} style={{ fontSize: "12px", color: C.muted, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div style={{ padding: "52px 22px", textAlign: "center" }}>
            <div style={{ width: "44px", height: "44px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 18px", animation: "spin .8s linear infinite" }} />
            <div style={{ fontWeight: "700", fontSize: "17px", color: C.text, marginBottom: "6px" }}>Verifying payment...</div>
            <div style={{ color: C.sub, fontSize: "12px" }}>Almost done, please wait</div>
          </div>
        )}

        {step === "success" && (
          <div style={{ padding: "52px 22px", textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px", animation: "successPop .5s ease" }}>✅</div>
            <div style={{ fontWeight: "800", fontSize: "22px", color: C.accent, marginBottom: "8px" }}>Payment Successful!</div>
            <div style={{ color: C.sub, fontSize: "13px", lineHeight: 1.7 }}>
              Your resume is unlocked.<br />Preparing your clean PDF now...
            </div>
          </div>
        )}
      </Box>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AI MODAL
// ══════════════════════════════════════════════════════════
function AIModal({ onClose, onApply, form }) {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");

  const analyze = async () => {
    if (jd.trim().length < 50) { setErr("Please paste a complete job description (at least 50 characters)."); return; }
    if (!rateLimit("ai", 3, 60000)) { setErr("Too many requests. Wait 1 minute."); return; }
    setLoading(true); setErr(""); setStatus("Connecting to AI server...");
    // Wake up Render with retries
    for (let i = 1; i <= 6; i++) {
      try {
        setStatus(`Connecting to server... (${i * 6}s)`);
        const wr = await fetch(`${BACKEND}/`, { signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
        if (wr.ok) break;
      } catch (e) { if (i < 6) await new Promise(r => setTimeout(r, 4000)); }
    }
    setStatus("Analyzing your resume against the JD...");
    try {
      const res = await fetch(`${BACKEND}/ai-job-match`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are a resume optimizer. Return ONLY valid JSON, no markdown:\n{"match_score":85,"summary":"2-3 sentence optimized summary","skills_technical":"comma,separated,skills","experience_bullets":["bullet 1","bullet 2","bullet 3"],"keywords":["kw1","kw2","kw3"]}`,
          messages: [{ role: "user", content: `JD: ${jd}\n\nResume: ${form.name}, ${form.summary}, Skills: ${form.skills?.technical}, Role: ${form.experience?.[0]?.role}` }]
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = typeof d.error === "string" ? d.error : JSON.stringify(d.error) || "";
        if (res.status === 429 || msg === "AI_QUOTA_EXCEEDED" || msg.includes("quota") || msg.includes("credit")) throw new Error("QUOTA");
        throw new Error("AI service error. Try again in a few minutes.");
      }
      const data = await res.json();
      if (data.error) {
        const msg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        if (msg === "AI_QUOTA_EXCEEDED" || msg.includes("quota") || msg.includes("credit")) throw new Error("QUOTA");
        throw new Error(msg);
      }
      const text = data.content?.map(b => b.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed); setStatus("");
    } catch (e) {
      if (e.message === "QUOTA") setErr("⚠️ AI credits are temporarily used up. They reset daily. You can still build and download your resume manually — AI is optional.");
      else setErr(e.message || "AI analysis failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflow: "auto", animation: "slideIn .25s ease" }}>
        <div style={{ padding: "20px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: "700", fontSize: "17px", color: C.text }}>🤖 AI Job-Match</div>
            <div style={{ color: C.sub, fontSize: "12px", marginTop: "2px" }}>Paste a JD → AI tailors your resume for that exact role</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.sub, padding: "6px 12px", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          {!result ? <>
            <textarea value={jd} onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here (copy from LinkedIn, Naukri, etc.)..."
              style={{ width: "100%", height: "150px", padding: "12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", color: C.text, fontSize: "13px", lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
            {status && <div style={{ color: C.accent, fontSize: "12px", marginTop: "8px", display: "flex", gap: "6px", alignItems: "center" }}>
              <div style={{ width: "10px", height: "10px", border: `2px solid ${C.accent}44`, borderTop: `2px solid ${C.accent}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              {status}
            </div>}
            {err && <div style={{ color: "#fca5a5", fontSize: "12px", marginTop: "10px", padding: "12px", background: "rgba(239,68,68,0.08)", borderRadius: "8px", lineHeight: 1.7 }}>{err}</div>}
            <button onClick={analyze} disabled={loading} style={{ marginTop: "12px", width: "100%", padding: "13px", background: loading ? C.card : C.accent, color: loading ? C.sub : "#000", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Analyzing..." : "⚡ Analyze & Optimize"}
            </button>
          </> : <>
            <div style={{ textAlign: "center", padding: "16px", background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: "12px", marginBottom: "18px" }}>
              <div style={{ fontSize: "36px", fontWeight: "700", color: C.accent }}>{result.match_score}%</div>
              <div style={{ fontSize: "12px", color: C.sub }}>Match score after optimization</div>
            </div>
            {result.summary && <>
              <div style={{ fontWeight: "600", color: C.text, fontSize: "13px", marginBottom: "6px" }}>Optimized Summary</div>
              <div style={{ padding: "12px", background: C.bg, borderRadius: "9px", fontSize: "12px", color: C.sub, lineHeight: 1.75, borderLeft: `3px solid ${C.accent}`, marginBottom: "14px" }}>{result.summary}</div>
            </>}
            {result.keywords?.length > 0 && <>
              <div style={{ fontWeight: "600", color: C.text, fontSize: "13px", marginBottom: "7px" }}>Keywords to Add</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
                {result.keywords.map((k, i) => (<span key={i} style={{ fontSize: "11px", padding: "3px 10px", background: C.accentDim, color: C.accent, borderRadius: "20px" }}>{k}</span>))}
              </div>
            </>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => onApply({ ...form, summary: result.summary || form.summary, skills: { ...form.skills, technical: result.skills_technical || form.skills?.technical }, experience: form.experience?.map((e, i) => i === 0 ? { ...e, bullets: result.experience_bullets?.join("\n") || e.bullets } : e) })}
                style={{ flex: 1, padding: "12px", background: C.accent, color: "#000", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                Apply to Resume
              </button>
              <button onClick={() => { setResult(null); setJd(""); }} style={{ padding: "12px 14px", background: "transparent", border: `1px solid ${C.border}`, color: C.sub, borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>Try Another JD</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// UPLOAD MODAL
// ══════════════════════════════════════════════════════════
function UploadModal({ onClose, onExtracted }) {
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("File too large. Max 5MB."); setStatus("error"); return; }
    setStatus("loading"); setErr("");
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      // Wake Render with retries
      for (let i = 1; i <= 6; i++) {
        try {
          const wr = await fetch(`${BACKEND}/`, { signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
          if (wr.ok) break;
        } catch (e) { if (i < 6) await new Promise(r => setTimeout(r, 4000)); }
      }
      const resp = await fetch(`${BACKEND}/ai-job-match`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 2000,
          system: `Extract resume data and return ONLY valid JSON:\n{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","website":"","summary":"","education":[{"degree":"","school":"","year":"","gpa":""}],"experience":[{"role":"","company":"","duration":"","bullets":""}],"projects":[{"name":"","tech":"","description":"","link":""}],"skills":{"technical":"","languages":"","soft":"","tools":""},"certifications":"","achievements":"","customSections":[]}`,
          messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: file.type || "application/pdf", data: b64 } }, { type: "text", text: "Extract all resume information. Return only the JSON." }] }]
        }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        const msg = typeof d.error === "string" ? d.error : JSON.stringify(d.error) || "";
        if (resp.status === 429 || msg.includes("quota") || msg.includes("credit"))
          throw new Error("AI credits temporarily used up. Click 'Load Sample' to see how the builder works, or fill fields manually.");
        throw new Error("Server error. Please try again.");
      }
      const data = await resp.json();
      if (data.error) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      const text = data.content?.map(b => b.text || "").join("") || "";
      const extracted = JSON.parse(text.replace(/```json|```/g, "").trim());
      extracted.customSections = extracted.customSections || [];
      setStatus("done");
      setTimeout(() => { onExtracted(extracted); onClose(); }, 600);
    } catch (e) { setErr(e.message || "Could not extract data."); setStatus("error"); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", width: "100%", maxWidth: "400px", padding: "32px 28px", animation: "slideIn .25s ease", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "14px" }}>{status === "done" ? "✅" : status === "error" ? "❌" : "📄"}</div>
        <div style={{ fontWeight: "700", fontSize: "19px", color: C.text, marginBottom: "8px" }}>
          {status === "idle" && "Upload Your Resume"}
          {status === "loading" && "AI Reading Resume..."}
          {status === "done" && "Data Extracted!"}
          {status === "error" && "Upload Failed"}
        </div>
        {status === "idle" && <>
          <div style={{ color: C.sub, fontSize: "13px", marginBottom: "22px", lineHeight: 1.7 }}>Upload your existing PDF or image — AI fills all fields automatically.</div>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFile} style={{ display: "none" }} id="fu" />
          <label htmlFor="fu" style={{ display: "inline-block", padding: "13px 28px", background: C.accent, color: "#000", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>Choose File</label>
          <div style={{ color: C.muted, fontSize: "11px", marginTop: "10px" }}>PDF, PNG, JPG · Max 5MB</div>
          <button onClick={onClose} style={{ display: "block", width: "100%", marginTop: "14px", padding: "9px", background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: "12px" }}>Cancel</button>
        </>}
        {status === "loading" && <>
          <div style={{ width: "40px", height: "40px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "16px auto", animation: "spin .8s linear infinite" }} />
          <div style={{ color: C.sub, fontSize: "12px" }}>Extracting data from your resume...</div>
        </>}
        {status === "done" && <div style={{ color: C.accent, fontSize: "13px", fontWeight: "600" }}>All fields filled! Redirecting to builder...</div>}
        {status === "error" && <>
          <div style={{ color: "#fca5a5", fontSize: "12px", margin: "12px 0", padding: "12px", background: "rgba(239,68,68,0.08)", borderRadius: "8px", lineHeight: 1.6, textAlign: "left" }}>{err}</div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button onClick={() => setStatus("idle")} style={{ padding: "9px 18px", background: C.card, border: "none", color: C.sub, borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Try Again</button>
            <button onClick={() => { onExtracted({ ...SAMPLE, customSections: [] }); onClose(); }} style={{ padding: "9px 18px", background: C.accent, border: "none", color: "#000", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>Load Sample Data</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════
function AdminPanel({ onClose }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const check = (s) => s.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(16);
  const login = () => {
    if (!rateLimit("adm", 5, 300000)) { setErr("Too many attempts. Locked 5 min."); return; }
    if (check(pw) === check("admin@resumemint")) { setAuthed(true); load(); }
    else setErr("Wrong password."); setPw("");
  };
  const load = async () => {
    setLoading(true);
    try { const r = await fetch(`${BACKEND}/admin/stats`, { headers: { "x-admin-key": "resumemint_admin_2025" } }); const d = await r.json(); setStats(d); setPayments(d.recent || []); } catch (e) { setErr("Could not load: " + e.message); }
    setLoading(false);
  };

  if (!authed) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px", width: "320px", animation: "slideIn .25s ease" }}>
        <div style={{ fontWeight: "700", fontSize: "18px", color: C.text, textAlign: "center", marginBottom: "4px" }}>🛡️ Admin</div>
        <div style={{ color: C.sub, fontSize: "12px", textAlign: "center", marginBottom: "22px" }}>ResumeMint Control Panel</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} placeholder="Password"
          style={{ width: "100%", padding: "11px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "13px", outline: "none", marginBottom: "8px" }} />
        {err && <div style={{ color: "#fca5a5", fontSize: "12px", marginBottom: "10px" }}>{err}</div>}
        <button onClick={login} style={{ width: "100%", padding: "12px", background: C.accent, color: "#000", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Login</button>
        <button onClick={onClose} style={{ width: "100%", marginTop: "7px", padding: "9px", background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: "12px" }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 4000, overflowY: "auto" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ fontWeight: "700", fontSize: "22px", color: C.text }}>Resume<span style={{ color: C.accent }}>Mint</span> Admin</div>
            <div style={{ color: C.sub, fontSize: "12px", marginTop: "2px" }}>Live data from MongoDB</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={load} style={{ padding: "8px 14px", background: C.card, border: "none", color: C.sub, borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>↻ Refresh</button>
            <button onClick={onClose} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>✕ Close</button>
          </div>
        </div>
        {loading ? <div style={{ textAlign: "center", padding: "48px", color: C.sub }}>Loading...</div> : <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }}>
            {[["Total Revenue", `₹${(stats?.revenue || 0).toLocaleString()}`, C.accent], ["Resumes Sold", (stats?.total || 0).toString(), C.gold], ["Today Revenue", `₹${stats?.todayRevenue || 0}`, "#3b82f6"], ["Today Sales", (stats?.today || 0).toString(), "#a855f7"]].map(([l, v, col], i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: C.sub, marginBottom: "8px", textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontWeight: "700", fontSize: "24px", color: col }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: "600", color: C.text, fontSize: "14px" }}>Recent Payments</div>
            {payments.length === 0
              ? <div style={{ padding: "40px", textAlign: "center", color: C.sub, fontSize: "13px" }}>No payments yet. They'll appear here after the first purchase.</div>
              : payments.map((p, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1.5fr", padding: "12px 18px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: C.text, fontWeight: "600" }}>{p.name || "—"}</div>
                  <div style={{ fontSize: "12px", color: C.sub }}>{p.email || "—"}</div>
                  <div style={{ fontSize: "13px", color: C.accent, fontWeight: "700" }}>₹9</div>
                  <div style={{ fontSize: "12px", color: C.muted }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—"}</div>
                </div>
              ))}
          </div>
        </>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// LANDING PAGE
// ══════════════════════════════════════════════════════════
function Landing({ onStart, onUpload, onAdmin }) {
  return (
    <div className="rm-landing">
      <style>{`
        .feat-card:hover{border-color:${C.accent}55!important;transform:translateY(-3px);}
        .testi-card:hover{border-color:${C.accent}44!important;}
        .feat-card,.testi-card{transition:all .2s;}
        .cta-btn:hover{opacity:.9;transform:translateY(-1px);}
        .cta-btn{transition:all .15s;}
        .out-btn:hover{border-color:${C.accent}!important;color:${C.text}!important;}
        .out-btn{transition:all .15s;}
      `}</style>

      {/* NAV */}
      <nav className="rm-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 40px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(16px)", zIndex: 100, gap: "8px", flexWrap: "wrap" }}>
        <div style={{ fontWeight: "800", fontSize: "20px", color: C.text, letterSpacing: "-0.3px" }}>
          Resume<span style={{ color: C.accent }}>Mint</span>
          <span style={{ fontSize: "10px", background: C.accentDim, color: C.accent, padding: "2px 7px", borderRadius: "4px", marginLeft: "8px", fontWeight: "600" }}>INDIA</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={onAdmin} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${C.border}`, color: C.sub, borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>Admin</button>
          <button onClick={onStart} className="cta-btn" style={{ padding: "9px 20px", background: C.accent, color: "#000", border: "none", borderRadius: "9px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>Build Resume →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="rm-hero" style={{ animation: "fadeUp .5s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: C.accentDim, border: `1px solid ${C.accentBorder}`, padding: "5px 14px", borderRadius: "100px", marginBottom: "24px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent, display: "inline-block", animation: "pulse 1.8s infinite" }} />
          <span style={{ color: C.accent, fontSize: "12px", fontWeight: "600" }}>12,400+ resumes built · 87% shortlist rate</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: "600", fontSize: "clamp(36px,5.5vw,66px)", lineHeight: 1.1, marginBottom: "18px", color: C.text }}>
          The resume that gets you<br /><span style={{ color: C.accent }}>the interview.</span>
        </h1>
        <p style={{ fontSize: "17px", color: C.sub, maxWidth: "500px", marginBottom: "32px", lineHeight: 1.8 }}>
          ATS-optimised templates, AI job-matching, 3-minute build time. Built for Indian students & freshers. <strong style={{ color: C.text }}>Just ₹9 to download.</strong>
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "48px" }}>
          <button onClick={onStart} className="cta-btn" style={{ padding: "14px 32px", background: C.accent, color: "#000", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
            🚀 Build My Resume — Free
          </button>
          <button onClick={onUpload} className="out-btn" style={{ padding: "14px 22px", background: "transparent", color: C.sub, border: `1px solid ${C.border}`, borderRadius: "10px", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
            📄 Upload Existing Resume
          </button>
        </div>
        <div className="rm-stats">
          {[["₹9", "Flat download price"], ["3 min", "Build time"], ["100%", "ATS compatible"], ["87%", "Shortlist rate"]].map(([n, l], i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "26px", color: C.accent }}>{n}</div>
              <div style={{ color: C.muted, fontSize: "11px", marginTop: "4px" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="rm-section">
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", color: C.text, marginBottom: "8px" }}>Built to get you hired</h2>
          <p style={{ color: C.sub, fontSize: "14px" }}>Not just a template — a complete job-winning system</p>
        </div>
        <div className="rm-feats">
          {[
            ["🤖", "AI Job-Match", "Paste any JD → AI rewrites your summary, skills & bullets to match perfectly."],
            ["📋", "3 ATS Templates", "Classic, Modern, Executive — all pass ATS scanners used by Indian companies."],
            ["📄", "Upload & Auto-fill", "Upload your old resume (PDF/image) and AI extracts all data in seconds."],
            ["🇮🇳", "India-Focused", "Optimized for TCS, Infosys, Wipro, startups, and campus placements."],
            ["✏️", "Full Customization", "Edit every section, add custom sections, remove anything. Total control."],
            ["💳", "Pay Only to Download", "Build for free. Pay ₹9 only when you're happy with the result."],
          ].map(([icon, title, desc], i) => (
            <div key={i} className="feat-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "22px" }}>
              <div style={{ fontSize: "26px", marginBottom: "10px" }}>{icon}</div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: C.text, marginBottom: "7px" }}>{title}</div>
              <div style={{ color: C.sub, fontSize: "12px", lineHeight: 1.75 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="rm-section">
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", color: C.text }}>How it works</h2>
        </div>
        <div className="rm-steps">
          {[["1", "Fill Details", "Enter your education, experience, projects and skills — takes 3 minutes."], ["2", "Pick Template", "Choose Classic ATS, Modern, or Executive design."], ["3", "AI Optimize", "Paste a job description and AI tailors your resume for that role."], ["4", "Pay & Download", "Pay ₹9 via UPI or card. Clean PDF downloads instantly."]].map(([num, title, desc], i) => (
            <div key={i} style={{ textAlign: "center", padding: "22px 16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: C.accentDim, border: `2px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontFamily: "'Playfair Display',serif", fontSize: "18px", color: C.accent }}>{num}</div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: C.text, marginBottom: "6px" }}>{title}</div>
              <div style={{ color: C.sub, fontSize: "12px", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="rm-section">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", color: C.text }}>Students who got shortlisted</h2>
        </div>
        <div className="rm-testis">
          {[
            ["Priya Nair", "NIT Calicut", "Got calls from Infosys and TCS within a week. The AI job-match is brilliant — it matched my resume to each JD perfectly."],
            ["Rahul Verma", "SRM University", "Used the Executive template for a product startup and got a callback. Didn't expect ₹9 to make this big a difference."],
            ["Sneha Reddy", "BITS Pilani", "3 interview calls in a week after I updated my resume here. The ATS format actually works."],
          ].map(([name, college, text], i) => (
            <div key={i} className="testi-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "22px" }}>
              <div style={{ color: C.gold, fontSize: "14px", marginBottom: "10px" }}>★★★★★</div>
              <p style={{ color: C.sub, fontSize: "13px", lineHeight: 1.8, marginBottom: "16px" }}>"{text}"</p>
              <div style={{ fontWeight: "700", color: C.text, fontSize: "13px" }}>{name}</div>
              <div style={{ color: C.muted, fontSize: "11px", marginTop: "2px" }}>{college}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "56px 24px 72px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "52px 32px", maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "34px", color: C.text, marginBottom: "12px" }}>Your next job starts here.</h2>
          <p style={{ color: C.sub, fontSize: "14px", lineHeight: 1.8, marginBottom: "28px" }}>Build for free. Pay ₹9 only when you're ready to download.</p>
          <button onClick={onStart} className="cta-btn" style={{ padding: "15px 40px", background: C.accent, color: "#000", border: "none", borderRadius: "11px", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}>
            Start Building — It's Free
          </button>
          <div style={{ color: C.muted, fontSize: "11px", marginTop: "12px" }}>No account needed · ₹9 to download · Instant PDF</div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ fontWeight: "700", color: C.text, fontSize: "14px" }}>Resume<span style={{ color: C.accent }}>Mint</span></div>
        <div style={{ color: C.muted, fontSize: "11px" }}>© 2025 ResumeMint · Made in India 🇮🇳 · support@resumemint.in</div>
      </footer>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// STABLE FIELD COMPONENTS — defined outside Builder so they
// never remount on re-render (fixes typing/space issues)
// ══════════════════════════════════════════════════════════
const FIELD_STYLE = {
  width: "100%",
  padding: "11px 13px",
  background: "#0d0d14",
  border: "1px solid #252535",
  borderRadius: "9px",
  color: "#f0f0ff",
  fontSize: "14px",
  outline: "none",
  marginBottom: "12px",
  lineHeight: "1.5",
  fontFamily: "'Outfit', sans-serif",
  transition: "border-color .15s",
  boxSizing: "border-box",
  display: "block",
};
const LABEL_STYLE = {
  fontSize: "11px", color: "#8888aa", display: "block",
  marginBottom: "5px", fontWeight: "600",
  textTransform: "uppercase", letterSpacing: "0.5px",
};

function Field({ label, value, onChange, placeholder, type, hint }) {
  return (
    <div style={{ marginBottom: "2px" }}>
      {label && <label style={LABEL_STYLE}>{label}</label>}
      <input
        type={type || "text"}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || ""}
        style={FIELD_STYLE}
        onFocus={e => { e.target.style.borderColor = "#22c55e"; }}
        onBlur={e => { e.target.style.borderColor = "#252535"; }}
      />
      {hint && <div style={{ fontSize: "11px", color: "#44445a", marginTop: "-8px", marginBottom: "10px", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows, hint }) {
  return (
    <div style={{ marginBottom: "2px" }}>
      {label && <label style={LABEL_STYLE}>{label}</label>}
      <textarea
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || ""}
        rows={rows || 4}
        style={{ ...FIELD_STYLE, resize: "vertical", height: "auto", minHeight: `${(rows || 4) * 24}px` }}
        onFocus={e => { e.target.style.borderColor = "#22c55e"; }}
        onBlur={e => { e.target.style.borderColor = "#252535"; }}
      />
      {hint && <div style={{ fontSize: "11px", color: "#44445a", marginTop: "-8px", marginBottom: "10px", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// BUILDER — fully responsive, localStorage, no autocomplete
// ══════════════════════════════════════════════════════════
function Builder({ onBack, initialForm }) {
  const [form, setForm] = useState(() => {
    const saved = store.get(STORAGE_KEY);
    return saved || { ...EMPTY, ...(initialForm || {}), customSections: initialForm?.customSections || [] };
  });
  const [tplId, setTplId] = useState("classic");
  const [tab, setTab] = useState("personal");
  const [showAI, setShowAI] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [paid, setPaid] = useState(() => {
    const p = store.get(PAID_KEY);
    // Paid status valid for 24 hours
    return p && p.paid && (Date.now() - p.ts < 86400000);
  });
  const [mView, setMView] = useState("form"); // "form" | "preview"
  const [saveMsg, setSaveMsg] = useState("");

  const Tmpl = tplId === "classic" ? TemplateClassic : tplId === "modern" ? TemplateModern : TemplateExecutive;
  const T = TEMPLATES.find(t => t.id === tplId) || TEMPLATES[0];

  // Save to localStorage on every form change
  useEffect(() => {
    store.set(STORAGE_KEY, form);
    setSaveMsg("Saved");
    const t = setTimeout(() => setSaveMsg(""), 1500);
    return () => clearTimeout(t);
  }, [form]);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updA = (s, i, k, v) => setForm(p => { const a = [...p[s]]; a[i] = { ...a[i], [k]: v }; return { ...p, [s]: a }; });
  const updS = (k, v) => setForm(p => ({ ...p, skills: { ...p.skills, [k]: v } }));
  const addR = (s, empty) => setForm(p => ({ ...p, [s]: [...p[s], { ...empty }] }));
  const delR = (s, i) => setForm(p => ({ ...p, [s]: p[s].filter((_, j) => j !== i) }));
  const addC = () => setForm(p => ({ ...p, customSections: [...p.customSections, { title: "", content: "" }] }));
  const updC = (i, k, v) => setForm(p => { const a = [...p.customSections]; a[i] = { ...a[i], [k]: v }; return { ...p, customSections: a }; });
  const delC = (i) => setForm(p => ({ ...p, customSections: p.customSections.filter((_, j) => j !== i) }));

  const triggerDownload = () => {
    // Switch to preview tab first so the resume is definitely rendered
    setMView("preview");

    setTimeout(() => {
      const preview = document.getElementById("rm-preview-inner");
      if (!preview) {
        alert("Could not find resume. Please click the Preview tab, then try Download PDF again.");
        return;
      }

      // Get the resume's raw HTML (it already has all inline styles)
      const resumeHTML = preview.innerHTML;

      // Get Google Fonts URL from the page
      const fontURL = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600&display=swap";

      // Build a completely clean, self-contained HTML page with ONLY the resume
      // No dark background, no app styles, just white page + resume
      const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Resume</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${fontURL}">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #ffffff !important;
    color: #000000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { margin: 0; size: A4; }
  @media print {
    html, body { background: #ffffff !important; }
  }
</style>
</head>
<body style="background:#fff;margin:0;padding:0;">
${resumeHTML}
</body>
</html>`;

      // Create a hidden iframe in the current page (avoids popup blocker)
      let iframe = document.getElementById("rm-print-iframe");
      if (iframe) iframe.remove();

      iframe = document.createElement("iframe");
      iframe.id = "rm-print-iframe";
      iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;";
      document.body.appendChild(iframe);

      // Write the clean HTML into the iframe
      iframe.contentDocument.open();
      iframe.contentDocument.write(fullHTML);
      iframe.contentDocument.close();

      // Wait for iframe content + fonts to load, then print from it
      const doPrint = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Clean up after a delay
          setTimeout(() => {
            try { iframe.remove(); } catch(e) {}
          }, 5000);
        } catch(e) {
          console.error("iframe print failed, trying window.print", e);
          window.print();
        }
      };

      // Give fonts 1.2s to load then print
      setTimeout(doPrint, 1200);

    }, 100); // small delay to let setMView("preview") render
  };

  // Field/TextArea components handle their own styles (defined outside Builder)
  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", marginBottom: "12px" };
  const rmbtn = { padding: "4px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600" };
  const addbtn = { width: "100%", padding: "10px", background: "transparent", border: `1px dashed ${C.border}`, color: C.accent, borderRadius: "9px", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginTop: "2px" };

  const TABS = [
    { id: "personal", icon: "👤", label: "Personal" },
    { id: "education", icon: "🎓", label: "Education" },
    { id: "experience", icon: "💼", label: "Experience" },
    { id: "projects", icon: "🚀", label: "Projects" },
    { id: "skills", icon: "🛠", label: "Skills" },
    { id: "extra", icon: "➕", label: "Extra" },
  ];

  // Field and TextArea components defined outside Builder for stability

  return (
    <div className="rm-builder">
      {/* Print styles injected dynamically via triggerDownload */}

      {/* TOP BAR */}
      <div className="rm-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={onBack} style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${C.border}`, color: C.sub, borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>← Back</button>
          <div style={{ fontWeight: "800", fontSize: "16px", color: C.text }}>Resume<span style={{ color: C.accent }}>Mint</span></div>
          {saveMsg && <span style={{ fontSize: "11px", color: C.accent, opacity: 0.8 }}>✓ {saveMsg}</span>}
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Mobile edit/preview toggle */}
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: "7px", overflow: "hidden" }}>
            {[["form", "✏ Edit"], ["preview", "👁 Preview"]].map(([v, l]) => (
              <button key={v} onClick={() => setMView(v)} style={{ padding: "6px 11px", background: mView === v ? C.accent : "transparent", color: mView === v ? "#000" : C.sub, border: "none", fontSize: "12px", fontWeight: mView === v ? "700" : "400", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          {/* Template buttons */}
          <div className="hide-mobile" style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: "7px", overflow: "hidden" }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTplId(t.id)} title={t.desc} style={{ padding: "6px 10px", background: tplId === t.id ? C.accentDim : "transparent", border: "none", borderRight: `1px solid ${C.border}`, color: tplId === t.id ? C.accent : C.sub, fontSize: "11px", fontWeight: tplId === t.id ? "700" : "400", cursor: "pointer", whiteSpace: "nowrap" }}>
                {t.icon} {t.name}
              </button>
            ))}
          </div>
          {/* Mobile template select */}
          <select className="show-mobile" value={tplId} onChange={e => setTplId(e.target.value)} style={{ padding: "6px 8px", background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: "7px", fontSize: "12px", cursor: "pointer", display: "none" }}>
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={() => setForm({ ...SAMPLE, customSections: [] })} style={{ padding: "6px 10px", background: C.card, border: `1px solid ${C.border}`, color: C.sub, borderRadius: "7px", fontSize: "11px", cursor: "pointer" }}>Sample</button>
          <button onClick={() => setShowAI(true)} style={{ padding: "6px 12px", background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: "7px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>🤖 AI</button>
          <button onClick={() => paid ? triggerDownload() : setShowPay(true)} style={{ padding: "8px 16px", background: paid ? "#16a34a" : C.accent, color: "#000", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
            {paid ? "⬇ Download PDF" : "💳 Pay ₹9"}
          </button>
        </div>
      </div>

      {/* MAIN SPLIT */}
      <div className="rm-split">

        {/* FORM PANEL */}
        <div className="rm-formpanel" style={{ display: mView === "preview" ? "none" : "flex" }}>
          {/* Template select on mobile inside form */}
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, display: "none" }} className="show-mobile-flex">
            <div style={{ fontSize: "11px", color: C.sub, marginBottom: "4px" }}>Template</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTplId(t.id)} style={{ padding: "5px 10px", background: tplId === t.id ? C.accentDim : C.card, border: `1px solid ${tplId === t.id ? C.accentBorder : C.border}`, color: tplId === t.id ? C.accent : C.sub, borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: tplId === t.id ? "700" : "400" }}>
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, overflowX: "auto", flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{ padding: "10px 12px", border: "none", cursor: "pointer", background: tab === t.id ? C.bg : C.surface, color: tab === t.id ? C.accent : C.sub, fontSize: "11px", fontWeight: tab === t.id ? "700" : "500", borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent", flexShrink: 0, whiteSpace: "nowrap" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Scrollable form content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>

            {tab === "personal" && <>
              <div style={card}>
                <div style={{ fontWeight: "700", color: C.text, fontSize: "14px", marginBottom: "14px" }}>Contact Information</div>
                <Field label="Full Name" value={form.name} onChange={e => upd("name", e.target.value)} placeholder="e.g. Arjun Sharma" />
                <Field label="Email Address" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="arjun@gmail.com" type="email" />
                <Field label="Phone" value={form.phone} onChange={e => upd("phone", e.target.value)} placeholder="+91 98765 43210" />
                <Field label="City, State" value={form.location} onChange={e => upd("location", e.target.value)} placeholder="Bangalore, Karnataka" />
                <Field label="LinkedIn URL" value={form.linkedin} onChange={e => upd("linkedin", e.target.value)} placeholder="linkedin.com/in/yourname" />
                <Field label="GitHub URL" value={form.github} onChange={e => upd("github", e.target.value)} placeholder="github.com/yourname" />
                <Field label="Portfolio / Website" value={form.website} onChange={e => upd("website", e.target.value)} placeholder="yoursite.dev" />
              </div>
              <div style={card}>
                <TextArea label="Professional Summary" value={form.summary} onChange={e => upd("summary", e.target.value)} placeholder="3-4 sentences about your skills, experience, and target role." rows={4} hint="Tip: mention your target role, years of experience, and 2-3 key skills." />

              </div>
            </>}

            {tab === "education" && <>
              {form.education.map((e, i) => (
                <div key={i} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700", color: C.text, fontSize: "14px" }}>Education {form.education.length > 1 ? `#${i + 1}` : ""}</div>
                    {form.education.length > 1 && <button onClick={() => delR("education", i)} style={rmbtn}>✕ Remove</button>}
                  </div>
                  <Field label="Degree / Course" value={e.degree} onChange={ev => updA("education", i, "degree", ev.target.value)} placeholder="B.Tech Computer Science" />
                  <Field label="College / University" value={e.school} onChange={ev => updA("education", i, "school", ev.target.value)} placeholder="NIT Trichy, Tamil Nadu" />
                  <Field label="Year" value={e.year} onChange={ev => updA("education", i, "year", ev.target.value)} placeholder="2021–2025" />
                  <Field label="CGPA / Percentage" value={e.gpa} onChange={ev => updA("education", i, "gpa", ev.target.value)} placeholder="8.5 CGPA" />
                </div>
              ))}
              <button onClick={() => addR("education", { degree: "", school: "", year: "", gpa: "" })} style={addbtn}>+ Add Education</button>
            </>}

            {tab === "experience" && <>
              {form.experience.map((e, i) => (
                <div key={i} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700", color: C.text, fontSize: "14px" }}>Experience {form.experience.length > 1 ? `#${i + 1}` : ""}</div>
                    {form.experience.length > 1 && <button onClick={() => delR("experience", i)} style={rmbtn}>✕ Remove</button>}
                  </div>
                  <Field label="Job Title" value={e.role} onChange={ev => updA("experience", i, "role", ev.target.value)} placeholder="Software Developer Intern" />
                  <Field label="Company & Location" value={e.company} onChange={ev => updA("experience", i, "company", ev.target.value)} placeholder="Razorpay, Bangalore" />
                  <Field label="Duration" value={e.duration} onChange={ev => updA("experience", i, "duration", ev.target.value)} placeholder="Jun 2024 – Aug 2024" />
                  <TextArea label="Key Achievements (one per line)" value={e.bullets} onChange={ev => updA("experience", i, "bullets", ev.target.value)} placeholder={"Built X reducing time by 40%\nProcessed 10k+ events/day\nImproved test coverage to 90%"} rows={5} hint="Tip: Start each line with an action verb. Use numbers for impact." />

                </div>
              ))}
              <button onClick={() => addR("experience", { role: "", company: "", duration: "", bullets: "" })} style={addbtn}>+ Add Experience</button>
            </>}

            {tab === "projects" && <>
              {form.projects.map((p, i) => (
                <div key={i} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "700", color: C.text, fontSize: "14px" }}>Project {form.projects.length > 1 ? `#${i + 1}` : ""}</div>
                    {form.projects.length > 1 && <button onClick={() => delR("projects", i)} style={rmbtn}>✕ Remove</button>}
                  </div>
                  <Field label="Project Name" value={p.name} onChange={ev => updA("projects", i, "name", ev.target.value)} placeholder="ATS Resume Builder" />
                  <Field label="Tech Stack" value={p.tech} onChange={ev => updA("projects", i, "tech", ev.target.value)} placeholder="React, Node.js, MongoDB" />
                  <Field label="GitHub / Live Link" value={p.link} onChange={ev => updA("projects", i, "link", ev.target.value)} placeholder="github.com/yourname/project" />
                  <TextArea label="Description & Impact" value={p.description} onChange={ev => updA("projects", i, "description", ev.target.value)} placeholder="Built for X users. Achieved Y. Used Z." rows={3} />
                </div>
              ))}
              <button onClick={() => addR("projects", { name: "", tech: "", description: "", link: "" })} style={addbtn}>+ Add Project</button>
            </>}

            {tab === "skills" && <div style={card}>
              <div style={{ fontWeight: "700", color: C.text, fontSize: "14px", marginBottom: "14px" }}>Skills & Qualifications</div>
              <Field label="Technical Skills (comma separated)" value={form.skills.technical} onChange={e => updS("technical", e.target.value)} placeholder="React, Node.js, MongoDB, Git, Docker, AWS" />
              <Field label="Programming Languages" value={form.skills.languages} onChange={e => updS("languages", e.target.value)} placeholder="Java, JavaScript, Python, C++, SQL" />
              <Field label="Tools & Platforms" value={form.skills.tools} onChange={e => updS("tools", e.target.value)} placeholder="VS Code, Postman, Figma, Jira, Linux" />
              <Field label="Soft Skills" value={form.skills.soft} onChange={e => updS("soft", e.target.value)} placeholder="Leadership, Communication, Problem Solving" />
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "14px", marginTop: "4px" }}>
                <TextArea label="Certifications (one per line)" value={form.certifications} onChange={e => upd("certifications", e.target.value)} placeholder={"AWS Cloud Practitioner (2024)\nGoogle Analytics Certificate"} rows={3} />
                <TextArea label="Achievements / Activities" value={form.achievements} onChange={e => upd("achievements", e.target.value)} placeholder={"Winner — Hackathon 2024\nGoogle DSC Lead"} rows={3} />
              </div>
            </div>}

            {tab === "extra" && <>
              <div style={{ ...card, background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.sub, fontSize: "12px", lineHeight: 1.7 }}>
                💡 Add custom sections: Volunteer Work, Languages Spoken, Research, Publications, Hobbies, etc.
              </div>
              {form.customSections.map((sec, i) => (
                <div key={i} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontWeight: "700", color: C.text, fontSize: "13px" }}>Custom Section {i + 1}</div>
                    <button onClick={() => delC(i)} style={rmbtn}>✕ Remove</button>
                  </div>
                  <Field label="Section Title" value={sec.title} onChange={e => updC(i, "title", e.target.value)} placeholder="e.g. Volunteer Work" />
                  <TextArea label="Content (one item per line)" value={sec.content} onChange={e => updC(i, "content", e.target.value)} placeholder={"Volunteer Teacher — Teach For India (2023)\nFluent in English, Hindi, Kannada"} rows={4} />
                </div>
              ))}
              <button onClick={addC} style={{ ...addbtn, border: `1px dashed ${C.accent}`, color: C.accent }}>+ Add Custom Section</button>
            </>}

          </div>

          {/* Bottom bar with progress */}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: C.surface }}>
            <div style={{ fontSize: "11px", color: C.muted }}>
              {paid ? <span style={{ color: C.accent }}>✅ Unlocked — ready to download</span> : "🔒 Preview mode — pay ₹9 to download"}
            </div>
            <button onClick={() => paid ? triggerDownload() : setShowPay(true)} style={{ padding: "7px 14px", background: C.accent, color: "#000", border: "none", borderRadius: "7px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
              {paid ? "⬇ Download" : "Pay ₹9"}
            </button>
          </div>
        </div>

        {/* PREVIEW PANEL */}
        <div className="rm-prevpanel" style={{ display: mView === "form" ? "none" : "flex" }}
          id="rm-preview-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>Live Preview · {T.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", color: paid ? C.accent : C.muted, fontWeight: paid ? "700" : "400" }}>
                {paid ? "✅ Unlocked" : "🔒 Watermarked preview"}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {/* Resume preview */}
            <div style={{ background: "#fff", borderRadius: "6px", overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.3)", maxWidth: "760px", margin: "0 auto" }}>
              <div id="rm-preview-inner">
                <Tmpl form={form} watermark={!paid} />
              </div>
            </div>
            {/* Pay CTA below preview */}
            {!paid && (
              <div style={{ maxWidth: "760px", margin: "14px auto 0", background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px", textAlign: "center" }}>
                <div style={{ fontWeight: "700", color: C.text, marginBottom: "5px", fontSize: "15px" }}>Happy with your resume?</div>
                <div style={{ color: C.sub, fontSize: "12px", marginBottom: "14px" }}>Remove watermark · Perfect print quality · Just ₹9</div>
                <button onClick={() => setShowPay(true)} style={{ padding: "11px 28px", background: C.accent, color: "#000", border: "none", borderRadius: "9px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                  Pay ₹9 & Download →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAI && <AIModal onClose={() => setShowAI(false)} form={form} onApply={f => { setForm(f); setShowAI(false); }} />}
      {showPay && <PaymentModal form={form} onClose={() => setShowPay(false)}
        onSuccess={() => {
          setPaid(true);
          setShowPay(false);
          store.set(PAID_KEY, { paid: true, ts: Date.now() });
          setMView("preview");
          setTimeout(() => triggerDownload(), 800);
        }} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("landing");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [seedForm, setSeedForm] = useState(null);

  return (<>
    <style>{GS}</style>


    {page === "landing" && (
      <Landing
        onStart={() => { setSeedForm(null); setPage("builder"); }}
        onUpload={() => setShowUpload(true)}
        onAdmin={() => setShowAdmin(true)}
      />
    )}
    {page === "builder" && (
      <Builder
        initialForm={seedForm || store.get(STORAGE_KEY) || EMPTY}
        onBack={() => setPage("landing")}
      />
    )}
    {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    {showUpload && <UploadModal
      onClose={() => setShowUpload(false)}
      onExtracted={f => { setSeedForm(f); setShowUpload(false); setPage("builder"); }}
    />}
  </>);
}

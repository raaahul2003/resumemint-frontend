// ResumeMint v6 — Final Production Version
// All features: Upload, AI Match, Payment, 3 Templates, Custom Sections, Dark/Light
import { useState, useRef } from "react";

// ── CONFIG ────────────────────────────────────────────────
const BACKEND = "https://resumemint-backend.onrender.com";
const RAZORPAY_KEY = "rzp_live_SPxfWRaOw9vYcS"; // Live key

// ── THEME TOKENS ──────────────────────────────────────────
const DARK = {
  bg:"#07070f", surface:"#0e0e1a", card:"#13131f", border:"#1c1c2e",
  accent:"#00e5a0", accentDim:"#00e5a015", gold:"#f5c842", red:"#ff4560", blue:"#3b82f6",
  text:"#e2e2f0", muted:"#5a5a75",
};
const LIGHT = {
  bg:"#f0f2f7", surface:"#ffffff", card:"#ffffff", border:"#e2e8f0",
  accent:"#0ea96e", accentDim:"#0ea96e15", gold:"#d97706", red:"#dc2626", blue:"#2563eb",
  text:"#1a1a2e", muted:"#64748b",
};

// ── GLOBAL STYLES ─────────────────────────────────────────
const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#2a2a3e;border-radius:4px;}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes glow{0%,100%{box-shadow:0 0 10px #00e5a044}50%{box-shadow:0 0 28px #00e5a099}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  input,textarea,select{font-family:inherit;}
  button{font-family:inherit;cursor:pointer;}
  @media(max-width:768px){
    .builder-split{flex-direction:column !important;}
    .preview-panel{display:none !important;}
    .preview-panel.show{display:flex !important;}
    .form-panel{width:100% !important;}
    .landing-grid{grid-template-columns:1fr 1fr !important;}
    .stat-row{grid-template-columns:1fr 1fr !important;}
    .testi-row{grid-template-columns:1fr !important;}
    .admin-wrap{flex-direction:column !important;}
    .admin-sidebar{width:100% !important;flex-direction:row !important;flex-wrap:wrap;}
    .metrics-grid{grid-template-columns:1fr 1fr !important;}
  }
`;

// ── RATE LIMITER ──────────────────────────────────────────
const _rl = {};
const rateLimit = (k,max,win) => {
  const now = Date.now();
  if(!_rl[k]) _rl[k]=[];
  _rl[k] = _rl[k].filter(t=>now-t<win);
  if(_rl[k].length>=max) return false;
  _rl[k].push(now); return true;
};

// ── DEFAULT FORM DATA ─────────────────────────────────────
const EMPTY = {
  name:"",email:"",phone:"",location:"",linkedin:"",github:"",website:"",summary:"",
  education:[{degree:"",school:"",year:"",gpa:""}],
  experience:[{role:"",company:"",duration:"",bullets:""}],
  projects:[{name:"",tech:"",description:"",link:""}],
  skills:{technical:"",languages:"",soft:"",tools:""},
  certifications:"",achievements:"",
  customSections:[],
};

const SAMPLE = {
  name:"Arjun Sharma",email:"arjun.sharma@gmail.com",phone:"+91 98765 43210",
  location:"Bangalore, Karnataka",linkedin:"linkedin.com/in/arjunsharma",
  github:"github.com/arjunsharma",website:"arjunsharma.dev",
  summary:"Final year B.Tech CSE student with 1+ year internship experience in full-stack development. Built 3 production projects with 500+ active users. Strong in React, Node.js and AWS. Seeking SDE role at product-based company.",
  education:[{degree:"B.Tech Computer Science Engineering",school:"RV College of Engineering, Bangalore",year:"2021–2025",gpa:"8.7 CGPA"}],
  experience:[{role:"Software Development Intern",company:"Razorpay, Bangalore",duration:"Jun 2024 – Aug 2024",
    bullets:"Built payment analytics dashboard reducing reporting time by 40%\nIntegrated webhook system processing 10k+ events/day with 99.9% uptime\nWrote unit tests achieving 90% coverage using Jest & React Testing Library\nCollaborated with 8-member team using Agile/Scrum methodology"}],
  projects:[
    {name:"ResumeMint — ATS Resume Builder",tech:"React, Node.js, MongoDB, Razorpay",description:"SaaS tool for Indian job seekers. 500+ resumes downloaded in first month.",link:"resumemint.in"},
    {name:"Smart Attendance System",tech:"Python, OpenCV, Flask, MySQL",description:"Face recognition attendance for college. 95% accuracy. Used by 400+ students.",link:"github.com/arjunsharma"},
  ],
  skills:{technical:"React.js, Node.js, Express, MongoDB, MySQL, REST APIs, Git, Docker, AWS EC2/S3",
    languages:"JavaScript, Python, Java, C++, SQL",
    soft:"Problem Solving, Team Leadership, Communication, Time Management",
    tools:"VS Code, Postman, Figma, Jira, Linux"},
  certifications:"AWS Certified Cloud Practitioner — Amazon (2024)\nGoogle Data Analytics Professional Certificate (2023)\nHackerRank Gold Badge — Problem Solving",
  achievements:"Academic Rank 3 in Dept. (2023)\nWinner — Internal Hackathon 2024\nGoogle DSC Lead — RVCE Chapter",
  customSections:[],
};

// ── WATERMARK ─────────────────────────────────────────────
function Watermark(){
  return(
    <div style={{position:"absolute",inset:0,zIndex:10,pointerEvents:"none",
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(255,255,255,0.25)"}}>
      <div style={{transform:"rotate(-32deg)",textAlign:"center",userSelect:"none",opacity:0.6}}>
        <div style={{fontSize:"20px",fontWeight:"900",color:"#00000030",
          letterSpacing:"5px",fontFamily:"Outfit,sans-serif",textTransform:"uppercase"}}>
          PREVIEW ONLY
        </div>
        <div style={{fontSize:"12px",color:"#00000025",letterSpacing:"3px",marginTop:"4px"}}>
          Pay ₹9 to Download
        </div>
      </div>
    </div>
  );
}

// ── TEMPLATE: CLASSIC ATS (Clean Black & White, Overleaf-style) ──
function TemplateClassic({form,watermark}){
  const S = {
    page:{fontFamily:"'Times New Roman',Georgia,serif",fontSize:"10.5pt",color:"#111",
      background:"#fff",padding:"0.65in 0.7in",lineHeight:1.55,
      maxWidth:"750px",margin:"0 auto",position:"relative",minHeight:"1050px"},
    name:{fontSize:"22pt",fontWeight:"700",color:"#000",textAlign:"center",
      letterSpacing:"0.5px",marginBottom:"4px"},
    contact:{fontSize:"9pt",color:"#333",display:"flex",gap:"10px",flexWrap:"wrap",
      justifyContent:"center",marginBottom:"8px"},
    rule:{borderTop:"1.5pt solid #000",margin:"7px 0 5px"},
    thinRule:{borderTop:"0.5pt solid #888",margin:"4px 0"},
    sh:{fontSize:"10.5pt",fontWeight:"700",color:"#000",textTransform:"uppercase",
      letterSpacing:"0.8px",marginBottom:"3px",marginTop:"11px"},
    row:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"},
    sub:{color:"#444",fontSize:"9pt"},
    ul:{marginLeft:"14px",listStyleType:"disc",marginTop:"2px"},
    li:{marginBottom:"2px",fontSize:"10pt",lineHeight:1.5},
    bold:{fontWeight:"700",fontSize:"10.5pt"},
  };
  return(
    <div style={{position:"relative"}}>
      {watermark&&<Watermark/>}
      <div style={S.page}>
        {/* HEADER */}
        <div style={S.name}>{form.name||"Your Name"}</div>
        <div style={S.contact}>
          {form.location&&<span>{form.location}</span>}
          {form.email&&<span>| {form.email}</span>}
          {form.phone&&<span>| {form.phone}</span>}
          {form.linkedin&&<span>| {form.linkedin}</span>}
          {form.github&&<span>| {form.github}</span>}
          {form.website&&<span>| {form.website}</span>}
        </div>
        <div style={S.rule}/>

        {/* SUMMARY */}
        {form.summary&&<>
          <div style={S.sh}>Professional Summary</div>
          <div style={S.thinRule}/>
          <p style={{fontSize:"10pt",lineHeight:1.65,marginBottom:"4px",marginTop:"3px"}}>{form.summary}</p>
        </>}

        {/* EDUCATION */}
        {form.education?.[0]?.degree&&<>
          <div style={S.sh}>Education</div>
          <div style={S.thinRule}/>
          {form.education.map((e,i)=>(
            <div key={i} style={{...S.row,marginBottom:"6px",marginTop:"4px"}}>
              <div>
                <div style={S.bold}>{e.degree}</div>
                <div style={S.sub}>{e.school}</div>
              </div>
              <div style={{textAlign:"right",fontSize:"9.5pt",color:"#333",flexShrink:0}}>
                <div>{e.year}</div>
                {e.gpa&&<div style={{color:"#555"}}>{e.gpa}</div>}
              </div>
            </div>
          ))}
        </>}

        {/* EXPERIENCE */}
        {form.experience?.[0]?.role&&<>
          <div style={S.sh}>Work Experience</div>
          <div style={S.thinRule}/>
          {form.experience.map((e,i)=>(
            <div key={i} style={{marginBottom:"10px",marginTop:"4px"}}>
              <div style={S.row}>
                <div style={S.bold}>{e.role}{e.company&&<span style={{fontWeight:"400"}}> — {e.company}</span>}</div>
                <div style={{...S.sub,flexShrink:0}}>{e.duration}</div>
              </div>
              {e.bullets&&<ul style={S.ul}>
                {e.bullets.split("\n").filter(Boolean).map((b,j)=><li key={j} style={S.li}>{b}</li>)}
              </ul>}
            </div>
          ))}
        </>}

        {/* PROJECTS */}
        {form.projects?.[0]?.name&&<>
          <div style={S.sh}>Projects</div>
          <div style={S.thinRule}/>
          {form.projects.map((p,i)=>(
            <div key={i} style={{marginBottom:"7px",marginTop:"4px"}}>
              <div style={S.row}>
                <div style={S.bold}>{p.name}</div>
                {p.link&&<div style={{...S.sub,flexShrink:0}}>{p.link}</div>}
              </div>
              {p.tech&&<div style={{fontSize:"9.5pt",fontStyle:"italic",color:"#555",marginBottom:"1px"}}>{p.tech}</div>}
              {p.description&&<div style={{fontSize:"10pt",lineHeight:1.5}}>{p.description}</div>}
            </div>
          ))}
        </>}

        {/* SKILLS */}
        {(form.skills?.technical||form.skills?.languages)&&<>
          <div style={S.sh}>Technical Skills</div>
          <div style={S.thinRule}/>
          <div style={{marginTop:"4px"}}>
            {form.skills?.technical&&<div style={{fontSize:"10pt",marginBottom:"2px"}}><strong>Core Skills: </strong>{form.skills.technical}</div>}
            {form.skills?.languages&&<div style={{fontSize:"10pt",marginBottom:"2px"}}><strong>Languages: </strong>{form.skills.languages}</div>}
            {form.skills?.tools&&<div style={{fontSize:"10pt",marginBottom:"2px"}}><strong>Tools: </strong>{form.skills.tools}</div>}
            {form.skills?.soft&&<div style={{fontSize:"10pt",marginBottom:"2px"}}><strong>Soft Skills: </strong>{form.skills.soft}</div>}
          </div>
        </>}

        {/* CERTIFICATIONS */}
        {form.certifications&&<>
          <div style={S.sh}>Certifications</div>
          <div style={S.thinRule}/>
          <ul style={{...S.ul,marginTop:"4px"}}>
            {form.certifications.split("\n").filter(Boolean).map((c,i)=><li key={i} style={S.li}>{c}</li>)}
          </ul>
        </>}

        {/* ACHIEVEMENTS */}
        {form.achievements&&<>
          <div style={S.sh}>Achievements & Activities</div>
          <div style={S.thinRule}/>
          <ul style={{...S.ul,marginTop:"4px"}}>
            {form.achievements.split("\n").filter(Boolean).map((a,i)=><li key={i} style={S.li}>{a}</li>)}
          </ul>
        </>}

        {/* CUSTOM SECTIONS */}
        {form.customSections?.map((sec,i)=>sec.title&&sec.content?(
          <div key={i}>
            <div style={S.sh}>{sec.title}</div>
            <div style={S.thinRule}/>
            <ul style={{...S.ul,marginTop:"4px"}}>
              {sec.content.split("\n").filter(Boolean).map((l,j)=><li key={j} style={S.li}>{l}</li>)}
            </ul>
          </div>
        ):null)}
      </div>
    </div>
  );
}

// ── TEMPLATE: MODERN SIDEBAR ──────────────────────────────
function TemplateModern({form,watermark,theme}){
  const T = theme==="dark"
    ?{bg:"#0d1117",sb:"#161b22",text:"#c9d1d9",head:"#58a6ff",acc:"#3fb950",name:"#f0f6fc",sub:"#8b949e",line:"#21262d"}
    :{bg:"#ffffff",sb:"#f0f4f8",text:"#2d3748",head:"#2563eb",acc:"#059669",name:"#0f172a",sub:"#718096",line:"#e2e8f0"};
  return(
    <div style={{position:"relative"}}>
      {watermark&&<Watermark/>}
      <div style={{display:"flex",fontFamily:"Arial,sans-serif",fontSize:"10.5px",
        background:T.bg,color:T.text,maxWidth:"750px",margin:"0 auto",lineHeight:1.6,minHeight:"1050px"}}>
        {/* SIDEBAR */}
        <div style={{width:"220px",background:T.sb,padding:"30px 18px",flexShrink:0}}>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:"18px",fontWeight:"800",
            color:T.name,marginBottom:"3px",lineHeight:1.2}}>{form.name||"Your Name"}</div>
          <div style={{fontSize:"9px",color:T.head,fontWeight:"600",textTransform:"uppercase",
            letterSpacing:"1px",marginBottom:"16px"}}>{form.experience?.[0]?.role||"Software Engineer"}</div>

          <div style={{borderTop:`1px solid ${T.line}`,paddingTop:"12px",marginBottom:"12px"}}>
            <div style={{fontSize:"9px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>Contact</div>
            {[[form.email,"✉"],[form.phone,"✆"],[form.location,"📍"],[form.linkedin,"in"],[form.github,"⌥"],[form.website,"🌐"]].filter(([v])=>v).map(([v,icon],i)=>(
              <div key={i} style={{fontSize:"9px",marginBottom:"5px",wordBreak:"break-all",color:T.text,display:"flex",gap:"4px"}}>
                <span style={{color:T.head,flexShrink:0}}>{icon}</span><span>{v}</span>
              </div>
            ))}
          </div>

          {form.skills?.technical&&<div style={{borderTop:`1px solid ${T.line}`,paddingTop:"12px",marginBottom:"12px"}}>
            <div style={{fontSize:"9px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>Skills</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"3px"}}>
              {form.skills.technical.split(",").map((s,i)=>(
                <span key={i} style={{display:"inline-block",fontSize:"8px",padding:"2px 7px",
                  background:`${T.head}20`,color:T.head,borderRadius:"3px"}}>{s.trim()}</span>
              ))}
            </div>
          </div>}

          {form.skills?.languages&&<div style={{borderTop:`1px solid ${T.line}`,paddingTop:"10px",marginBottom:"10px"}}>
            <div style={{fontSize:"9px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px"}}>Languages</div>
            <div style={{fontSize:"9px",color:T.text}}>{form.skills.languages}</div>
          </div>}

          {form.certifications&&<div style={{borderTop:`1px solid ${T.line}`,paddingTop:"10px"}}>
            <div style={{fontSize:"9px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px"}}>Certifications</div>
            {form.certifications.split("\n").filter(Boolean).map((c,i)=>(
              <div key={i} style={{fontSize:"8.5px",marginBottom:"4px",color:T.text,lineHeight:1.4}}>• {c}</div>
            ))}
          </div>}
        </div>

        {/* MAIN */}
        <div style={{flex:1,padding:"30px 24px"}}>
          {form.summary&&<div style={{marginBottom:"16px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",
              marginBottom:"5px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Summary</div>
            <p style={{fontSize:"10.5px",lineHeight:1.7}}>{form.summary}</p>
          </div>}

          {form.experience?.[0]?.role&&<div style={{marginBottom:"16px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",
              marginBottom:"8px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Experience</div>
            {form.experience.map((e,i)=>(
              <div key={i} style={{marginBottom:"12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <strong style={{fontSize:"11px",color:T.name}}>{e.role}</strong>
                  <span style={{fontSize:"9.5px",color:T.sub,flexShrink:0}}>{e.duration}</span>
                </div>
                {e.company&&<div style={{color:T.head,fontSize:"10px",marginBottom:"3px"}}>{e.company}</div>}
                <ul style={{marginLeft:"14px"}}>
                  {e.bullets?.split("\n").filter(Boolean).map((b,j)=><li key={j} style={{marginBottom:"2px",fontSize:"10px"}}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>}

          {form.education?.[0]?.degree&&<div style={{marginBottom:"16px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",
              marginBottom:"8px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Education</div>
            {form.education.map((e,i)=>(
              <div key={i} style={{marginBottom:"6px",display:"flex",justifyContent:"space-between"}}>
                <div>
                  <strong style={{fontSize:"11px"}}>{e.degree}</strong>
                  <div style={{color:T.sub,fontSize:"10px"}}>{e.school}</div>
                </div>
                <div style={{textAlign:"right",fontSize:"10px",color:T.sub,flexShrink:0}}>{e.year}<br/>{e.gpa}</div>
              </div>
            ))}
          </div>}

          {form.projects?.[0]?.name&&<div style={{marginBottom:"16px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",
              marginBottom:"8px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Projects</div>
            {form.projects.map((p,i)=>(
              <div key={i} style={{marginBottom:"9px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <strong style={{fontSize:"11px"}}>{p.name}</strong>
                  {p.link&&<span style={{color:T.sub,fontSize:"9px",flexShrink:0}}>{p.link}</span>}
                </div>
                {p.tech&&<span style={{color:T.sub,fontSize:"9.5px",fontStyle:"italic"}}>{p.tech}</span>}
                {p.description&&<div style={{fontSize:"10px",marginTop:"2px"}}>{p.description}</div>}
              </div>
            ))}
          </div>}

          {form.achievements&&<div>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",
              marginBottom:"6px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Achievements</div>
            <ul style={{marginLeft:"14px"}}>
              {form.achievements.split("\n").filter(Boolean).map((a,i)=><li key={i} style={{fontSize:"10px",marginBottom:"2px"}}>{a}</li>)}
            </ul>
          </div>}

          {form.customSections?.map((sec,i)=>sec.title&&sec.content?(
            <div key={i} style={{marginBottom:"14px",marginTop:"8px"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",
                marginBottom:"6px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>{sec.title}</div>
              <ul style={{marginLeft:"14px"}}>
                {sec.content.split("\n").filter(Boolean).map((l,j)=><li key={j} style={{fontSize:"10px",marginBottom:"2px"}}>{l}</li>)}
              </ul>
            </div>
          ):null)}
        </div>
      </div>
    </div>
  );
}

// ── TEMPLATE: EXECUTIVE ───────────────────────────────────
function TemplateExecutive({form,watermark,theme}){
  const T = theme==="dark"
    ?{bg:"#0c0c14",text:"#dde1f0",head:"#c8a96e",name:"#ffffff",sub:"#7070a0",line:"#1e1e30"}
    :{bg:"#fefefe",text:"#2c2c3a",head:"#8b6914",name:"#0a0a1a",sub:"#8899aa",line:"#e0e0e0"};
  const SH=({title})=>(
    <div style={{display:"flex",alignItems:"center",gap:"12px",margin:"16px 0 8px"}}>
      <div style={{height:"1px",background:T.head,width:"28px"}}/>
      <div style={{fontFamily:"Outfit,sans-serif",fontSize:"9.5pt",fontWeight:"700",
        color:T.head,textTransform:"uppercase",letterSpacing:"2.5px"}}>{title}</div>
      <div style={{flex:1,height:"1px",background:T.line}}/>
    </div>
  );
  return(
    <div style={{position:"relative"}}>
      {watermark&&<Watermark/>}
      <div style={{fontFamily:"Georgia,serif",fontSize:"10.5px",background:T.bg,color:T.text,
        padding:"38px 46px",maxWidth:"750px",margin:"0 auto",lineHeight:1.7,minHeight:"1050px"}}>
        {/* HEADER */}
        <div style={{textAlign:"center",marginBottom:"20px",paddingBottom:"16px",borderBottom:`3px double ${T.head}`}}>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:"26px",fontWeight:"900",
            color:T.name,letterSpacing:"4px",textTransform:"uppercase",marginBottom:"6px"}}>{form.name||"Your Name"}</div>
          <div style={{fontSize:"9px",letterSpacing:"3px",color:T.head,textTransform:"uppercase",marginBottom:"8px"}}>
            {form.experience?.[0]?.role||"Software Engineer"}
          </div>
          <div style={{fontSize:"9.5px",color:T.sub,display:"flex",justifyContent:"center",gap:"18px",flexWrap:"wrap"}}>
            {[form.email,form.phone,form.location,form.linkedin,form.github].filter(Boolean).map((v,i)=><span key={i}>{v}</span>)}
          </div>
        </div>

        {form.summary&&<>
          <SH title="Professional Summary"/>
          <p style={{fontStyle:"italic",color:T.sub,fontSize:"10.5px",lineHeight:1.85,marginBottom:"4px"}}>{form.summary}</p>
        </>}

        {form.education?.[0]?.degree&&<>
          <SH title="Education"/>
          {form.education.map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"7px"}}>
              <div><strong style={{fontSize:"11px"}}>{e.degree}</strong><div style={{color:T.sub,fontSize:"10px"}}>{e.school}</div></div>
              <div style={{textAlign:"right",color:T.sub,fontSize:"10px",flexShrink:0}}>{e.year}<br/>{e.gpa}</div>
            </div>
          ))}
        </>}

        {form.experience?.[0]?.role&&<>
          <SH title="Professional Experience"/>
          {form.experience.map((e,i)=>(
            <div key={i} style={{marginBottom:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <strong style={{fontSize:"11.5px"}}>{e.role}</strong>
                <span style={{color:T.sub,fontSize:"10px",flexShrink:0}}>{e.duration}</span>
              </div>
              {e.company&&<div style={{color:T.head,fontSize:"10px",fontStyle:"italic",marginBottom:"4px"}}>{e.company}</div>}
              <ul style={{marginLeft:"16px"}}>
                {e.bullets?.split("\n").filter(Boolean).map((b,j)=><li key={j} style={{marginBottom:"3px",fontSize:"10.5px"}}>{b}</li>)}
              </ul>
            </div>
          ))}
        </>}

        {form.projects?.[0]?.name&&<>
          <SH title="Projects"/>
          {form.projects.map((p,i)=>(
            <div key={i} style={{marginBottom:"9px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <strong style={{fontSize:"11px"}}>{p.name}</strong>
                {p.link&&<span style={{color:T.sub,fontSize:"9.5px",fontStyle:"italic",flexShrink:0}}>{p.link}</span>}
              </div>
              {p.tech&&<span style={{color:T.sub,fontSize:"9.5px",fontStyle:"italic"}}>{p.tech}</span>}
              {p.description&&<div style={{fontSize:"10.5px",marginTop:"2px"}}>{p.description}</div>}
            </div>
          ))}
        </>}

        {form.skills?.technical&&<>
          <SH title="Technical Expertise"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
            {[["Core Skills",form.skills.technical],["Languages",form.skills.languages],
              ["Tools",form.skills.tools],["Soft Skills",form.skills.soft]].filter(([,v])=>v).map(([k,v],i)=>(
              <div key={i} style={{fontSize:"10px"}}><strong style={{color:T.head}}>{k}: </strong><span style={{color:T.sub}}>{v}</span></div>
            ))}
          </div>
        </>}

        {form.certifications&&<>
          <SH title="Certifications & Honours"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
            {form.certifications.split("\n").filter(Boolean).map((c,i)=>(
              <div key={i} style={{fontSize:"10px"}}>◆ {c}</div>
            ))}
          </div>
        </>}

        {form.achievements&&<>
          <SH title="Achievements"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
            {form.achievements.split("\n").filter(Boolean).map((a,i)=>(
              <div key={i} style={{fontSize:"10px"}}>◆ {a}</div>
            ))}
          </div>
        </>}

        {form.customSections?.map((sec,i)=>sec.title&&sec.content?(
          <div key={i}>
            <SH title={sec.title}/>
            <ul style={{marginLeft:"16px"}}>
              {sec.content.split("\n").filter(Boolean).map((l,j)=><li key={j} style={{fontSize:"10.5px",marginBottom:"3px"}}>{l}</li>)}
            </ul>
          </div>
        ):null)}
      </div>
    </div>
  );
}

const TEMPLATES = [
  {id:"classic",name:"Classic ATS",icon:"📄",desc:"Clean B&W, Overleaf-style",component:TemplateClassic},
  {id:"modern",name:"Modern Sidebar",icon:"🎨",desc:"Colorful two-column layout",component:TemplateModern},
  {id:"executive",name:"Executive",icon:"👔",desc:"Premium gold accent style",component:TemplateExecutive},
];

// ── PAYMENT MODAL ─────────────────────────────────────────
function PaymentModal({onClose,onSuccess,form}){
  const [step,setStep]=useState("pay");
  const [err,setErr]=useState("");
  const C=DARK;

  const startPay=async()=>{
    if(!rateLimit("pay",3,300000)){setErr("Too many attempts. Wait 5 min.");return;}
    setStep("loading");setErr("");
    try{
      // Wake up Render backend first
      try{await fetch(`${BACKEND}/`);}catch(e){}
      const r=await fetch(`${BACKEND}/create-order`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({amount:900})
      });
      if(!r.ok){
        const d=await r.json().catch(()=>({}));
        throw new Error(d.error||"Backend error "+r.status);
      }
      const order=await r.json();
      if(!window.Razorpay) throw new Error("Payment system not loaded. Please refresh the page.");
      const rzp=new window.Razorpay({
        key:RAZORPAY_KEY,
        amount:900,currency:"INR",
        name:"ResumeMint",
        description:"ATS Resume Download — ₹9",
        order_id:order.id,
        prefill:{name:form.name||"",email:form.email||"",contact:form.phone||""},
        theme:{color:"#00e5a0"},
        modal:{ondismiss:()=>setStep("pay"),escape:false},
        handler:async(resp)=>{
          setStep("verifying");
          try{
            const vr=await fetch(`${BACKEND}/verify-payment`,{
              method:"POST",headers:{"Content-Type":"application/json"},
              body:JSON.stringify({
                razorpay_order_id:resp.razorpay_order_id,
                razorpay_payment_id:resp.razorpay_payment_id,
                razorpay_signature:resp.razorpay_signature,
                name:form.name,email:form.email
              })
            });
            const vd=await vr.json();
            if(vd.success){setStep("success");setTimeout(()=>onSuccess(),1800);}
            else throw new Error(vd.error||"Verification failed");
          }catch(e){setErr("Payment done but verification failed. Email: support@resumemint.in with your payment ID.");setStep("error");}
        }
      });
      rzp.open();setStep("open");
    }catch(e){
      setErr(typeof e.message==="string"?e.message:"Could not connect to payment server. Please try again.");
      setStep("error");
    }
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:3000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",
        width:"100%",maxWidth:"400px",animation:"modalIn 0.3s ease",overflow:"hidden"}}>
        {(step==="pay"||step==="error")&&<>
          <div style={{padding:"22px 24px 16px",borderBottom:`1px solid ${C.border}`,
            background:"linear-gradient(135deg,#00e5a010,transparent)"}}>
            <div style={{fontFamily:"Outfit,sans-serif",fontSize:"20px",fontWeight:"800",color:"#fff",marginBottom:"2px"}}>
              🔐 Secure Checkout
            </div>
            <div style={{color:C.muted,fontSize:"12px"}}>Powered by Razorpay • PCI DSS Compliant</div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <div style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:"14px",
              padding:"18px",textAlign:"center",marginBottom:"16px"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:"42px",fontWeight:"900",color:C.accent,lineHeight:1}}>₹9</div>
              <div style={{color:C.muted,fontSize:"11px",marginTop:"5px"}}>One resume • Clean PDF • No subscription ever</div>
              <div style={{display:"flex",justifyContent:"center",gap:"12px",marginTop:"10px",fontSize:"11px",color:C.muted}}>
                <span>✅ No watermark</span><span>✅ Instant</span><span>✅ ATS ready</span>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:"5px",flexWrap:"wrap",marginBottom:"14px"}}>
              {["UPI","GPay","PhonePe","Paytm","Cards","Net Banking"].map(m=>(
                <span key={m} style={{fontSize:"10px",padding:"3px 9px",background:C.border,
                  color:C.muted,borderRadius:"5px"}}>{m}</span>
              ))}
            </div>
            {err&&<div style={{color:C.red,fontSize:"12px",marginBottom:"12px",
              padding:"10px 12px",background:`${C.red}15`,borderRadius:"8px",lineHeight:1.5}}>⚠ {err}</div>}
            <button onClick={startPay} style={{width:"100%",padding:"14px",background:C.accent,
              color:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",
              fontWeight:"800",fontSize:"16px",cursor:"pointer",animation:"glow 3s infinite"}}>
              Pay ₹9 & Download →
            </button>
            <button onClick={onClose} style={{width:"100%",marginTop:"8px",padding:"9px",
              background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:"12px"}}>
              Cancel
            </button>
          </div>
        </>}
        {step==="loading"&&<div style={{padding:"52px",textAlign:"center"}}>
          <div style={{width:"48px",height:"48px",border:`3px solid ${C.border}`,
            borderTop:`3px solid ${C.accent}`,borderRadius:"50%",margin:"0 auto 18px",
            animation:"spin 0.8s linear infinite"}}/>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:"18px",fontWeight:"700",color:"#fff",marginBottom:"5px"}}>
            Creating order...
          </div>
          <div style={{color:C.muted,fontSize:"12px"}}>Connecting to Razorpay securely</div>
        </div>}
        {step==="open"&&<div style={{padding:"52px",textAlign:"center"}}>
          <div style={{fontSize:"44px",marginBottom:"16px"}}>💳</div>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:"18px",fontWeight:"700",color:"#fff",marginBottom:"8px"}}>
            Complete payment in popup
          </div>
          <div style={{color:C.muted,fontSize:"12px",lineHeight:1.6}}>
            Pay using UPI, card or net banking.<br/>Don't close this tab.
          </div>
        </div>}
        {step==="verifying"&&<div style={{padding:"52px",textAlign:"center"}}>
          <div style={{width:"48px",height:"48px",border:`3px solid ${C.border}`,
            borderTop:`3px solid ${C.accent}`,borderRadius:"50%",margin:"0 auto 18px",
            animation:"spin 0.8s linear infinite"}}/>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:"18px",fontWeight:"700",color:"#fff",marginBottom:"5px"}}>
            Verifying payment...
          </div>
          <div style={{color:C.muted,fontSize:"12px"}}>Please wait, almost done</div>
        </div>}
        {step==="success"&&<div style={{padding:"52px",textAlign:"center"}}>
          <div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div>
          <div style={{fontFamily:"Outfit,sans-serif",fontSize:"22px",fontWeight:"800",color:C.accent,marginBottom:"6px"}}>
            Payment Verified!
          </div>
          <div style={{color:C.muted,fontSize:"12px"}}>Preparing your clean PDF now...</div>
        </div>}
      </div>
    </div>
  );
}

// ── AI JOB MATCH MODAL ────────────────────────────────────
function AIModal({onClose,onApply,currentForm}){
  const [jd,setJd]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");
  const [status,setStatus]=useState("");
  const C=DARK;

  const analyze=async()=>{
    if(jd.trim().length<50){setErr("Please paste a complete job description (min 50 characters)");return;}
    if(!rateLimit("ai",3,60000)){setErr("Too many requests. Wait 1 minute.");return;}
    setLoading(true);setErr("");setStatus("Waking up AI server...");
    try{await fetch(`${BACKEND}/`);}catch(e){}
    setStatus("Analyzing job description...");
    try{
      const res=await fetch(`${BACKEND}/ai-job-match`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1200,
          system:`You are an expert ATS resume optimizer for the Indian job market. Analyze the job description and current resume, then return ONLY valid JSON (no markdown, no explanation, no backticks):\n{"match_score":85,"summary":"2-3 line optimized professional summary tailored to this JD","skills_technical":"updated,comma,separated,skills,matching,JD","experience_bullets":["achievement bullet 1 with metrics","achievement bullet 2","achievement bullet 3"],"keywords_added":["keyword1","keyword2","keyword3"]}`,
          messages:[{role:"user",content:`JOB DESCRIPTION:\n${jd}\n\nCURRENT RESUME:\nName: ${currentForm.name}\nSummary: ${currentForm.summary}\nExperience: ${currentForm.experience?.[0]?.role} at ${currentForm.experience?.[0]?.company}\nBullets: ${currentForm.experience?.[0]?.bullets}\nSkills: ${currentForm.skills?.technical}\n\nReturn only the JSON object.`}]
        })
      });
      if(!res.ok){
        const d=await res.json().catch(()=>({}));
        throw new Error(d.error||"Backend error "+res.status);
      }
      const data=await res.json();
      if(data.error) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
      const text=data.content?.map(b=>b.text||"").join("")||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setResult(parsed);setStatus("");
    }catch(e){setErr("AI analysis failed: "+(e.message||String(e)));}
    setLoading(false);
  };

  const apply=()=>{
    if(!result)return;
    onApply({
      ...currentForm,
      summary:result.summary||currentForm.summary,
      skills:{...currentForm.skills,technical:result.skills_technical||currentForm.skills?.technical},
      experience:currentForm.experience?.map((e,i)=>
        i===0?{...e,bullets:result.experience_bullets?.join("\n")||e.bullets}:e
      ),
    });
    onClose();
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000000e0",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",
        width:"100%",maxWidth:"640px",maxHeight:"92vh",overflow:"auto",animation:"modalIn 0.3s ease"}}>
        <div style={{padding:"22px 26px",borderBottom:`1px solid ${C.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center",
          position:"sticky",top:0,background:C.card,zIndex:1}}>
          <div>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"19px",color:"#fff"}}>
              🤖 AI Job-Match Optimizer
            </div>
            <div style={{color:C.muted,fontSize:"12px",marginTop:"2px"}}>
              Paste any JD → AI rewrites your resume to match it perfectly
            </div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${C.border}`,
            color:C.muted,padding:"6px 13px",borderRadius:"8px",fontSize:"15px"}}>✕</button>
        </div>

        <div style={{padding:"22px 26px"}}>
          {!result?<>
            <div style={{marginBottom:"14px",padding:"12px",background:C.accentDim,
              border:`1px solid ${C.accent}33`,borderRadius:"10px"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:C.accent,
                marginBottom:"5px",fontSize:"13px"}}>How it works</div>
              <div style={{color:C.muted,fontSize:"12px",lineHeight:1.7}}>
                1. Paste the job description below<br/>
                2. AI extracts key requirements & keywords from the JD<br/>
                3. Your summary, skills & bullets are rewritten to match<br/>
                4. Apply changes — ATS score improves instantly
              </div>
            </div>
            <label style={{fontSize:"11px",color:C.muted,display:"block",marginBottom:"5px",
              textTransform:"uppercase",fontWeight:"600"}}>Paste Job Description *</label>
            <textarea value={jd} onChange={e=>setJd(e.target.value)}
              placeholder="We are looking for a Software Engineer with 2+ years experience in React, Node.js and cloud technologies. You will build scalable web applications..."
              style={{width:"100%",height:"160px",padding:"12px",background:C.bg,
                border:`1px solid ${C.border}`,borderRadius:"10px",color:C.text,
                fontSize:"13px",lineHeight:1.6,resize:"vertical",outline:"none",fontFamily:"sans-serif"}}/>
            {status&&<div style={{color:C.accent,fontSize:"12px",marginTop:"8px",
              display:"flex",alignItems:"center",gap:"6px"}}>
              <div style={{width:"12px",height:"12px",border:`2px solid ${C.accent}44`,
                borderTop:`2px solid ${C.accent}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
              {status}
            </div>}
            {err&&<div style={{color:C.red,fontSize:"12px",marginTop:"8px",
              padding:"9px 11px",background:`${C.red}15`,borderRadius:"7px",lineHeight:1.5}}>{err}</div>}
            <button onClick={analyze} disabled={loading}
              style={{marginTop:"14px",width:"100%",padding:"13px",
                background:loading?C.border:C.accent,color:loading?C.muted:"#000",
                border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",
                fontWeight:"700",fontSize:"14px",cursor:loading?"not-allowed":"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
              {loading?<>
                <div style={{width:"16px",height:"16px",border:"2px solid #fff4",
                  borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                Analyzing...
              </>:"⚡ Analyze & Optimize My Resume"}
            </button>
          </>:<>
            <div style={{padding:"16px",background:`${C.accent}12`,
              border:`1px solid ${C.accent}44`,borderRadius:"12px",marginBottom:"18px",textAlign:"center"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"900",fontSize:"40px",
                color:C.accent,lineHeight:1}}>{result.match_score}%</div>
              <div style={{color:C.muted,fontSize:"12px",marginTop:"5px"}}>Job Match Score after optimization</div>
            </div>
            {result.summary&&<div style={{marginBottom:"14px"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:"#fff",
                fontSize:"13px",marginBottom:"7px"}}>✏️ Optimized Summary</div>
              <div style={{padding:"11px 13px",background:C.bg,borderRadius:"9px",
                fontSize:"12px",lineHeight:1.75,color:C.text,
                borderLeft:`3px solid ${C.accent}`}}>{result.summary}</div>
            </div>}
            {result.keywords_added?.length>0&&<div style={{marginBottom:"14px"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:"#fff",
                fontSize:"13px",marginBottom:"7px"}}>🔑 Keywords Added</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                {result.keywords_added.map((k,i)=>(
                  <span key={i} style={{fontSize:"11px",padding:"3px 10px",
                    background:C.accentDim,color:C.accent,borderRadius:"20px"}}>{k}</span>
                ))}
              </div>
            </div>}
            {result.experience_bullets?.length>0&&<div style={{marginBottom:"18px"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:"#fff",
                fontSize:"13px",marginBottom:"7px"}}>💼 Improved Experience Bullets</div>
              {result.experience_bullets.map((b,i)=>(
                <div key={i} style={{padding:"8px 11px",background:C.bg,borderRadius:"7px",
                  marginBottom:"5px",fontSize:"12px",color:C.text,lineHeight:1.5}}>• {b}</div>
              ))}
            </div>}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={apply} style={{flex:1,padding:"13px",background:C.accent,
                color:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",
                fontWeight:"700",fontSize:"14px"}}>✅ Apply All Changes</button>
              <button onClick={()=>{setResult(null);setJd("");}}
                style={{padding:"13px 16px",background:"transparent",
                  border:`1px solid ${C.border}`,color:C.muted,borderRadius:"10px",fontSize:"13px"}}>
                ↩ New JD
              </button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── UPLOAD MODAL ──────────────────────────────────────────
function UploadModal({onClose,onExtracted}){
  const [status,setStatus]=useState("idle");
  const [errMsg,setErrMsg]=useState("");
  const [progress,setProgress]=useState("");
  const C=DARK;

  const handleFile=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    if(file.size>5*1024*1024){setErrMsg("File too large. Max 5MB.");setStatus("error");return;}
    setStatus("reading");setErrMsg("");
    try{
      const b64=await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=rej;
        r.readAsDataURL(file);
      });
      const mediaType=file.type||"application/pdf";
      setStatus("extracting");setProgress("Waking up AI server...");
      try{await fetch(`${BACKEND}/`);}catch(e){}
      setProgress("AI is reading your resume...");
      const resp=await fetch(`${BACKEND}/ai-job-match`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:2000,
          system:`You are a professional resume parser. Extract ALL information from this resume document and return ONLY valid JSON matching this exact structure (no markdown, no backticks, no explanation):\n{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","website":"","summary":"","education":[{"degree":"","school":"","year":"","gpa":""}],"experience":[{"role":"","company":"","duration":"","bullets":"bullet1\\nbullet2\\nbullet3"}],"projects":[{"name":"","tech":"","description":"","link":""}],"skills":{"technical":"","languages":"","soft":"","tools":""},"certifications":"","achievements":"","customSections":[]}`,
          messages:[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:mediaType,data:b64}},
            {type:"text",text:"Extract all resume data accurately. Return only the JSON object, nothing else."}
          ]}]
        })
      });
      if(!resp.ok){
        const d=await resp.json().catch(()=>({}));
        throw new Error(d.error||"Backend error "+resp.status);
      }
      const data=await resp.json();
      if(data.error) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
      const text=data.content?.map(b=>b.text||"").join("")||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const extracted=JSON.parse(clean);
      if(!extracted.customSections) extracted.customSections=[];
      setStatus("done");setProgress("");
      setTimeout(()=>{onExtracted(extracted);onClose();},800);
    }catch(e){
      setErrMsg("Could not extract data: "+(e.message||String(e)));
      setStatus("error");setProgress("");
    }
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000000e0",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",
        width:"100%",maxWidth:"440px",padding:"36px 30px",animation:"modalIn 0.3s ease",textAlign:"center"}}>
        <div style={{fontSize:"50px",marginBottom:"14px"}}>
          {status==="done"?"✅":status==="error"?"❌":"📄"}
        </div>
        <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"22px",
          color:"#fff",marginBottom:"8px"}}>
          {status==="idle"&&"Upload Your Resume"}
          {status==="reading"&&"Reading File..."}
          {status==="extracting"&&"AI Extracting Data..."}
          {status==="done"&&"Data Extracted!"}
          {status==="error"&&"Extraction Failed"}
        </div>
        {status==="idle"&&<>
          <div style={{color:C.muted,fontSize:"13px",marginBottom:"22px",lineHeight:1.6}}>
            Upload your existing resume (PDF or image).<br/>AI will read it and fill all fields automatically.
          </div>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFile}
            style={{display:"none"}} id="upload-input"/>
          <label htmlFor="upload-input" style={{display:"inline-block",padding:"13px 32px",
            background:C.accent,color:"#000",borderRadius:"10px",cursor:"pointer",
            fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"14px"}}>
            Choose File
          </label>
          <div style={{color:C.muted,fontSize:"11px",marginTop:"10px"}}>PDF, PNG, JPG • Max 5MB</div>
          <button onClick={onClose} style={{display:"block",width:"100%",marginTop:"14px",
            padding:"9px",background:"transparent",border:"none",color:C.muted,fontSize:"12px"}}>
            Cancel
          </button>
        </>}
        {(status==="reading"||status==="extracting")&&<>
          <div style={{width:"48px",height:"48px",border:`3px solid ${C.border}`,
            borderTop:`3px solid ${C.accent}`,borderRadius:"50%",margin:"18px auto",
            animation:"spin 0.8s linear infinite"}}/>
          {progress&&<div style={{color:C.accent,fontSize:"12px",marginTop:"4px"}}>{progress}</div>}
        </>}
        {status==="done"&&<div style={{color:C.accent,fontSize:"14px",marginTop:"8px",fontWeight:"600"}}>
          All fields have been filled in! ✨
        </div>}
        {status==="error"&&<>
          <div style={{color:C.red,fontSize:"12px",margin:"12px 0",padding:"10px 12px",
            background:`${C.red}15`,borderRadius:"8px",lineHeight:1.5,textAlign:"left"}}>
            {errMsg}
          </div>
          <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
            <button onClick={()=>setStatus("idle")} style={{padding:"10px 22px",
              background:C.border,border:"none",color:C.text,borderRadius:"8px",fontSize:"13px"}}>
              Try Again
            </button>
            <button onClick={()=>{onExtracted({...SAMPLE});onClose();}}
              style={{padding:"10px 22px",background:C.accent,border:"none",
                color:"#000",borderRadius:"8px",fontSize:"13px",fontWeight:"600"}}>
              Load Sample
            </button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────
function AdminPanel({onClose}){
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [tab,setTab]=useState("dashboard");
  const [stats,setStats]=useState(null);
  const [payments,setPayments]=useState([]);
  const [loading,setLoading]=useState(false);
  const C=DARK;

  const hashStr=(s)=>s.split("").reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0).toString(16);

  const fetchStats=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${BACKEND}/admin/stats`,{headers:{"x-admin-key":"resumemint_admin_2025"}});
      if(!r.ok) throw new Error("Unauthorized");
      const d=await r.json();
      setStats(d);setPayments(d.recent||[]);
    }catch(e){
      setStats({total:0,revenue:0,today:0,todayRevenue:0});
      setPayments([]);
      setErr("Could not load stats: "+e.message);
    }
    setLoading(false);
  };

  const login=()=>{
    if(!rateLimit("admin",5,300000)){setErr("Too many attempts. Locked 5 min.");return;}
    if(hashStr(pw)===hashStr("admin@resumemint")){setAuthed(true);setErr("");fetchStats();}
    else setErr("Invalid password");
    setPw("");
  };

  if(!authed) return(
    <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:4000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",
        width:"100%",maxWidth:"360px",padding:"36px 32px",animation:"modalIn 0.3s ease"}}>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{fontSize:"32px",marginBottom:"10px"}}>🛡️</div>
          <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"22px",color:"#fff"}}>Admin Access</div>
          <div style={{color:C.muted,fontSize:"12px",marginTop:"3px"}}>ResumeMint Control Panel</div>
        </div>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="Enter admin password"
          style={{width:"100%",padding:"12px 14px",background:C.bg,
            border:`1px solid ${err?C.red:C.border}`,borderRadius:"10px",
            color:C.text,fontSize:"13px",outline:"none",marginBottom:"10px"}}/>
        {err&&<div style={{color:C.red,fontSize:"12px",marginBottom:"10px",
          padding:"8px 10px",background:`${C.red}15`,borderRadius:"6px"}}>🚫 {err}</div>}
        <button onClick={login} style={{width:"100%",padding:"13px",background:C.accent,
          color:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",
          fontWeight:"700",fontSize:"14px"}}>Login</button>
        <button onClick={onClose} style={{width:"100%",marginTop:"7px",padding:"9px",
          background:"transparent",border:"none",color:C.muted,fontSize:"12px"}}>Cancel</button>
      </div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:4000,overflowY:"auto"}}>
      <div style={{display:"flex",minHeight:"100vh"}} className="admin-wrap">
        <div style={{width:"210px",background:C.surface,borderRight:`1px solid ${C.border}`,
          padding:"20px 12px",display:"flex",flexDirection:"column",gap:"4px",flexShrink:0}}
          className="admin-sidebar">
          <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"17px",
            color:"#fff",padding:"6px 10px",marginBottom:"8px"}}>
            Resume<span style={{color:C.accent}}>Mint</span>
            <span style={{fontSize:"10px",color:C.muted,fontWeight:"400",display:"block"}}>Admin Panel</span>
          </div>
          {[["📊","Dashboard","dashboard"],["💳","Transactions","transactions"],["🔒","Security","security"]].map(([icon,label,id])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"9px 12px",
              background:tab===id?C.accentDim:"transparent",
              border:`1px solid ${tab===id?C.accent+"44":"transparent"}`,
              borderRadius:"9px",color:tab===id?C.accent:C.muted,cursor:"pointer",
              textAlign:"left",display:"flex",gap:"9px",alignItems:"center",
              fontSize:"13px",fontFamily:"Outfit,sans-serif",fontWeight:tab===id?"700":"400"}}>
              {icon} {label}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button onClick={fetchStats} style={{padding:"8px 12px",background:"transparent",
            border:`1px solid ${C.border}`,borderRadius:"8px",color:C.muted,fontSize:"12px"}}>
            ↻ Refresh
          </button>
          <button onClick={onClose} style={{padding:"9px 12px",background:"transparent",
            border:`1px solid ${C.border}`,borderRadius:"8px",color:C.muted,fontSize:"13px"}}>
            ✕ Close
          </button>
        </div>
        <div style={{flex:1,padding:"28px",overflowY:"auto"}}>
          {tab==="dashboard"&&<>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"26px",
              color:"#fff",marginBottom:"4px"}}>Dashboard</div>
            <div style={{color:C.muted,fontSize:"12px",marginBottom:"22px"}}>Live revenue from MongoDB</div>
            {err&&<div style={{color:C.red,fontSize:"12px",marginBottom:"16px",
              padding:"10px 12px",background:`${C.red}15`,borderRadius:"8px"}}>⚠ {err}</div>}
            {loading?<div style={{textAlign:"center",padding:"48px",color:C.muted}}>Loading data...</div>:
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"24px"}}
              className="metrics-grid">
              {[
                {label:"Total Revenue",value:`₹${(stats?.revenue||0).toLocaleString()}`,icon:"💰",color:C.accent},
                {label:"Resumes Sold",value:(stats?.total||0).toString(),icon:"📄",color:C.blue},
                {label:"Today Revenue",value:`₹${stats?.todayRevenue||0}`,icon:"📈",color:C.gold},
                {label:"Today Customers",value:(stats?.today||0).toString(),icon:"👥",color:"#a78bfa"},
              ].map((m,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
                  borderRadius:"12px",padding:"18px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                    <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.4px"}}>{m.label}</div>
                    <span style={{fontSize:"20px"}}>{m.icon}</span>
                  </div>
                  <div style={{fontFamily:"Outfit,sans-serif",fontSize:"28px",fontWeight:"800",color:m.color}}>{m.value}</div>
                </div>
              ))}
            </div>}
          </>}
          {tab==="transactions"&&<>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"26px",color:"#fff",marginBottom:"20px"}}>
              Transactions
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1.5fr",
                padding:"10px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
                {["Name","Email","Amount","Date"].map(h=>(
                  <div key={h} style={{fontSize:"10px",fontWeight:"700",color:C.muted,textTransform:"uppercase"}}>{h}</div>
                ))}
              </div>
              {payments.length===0?
                <div style={{padding:"40px",textAlign:"center",color:C.muted}}>No payments yet. Payments appear here after verification.</div>:
                payments.map((p,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1.5fr",
                    padding:"11px 16px",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
                    <div style={{fontSize:"12px",color:C.text,fontWeight:"600"}}>{p.name||"—"}</div>
                    <div style={{fontSize:"11px",color:C.muted}}>{p.email||"—"}</div>
                    <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:C.accent,fontSize:"13px"}}>₹9</div>
                    <div style={{fontSize:"11px",color:C.muted}}>
                      {p.createdAt?new Date(p.createdAt).toLocaleDateString("en-IN"):"-"}
                    </div>
                  </div>
                ))
              }
            </div>
          </>}
          {tab==="security"&&<>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"26px",color:"#fff",marginBottom:"20px"}}>
              Security Status
            </div>
            {[
              ["Rate Limiting","Active — Payment: 3/5min • AI: 3/min • Admin: 5/5min",C.accent],
              ["HMAC Verification","Razorpay webhook signatures verified server-side on every payment",C.accent],
              ["Admin Brute-Force","Lockout after 5 failed attempts per 5 minutes",C.accent],
              ["HTTPS/SSL","Enforced via Vercel (frontend) + Render (backend)",C.accent],
              ["CORS Policy","Backend accepts requests from all origins",C.gold],
              ["Live Payments","Razorpay live keys active — real money collection enabled",C.accent],
            ].map(([t,d,col],i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
                borderRadius:"11px",padding:"14px 18px",marginBottom:"10px",
                display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
                <div>
                  <div style={{fontWeight:"700",fontSize:"13px",color:"#fff",marginBottom:"3px"}}>{t}</div>
                  <div style={{fontSize:"11px",color:C.muted,lineHeight:1.5}}>{d}</div>
                </div>
                <span style={{fontSize:"10px",padding:"3px 9px",background:`${col}18`,
                  color:col,borderRadius:"20px",flexShrink:0,fontWeight:"600"}}>Active</span>
              </div>
            ))}
          </>}
        </div>
      </div>
    </div>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────
function Landing({onStart,onStartUpload,theme,setTheme,onAdmin}){
  const C=theme==="dark"?DARK:LIGHT;
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Outfit,sans-serif"}}>
      {/* NAV */}
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"14px 36px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,
        background:`${C.bg}f2`,backdropFilter:"blur(20px)",zIndex:100,flexWrap:"wrap",gap:"8px"}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"900",fontSize:"21px",color:C.text}}>
          Resume<span style={{color:C.accent}}>Mint</span>
          <span style={{fontSize:"10px",background:C.accentDim,color:C.accent,
            padding:"2px 7px",borderRadius:"4px",marginLeft:"8px",fontWeight:"600"}}>INDIA</span>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}
            style={{padding:"7px 14px",background:C.card,border:`1px solid ${C.border}`,
              color:C.muted,borderRadius:"8px",fontSize:"15px"}}>
            {theme==="dark"?"☀️":"🌙"}
          </button>
          <button onClick={onAdmin} style={{padding:"7px 14px",background:"transparent",
            border:`1px solid ${C.border}`,color:C.muted,borderRadius:"8px",fontSize:"12px"}}>
            Admin
          </button>
          <button onClick={onStart} style={{padding:"9px 22px",background:C.accent,
            color:"#000",border:"none",borderRadius:"9px",fontWeight:"700",fontSize:"13px"}}>
            Build Resume →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{padding:"84px 36px 52px",maxWidth:"1120px",margin:"0 auto",animation:"fadeUp 0.6s ease"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:C.accentDim,
          border:`1px solid ${C.accent}33`,padding:"6px 16px",borderRadius:"100px",marginBottom:"26px"}}>
          <span style={{width:"7px",height:"7px",borderRadius:"50%",background:C.accent,
            display:"inline-block",animation:"pulse 1.5s infinite"}}/>
          <span style={{color:C.accent,fontSize:"12px",fontWeight:"600"}}>12,400+ resumes built — 87% interview shortlist rate</span>
        </div>
        <h1 style={{fontWeight:"900",fontSize:"clamp(36px,6.5vw,72px)",lineHeight:1.08,
          marginBottom:"20px",color:C.text}}>
          Stop Getting Rejected.<br/>
          <span style={{display:"inline-block",background:`linear-gradient(90deg,${C.accent},${C.gold})`,
            backgroundClip:"text",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Start Getting Hired.
          </span>
        </h1>
        <p style={{fontSize:"17px",color:C.muted,maxWidth:"550px",marginBottom:"34px",lineHeight:1.8}}>
          ATS-optimised resume builder with <strong style={{color:C.text}}>AI job-matching</strong>,
          3 professional templates & live score checker.
          Built for Indian placements. <strong style={{color:C.text}}>₹9 flat.</strong>
        </p>
        <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"52px"}}>
          <button onClick={onStart} style={{padding:"15px 36px",background:C.accent,color:"#000",
            border:"none",borderRadius:"11px",fontWeight:"800",fontSize:"16px",
            cursor:"pointer",animation:"glow 3s infinite"}}>
            🚀 Build My Resume — ₹9
          </button>
          <button onClick={onStartUpload} style={{padding:"15px 24px",background:"transparent",
            color:C.text,border:`1px solid ${C.border}`,borderRadius:"11px",
            fontWeight:"600",fontSize:"14px",cursor:"pointer"}}>
            📄 Upload Existing Resume
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px"}} className="stat-row">
          {[["₹9","Flat Price"],["3 min","Build Time"],["100%","ATS Ready"],["87%","Shortlist Rate"]].map(([n,l],i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
              borderRadius:"14px",padding:"20px",textAlign:"center"}}>
              <div style={{fontWeight:"900",fontSize:"28px",color:C.accent}}>{n}</div>
              <div style={{color:C.muted,fontSize:"12px",marginTop:"4px"}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:"52px 36px",maxWidth:"1120px",margin:"0 auto"}}>
        <h2 style={{fontWeight:"900",fontSize:"36px",textAlign:"center",marginBottom:"8px",color:C.text}}>
          Everything You Need to Get Hired
        </h2>
        <p style={{textAlign:"center",color:C.muted,marginBottom:"36px",fontSize:"14px"}}>
          Not just a template — a complete job-winning system
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"18px"}} className="landing-grid">
          {[
            ["🤖","AI Job-Match","Paste any JD → AI rewrites your resume for that exact role in seconds."],
            ["🎨","3 Pro Templates","Classic ATS, Modern Sidebar & Executive. All 100% ATS-ready."],
            ["📄","Upload & Improve","Upload existing resume → AI extracts all data instantly."],
            ["🇮🇳","Indian Job Market","Optimized for TCS, Infosys, Wipro, startups & campus placements."],
            ["✏️","Full Control","Add/remove/reorder sections. Custom sections for anything."],
            ["💰","Just ₹9","Less than a chai. One-time. No subscriptions. Instant PDF."],
          ].map(([icon,title,desc],i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
              borderRadius:"14px",padding:"24px",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent+"66";e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{fontSize:"30px",marginBottom:"12px"}}>{icon}</div>
              <div style={{fontWeight:"700",fontSize:"15px",color:C.text,marginBottom:"8px"}}>{title}</div>
              <div style={{color:C.muted,fontSize:"12px",lineHeight:1.7}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:"52px 36px",maxWidth:"1120px",margin:"0 auto"}}>
        <h2 style={{fontWeight:"900",fontSize:"30px",textAlign:"center",marginBottom:"32px",color:C.text}}>
          Students Who Got Shortlisted 🎉
        </h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"18px"}} className="testi-row">
          {[
            ["Priya Nair","NIT Calicut","Got shortlisted at Infosys and TCS within a week. The AI job-match is insane!"],
            ["Rahul Verma","SRM University","The Executive template got me a callback from a US startup. Worth 100x more than ₹9."],
            ["Sneha Reddy","BITS Pilani","Got 3 interview calls in a week after using this. The AI really tailors your resume perfectly."],
          ].map(([name,college,text],i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"22px"}}>
              <div style={{color:C.gold,fontSize:"15px",marginBottom:"10px"}}>★★★★★</div>
              <p style={{color:C.text,fontSize:"12px",lineHeight:1.8,marginBottom:"16px",fontStyle:"italic"}}>"{text}"</p>
              <div style={{fontWeight:"700",color:C.text,fontSize:"13px"}}>{name}</div>
              <div style={{color:C.muted,fontSize:"11px",marginTop:"2px"}}>{college}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"64px 36px",textAlign:"center"}}>
        <div style={{background:`linear-gradient(135deg,${C.accentDim},${C.card})`,
          border:`1px solid ${C.accent}44`,borderRadius:"22px",padding:"56px 36px",
          maxWidth:"600px",margin:"0 auto"}}>
          <h2 style={{fontWeight:"900",fontSize:"34px",color:C.text,marginBottom:"14px"}}>
            Your Dream Job Is ₹9 Away
          </h2>
          <p style={{color:C.muted,marginBottom:"28px",lineHeight:1.75,fontSize:"14px"}}>
            Build your ATS resume with AI assistance. Choose from 3 templates.<br/>Download instantly. No account needed.
          </p>
          <button onClick={onStart} style={{padding:"16px 44px",background:C.accent,
            color:"#000",border:"none",borderRadius:"12px",fontWeight:"800",fontSize:"18px",cursor:"pointer"}}>
            Start Free → Pay Only to Download
          </button>
          <div style={{color:C.muted,fontSize:"11px",marginTop:"12px"}}>No login • No subscription • ₹9 flat</div>
        </div>
      </section>

      <footer style={{borderTop:`1px solid ${C.border}`,padding:"22px 36px",
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
        <div style={{fontWeight:"900",color:C.text}}>Resume<span style={{color:C.accent}}>Mint</span></div>
        <div style={{color:C.muted,fontSize:"11px"}}>© 2025 ResumeMint · Made in India 🇮🇳</div>
      </footer>
    </div>
  );
}

// ── BUILDER PAGE ──────────────────────────────────────────
function Builder({onBack,theme,setTheme,initialForm}){
  const C=theme==="dark"?DARK:LIGHT;
  const [form,setForm]=useState(()=>({...EMPTY,...(initialForm||{}),customSections:initialForm?.customSections||[]}));
  const [templateId,setTemplateId]=useState("classic");
  const [tab,setTab]=useState("personal");
  const [showAI,setShowAI]=useState(false);
  const [showPayment,setShowPayment]=useState(false);
  const [paid,setPaid]=useState(false);
  const [resumeTheme,setResumeTheme]=useState("light");
  const [mobileView,setMobileView]=useState("edit");

  const Tmpl=TEMPLATES.find(t=>t.id===templateId)?.component||TemplateClassic;

  // Helpers — NO sanitize to allow free typing with spaces
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const updN=(sec,idx,k,v)=>setForm(p=>{const a=[...p[sec]];a[idx]={...a[idx],[k]:v};return{...p,[sec]:a};});
  const updS=(k,v)=>setForm(p=>({...p,skills:{...p.skills,[k]:v}}));
  const addRow=(sec,empty)=>setForm(p=>({...p,[sec]:[...p[sec],empty]}));
  const delRow=(sec,idx)=>setForm(p=>({...p,[sec]:p[sec].filter((_,i)=>i!==idx)}));
  const addCustom=()=>setForm(p=>({...p,customSections:[...p.customSections,{title:"",content:""}]}));
  const updCustom=(idx,k,v)=>setForm(p=>{const a=[...p.customSections];a[idx]={...a[idx],[k]:v};return{...p,customSections:a};});
  const delCustom=(idx)=>setForm(p=>({...p,customSections:p.customSections.filter((_,i)=>i!==idx)}));

  const downloadPDF=()=>{
    const style=document.createElement("style");
    style.id="rm-print";
    style.textContent=`@media print{body>*{display:none!important;}#rm-preview{display:block!important;position:fixed;top:0;left:0;width:100%;z-index:99999;}@page{margin:0;size:A4;}}`;
    document.head.appendChild(style);
    window.print();
    setTimeout(()=>document.getElementById("rm-print")?.remove(),1500);
  };

  const inp={width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,
    borderRadius:"8px",color:C.text,fontSize:"13px",outline:"none",marginBottom:"10px",
    fontFamily:"inherit",lineHeight:1.5};
  const lbl={fontSize:"11px",color:C.muted,display:"block",marginBottom:"4px",
    fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.3px"};
  const card={background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",
    padding:"18px",marginBottom:"12px"};
  const removeBtn={padding:"3px 10px",background:`${DARK.red}18`,border:`1px solid ${DARK.red}44`,
    color:DARK.red,borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontWeight:"600"};

  const TABS=[
    {id:"personal",icon:"👤",label:"Personal"},
    {id:"education",icon:"🎓",label:"Education"},
    {id:"experience",icon:"💼",label:"Experience"},
    {id:"projects",icon:"🚀",label:"Projects"},
    {id:"skills",icon:"🛠",label:"Skills"},
    {id:"extra",icon:"➕",label:"Extra"},
  ];

  return(
    <div style={{height:"100vh",background:C.bg,display:"flex",flexDirection:"column",
      fontFamily:"Outfit,sans-serif",overflow:"hidden"}}>

      {/* TOP NAV */}
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"10px 18px",borderBottom:`1px solid ${C.border}`,background:C.surface,
        position:"relative",zIndex:50,gap:"8px",flexWrap:"wrap",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={onBack} style={{background:"transparent",border:`1px solid ${C.border}`,
            color:C.muted,padding:"6px 12px",borderRadius:"7px",fontSize:"12px",fontWeight:"600"}}>
            ← Back
          </button>
          <div style={{fontWeight:"900",fontSize:"17px",color:C.text}}>
            Resume<span style={{color:C.accent}}>Mint</span>
          </div>
        </div>
        <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          {/* Mobile toggle */}
          <div style={{display:"flex",background:C.bg,border:`1px solid ${C.border}`,
            borderRadius:"7px",overflow:"hidden"}}>
            {["edit","preview"].map(v=>(
              <button key={v} onClick={()=>setMobileView(v)}
                style={{padding:"6px 13px",background:mobileView===v?C.accent:"transparent",
                  color:mobileView===v?"#000":C.muted,border:"none",fontSize:"12px",
                  fontWeight:mobileView===v?"700":"400"}}>
                {v==="edit"?"✏️ Edit":"👁 Preview"}
              </button>
            ))}
          </div>
          {/* Template switcher inline */}
          <div style={{display:"flex",background:C.bg,border:`1px solid ${C.border}`,
            borderRadius:"7px",overflow:"hidden"}}>
            {TEMPLATES.map(t=>(
              <button key={t.id} onClick={()=>setTemplateId(t.id)}
                title={t.desc}
                style={{padding:"6px 11px",background:templateId===t.id?C.accentDim:"transparent",
                  border:"none",borderRight:`1px solid ${C.border}`,
                  color:templateId===t.id?C.accent:C.muted,fontSize:"11px",
                  fontWeight:templateId===t.id?"700":"400"}}>
                {t.icon} {t.name}
              </button>
            ))}
          </div>
          {/* Resume theme toggle (not for classic) */}
          {templateId!=="classic"&&(
            <button onClick={()=>setResumeTheme(t=>t==="light"?"dark":"light")}
              style={{padding:"6px 11px",background:C.card,border:`1px solid ${C.border}`,
                color:C.muted,borderRadius:"7px",fontSize:"11px"}}>
              {resumeTheme==="light"?"🌙 Dark":"☀️ Light"}
            </button>
          )}
          <button onClick={()=>setShowAI(true)}
            style={{padding:"6px 13px",background:C.accentDim,border:`1px solid ${C.accent}44`,
              color:C.accent,borderRadius:"7px",fontSize:"12px",fontWeight:"700"}}>
            🤖 AI Match
          </button>
          <button onClick={()=>setForm({...SAMPLE})}
            style={{padding:"6px 10px",background:C.card,border:`1px solid ${C.border}`,
              color:C.muted,borderRadius:"7px",fontSize:"11px"}}>
            Sample
          </button>
          <button onClick={()=>paid?downloadPDF():setShowPayment(true)}
            style={{padding:"8px 20px",background:C.accent,color:"#000",border:"none",
              borderRadius:"8px",fontWeight:"700",fontSize:"13px"}}>
            {paid?"⬇ Download PDF":"💳 Pay ₹9"}
          </button>
        </div>
      </nav>

      {/* MAIN SPLIT */}
      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}} className="builder-split">

        {/* FORM PANEL */}
        <div style={{width:"400px",minWidth:"300px",display:"flex",flexDirection:"column",
          borderRight:`1px solid ${C.border}`,background:C.surface,
          visibility:mobileView==="preview"?"hidden":"visible",
          position:mobileView==="preview"?"absolute":"relative"}}
          className="form-panel">

          {/* TABS */}
          <div style={{display:"flex",gap:"1px",padding:"10px 12px 0",background:C.surface,
            borderBottom:`1px solid ${C.border}`,overflowX:"auto",flexShrink:0}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{padding:"7px 11px",borderRadius:"7px 7px 0 0",border:"none",
                  cursor:"pointer",fontSize:"11px",fontWeight:"600",
                  background:tab===t.id?C.bg:C.surface,
                  color:tab===t.id?C.accent:C.muted,flexShrink:0,whiteSpace:"nowrap",
                  borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* FORM CONTENT */}
          <div style={{flex:1,overflowY:"auto",padding:"14px"}}>

            {/* PERSONAL */}
            {tab==="personal"&&<>
              <div style={card}>
                <div style={{fontWeight:"700",color:C.text,marginBottom:"14px",fontSize:"14px"}}>
                  📋 Contact Information
                </div>
                {[["Full Name *","name","Arjun Sharma"],["Email *","email","arjun@gmail.com"],
                  ["Phone *","phone","+91 98765 43210"],["City, State","location","Bangalore, Karnataka"],
                  ["LinkedIn URL","linkedin","linkedin.com/in/..."],
                  ["GitHub URL","github","github.com/..."],
                  ["Portfolio / Website","website","yoursite.dev"]
                ].map(([l,k,ph])=>(
                  <div key={k}>
                    <label style={lbl}>{l}</label>
                    <input style={inp} placeholder={ph} value={form[k]||""}
                      onChange={e=>upd(k,e.target.value)}/>
                  </div>
                ))}
              </div>
              <div style={card}>
                <label style={lbl}>Professional Summary *</label>
                <textarea style={{...inp,height:"90px",resize:"vertical"}}
                  placeholder="3-4 sentences: your key skills, years of experience, and what role you're seeking."
                  value={form.summary||""} onChange={e=>upd("summary",e.target.value)}/>
              </div>
            </>}

            {/* EDUCATION */}
            {tab==="education"&&<>
              {form.education.map((e,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:"13px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>
                      🎓 Education {form.education.length>1?`#${i+1}`:""}
                    </div>
                    {form.education.length>1&&(
                      <button onClick={()=>delRow("education",i)} style={removeBtn}>✕ Remove</button>
                    )}
                  </div>
                  {[["Degree / Course *","degree","B.Tech Computer Science"],
                    ["College / University *","school","NIT Trichy"],
                    ["Year","year","2021–2025"],
                    ["CGPA / Percentage","gpa","8.5 CGPA"]
                  ].map(([l,k,ph])=>(
                    <div key={k}>
                      <label style={lbl}>{l}</label>
                      <input style={inp} placeholder={ph} value={e[k]||""}
                        onChange={ev=>updN("education",i,k,ev.target.value)}/>
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={()=>addRow("education",{degree:"",school:"",year:"",gpa:""})}
                style={{width:"100%",padding:"10px",background:"transparent",
                  border:`1px dashed ${C.border}`,color:C.accent,borderRadius:"8px",
                  fontSize:"13px",fontWeight:"600"}}>
                + Add Another Education
              </button>
            </>}

            {/* EXPERIENCE */}
            {tab==="experience"&&<>
              {form.experience.map((e,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:"13px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>
                      💼 Experience {form.experience.length>1?`#${i+1}`:""}
                    </div>
                    {form.experience.length>1&&(
                      <button onClick={()=>delRow("experience",i)} style={removeBtn}>✕ Remove</button>
                    )}
                  </div>
                  {[["Job Title *","role","Software Developer Intern"],
                    ["Company","company","Razorpay, Bangalore"],
                    ["Duration","duration","Jun 2024 – Aug 2024"]
                  ].map(([l,k,ph])=>(
                    <div key={k}>
                      <label style={lbl}>{l}</label>
                      <input style={inp} placeholder={ph} value={e[k]||""}
                        onChange={ev=>updN("experience",i,k,ev.target.value)}/>
                    </div>
                  ))}
                  <label style={lbl}>Key Achievements (one per line, use numbers/metrics)</label>
                  <textarea style={{...inp,height:"110px",resize:"vertical"}}
                    placeholder={"Built X reducing time by 40%\nProcessed 10k+ events/day\nImproved test coverage to 90%"}
                    value={e.bullets||""} onChange={ev=>updN("experience",i,"bullets",ev.target.value)}/>
                </div>
              ))}
              <button onClick={()=>addRow("experience",{role:"",company:"",duration:"",bullets:""})}
                style={{width:"100%",padding:"10px",background:"transparent",
                  border:`1px dashed ${C.border}`,color:C.accent,borderRadius:"8px",
                  fontSize:"13px",fontWeight:"600"}}>
                + Add Another Experience
              </button>
            </>}

            {/* PROJECTS */}
            {tab==="projects"&&<>
              {form.projects.map((p,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:"13px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>
                      🚀 Project {form.projects.length>1?`#${i+1}`:""}
                    </div>
                    {form.projects.length>1&&(
                      <button onClick={()=>delRow("projects",i)} style={removeBtn}>✕ Remove</button>
                    )}
                  </div>
                  {[["Project Name *","name","ATS Resume Builder"],
                    ["Tech Stack","tech","React, Node.js, MongoDB"],
                    ["Live Link / GitHub","link","github.com/..."]
                  ].map(([l,k,ph])=>(
                    <div key={k}>
                      <label style={lbl}>{l}</label>
                      <input style={inp} placeholder={ph} value={p[k]||""}
                        onChange={ev=>updN("projects",i,k,ev.target.value)}/>
                    </div>
                  ))}
                  <label style={lbl}>Description & Impact</label>
                  <textarea style={{...inp,height:"70px",resize:"vertical"}}
                    placeholder="Built for X users. Achieved Y result. Used Z technology."
                    value={p.description||""} onChange={ev=>updN("projects",i,"description",ev.target.value)}/>
                </div>
              ))}
              <button onClick={()=>addRow("projects",{name:"",tech:"",description:"",link:""})}
                style={{width:"100%",padding:"10px",background:"transparent",
                  border:`1px dashed ${C.border}`,color:C.accent,borderRadius:"8px",
                  fontSize:"13px",fontWeight:"600"}}>
                + Add Another Project
              </button>
            </>}

            {/* SKILLS */}
            {tab==="skills"&&<div style={card}>
              <div style={{fontWeight:"700",color:C.text,marginBottom:"14px",fontSize:"14px"}}>
                🛠 Skills & Qualifications
              </div>
              {[["Technical Skills *","technical","React, Node.js, MongoDB, Git, Docker, AWS"],
                ["Programming Languages","languages","Java, JavaScript, Python, C++, SQL"],
                ["Tools & Platforms","tools","VS Code, Postman, Figma, Jira, Linux"],
                ["Soft Skills","soft","Leadership, Communication, Problem Solving, Agile"]
              ].map(([l,k,ph])=>(
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input style={inp} placeholder={ph} value={form.skills[k]||""}
                    onChange={e=>updS(k,e.target.value)}/>
                </div>
              ))}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"14px",marginTop:"4px"}}>
                <label style={lbl}>Certifications (one per line)</label>
                <textarea style={{...inp,height:"72px",resize:"vertical"}}
                  placeholder={"AWS Cloud Practitioner (2024)\nGoogle Data Analytics (2023)"}
                  value={form.certifications||""} onChange={e=>upd("certifications",e.target.value)}/>
                <label style={lbl}>Achievements / Extra Curriculars</label>
                <textarea style={{...inp,height:"62px",resize:"vertical"}}
                  placeholder={"Winner — Internal Hackathon 2024\nGoogle DSC Lead"}
                  value={form.achievements||""} onChange={e=>upd("achievements",e.target.value)}/>
              </div>
            </div>}

            {/* EXTRA / CUSTOM SECTIONS */}
            {tab==="extra"&&<>
              <div style={{color:C.muted,fontSize:"12px",marginBottom:"14px",
                padding:"11px 13px",background:C.card,borderRadius:"9px",
                border:`1px solid ${C.border}`,lineHeight:1.6}}>
                💡 <strong style={{color:C.text}}>Custom Sections</strong> — Add anything extra:<br/>
                Volunteer Work, Languages, Publications, Research, Hobbies, etc.
              </div>
              {form.customSections.map((sec,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:"11px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>
                      Custom Section {i+1}
                    </div>
                    <button onClick={()=>delCustom(i)} style={removeBtn}>✕ Remove</button>
                  </div>
                  <label style={lbl}>Section Title</label>
                  <input style={inp} placeholder="e.g. Volunteer Work, Languages, Publications"
                    value={sec.title||""} onChange={e=>updCustom(i,"title",e.target.value)}/>
                  <label style={lbl}>Content (one item per line)</label>
                  <textarea style={{...inp,height:"100px",resize:"vertical"}}
                    placeholder={"Volunteer Teacher — Teach For India (2023)\nFluent in English, Hindi, Kannada\nResearch paper: AI in Education (2024)"}
                    value={sec.content||""} onChange={e=>updCustom(i,"content",e.target.value)}/>
                </div>
              ))}
              <button onClick={addCustom}
                style={{width:"100%",padding:"11px",background:"transparent",
                  border:`1px dashed ${C.accent}`,color:C.accent,borderRadius:"9px",
                  fontSize:"13px",fontWeight:"700"}}>
                + Add Custom Section
              </button>
            </>}

          </div>{/* end form content */}
        </div>{/* end form panel */}

        {/* PREVIEW PANEL */}
        <div style={{flex:1,display:"flex",flexDirection:"column",
          background:theme==="dark"?"#080810":"#e4e8f2",
          overflow:"hidden",
          visibility:mobileView==="edit"?"hidden":"visible",
          position:mobileView==="edit"?"absolute":"relative"}}
          className="preview-panel show">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{fontSize:"13px",fontWeight:"600",color:C.text}}>
              Live Preview — {TEMPLATES.find(t=>t.id===templateId)?.name}
            </div>
            <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
              {paid
                ?<span style={{fontSize:"11px",color:C.accent,fontWeight:"700"}}>✅ Unlocked</span>
                :<span style={{fontSize:"11px",color:C.muted}}>🔒 Watermarked Preview</span>
              }
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
            <div style={{background:"#fff",borderRadius:"8px",overflow:"hidden",
              boxShadow:"0 8px 40px rgba(0,0,0,0.25)",maxWidth:"750px",margin:"0 auto"}}
              id="rm-preview">
              <Tmpl form={form} watermark={!paid} theme={resumeTheme}/>
            </div>
            {!paid&&<div style={{marginTop:"16px",background:C.card,
              border:`1px solid ${C.accent}44`,borderRadius:"12px",
              padding:"18px",textAlign:"center",maxWidth:"750px",margin:"16px auto 0"}}>
              <div style={{fontWeight:"700",color:C.text,marginBottom:"5px",fontSize:"15px"}}>
                Ready to download your clean PDF?
              </div>
              <div style={{color:C.muted,fontSize:"12px",marginBottom:"12px"}}>
                Remove watermark • Perfect print quality • Just ₹9
              </div>
              <button onClick={()=>setShowPayment(true)}
                style={{padding:"11px 30px",background:C.accent,color:"#000",border:"none",
                  borderRadius:"9px",fontWeight:"700",fontSize:"14px",cursor:"pointer"}}>
                💳 Pay ₹9 & Download →
              </button>
            </div>}
          </div>
        </div>

        {/* Desktop: show both panels always */}
        <style>{`
          @media(min-width:769px){
            .form-panel{visibility:visible !important;position:relative !important;}
            .preview-panel{visibility:visible !important;position:relative !important;}
          }
        `}</style>
      </div>

      {showAI&&<AIModal onClose={()=>setShowAI(false)} onApply={f=>setForm(f)} currentForm={form}/>}
      {showPayment&&<PaymentModal form={form}
        onClose={()=>setShowPayment(false)}
        onSuccess={()=>{setPaid(true);setShowPayment(false);setTimeout(downloadPDF,900);}}
      />}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("landing");
  const [theme,setTheme]=useState("dark");
  const [showAdmin,setShowAdmin]=useState(false);
  const [showUpload,setShowUpload]=useState(false);
  const [uploadedForm,setUploadedForm]=useState(null);

  return(<>
    <style>{GS}</style>
    {page==="landing"&&(
      <Landing
        onStart={()=>{setUploadedForm(null);setPage("builder");}}
        onStartUpload={()=>setShowUpload(true)}
        theme={theme} setTheme={setTheme}
        onAdmin={()=>setShowAdmin(true)}
      />
    )}
    {page==="builder"&&(
      <Builder
        onBack={()=>setPage("landing")}
        theme={theme} setTheme={setTheme}
        initialForm={uploadedForm||EMPTY}
      />
    )}
    {showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}
    {showUpload&&<UploadModal
      onClose={()=>setShowUpload(false)}
      onExtracted={form=>{setUploadedForm(form);setShowUpload(false);setPage("builder");}}
    />}
  </>);
}

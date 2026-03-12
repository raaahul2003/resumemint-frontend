// ResumeMint v7 — Clean, Reliable, Production Ready
// KEY FIXES: Payment polling fallback, AI is optional, clean trustworthy UI
import { useState, useEffect, useRef } from "react";

const BACKEND = "https://resumemint-backend.onrender.com";
const RAZORPAY_KEY = "rzp_live_SPxfWRaOw9vYcS";

// ── THEMES ────────────────────────────────────────────────
const DARK = {
  bg:"#0a0a0f", surface:"#111118", card:"#16161f", border:"#22222e",
  accent:"#22c55e", accentDim:"#22c55e14", gold:"#f59e0b",
  red:"#ef4444", blue:"#3b82f6", purple:"#a855f7",
  text:"#f1f5f9", sub:"#94a3b8", muted:"#475569",
};
const LIGHT = {
  bg:"#f8fafc", surface:"#ffffff", card:"#ffffff", border:"#e2e8f0",
  accent:"#16a34a", accentDim:"#16a34a12", gold:"#d97706",
  red:"#dc2626", blue:"#2563eb", purple:"#9333ea",
  text:"#0f172a", sub:"#64748b", muted:"#94a3b8",
};

const GS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;font-family:'Plus Jakarta Sans',sans-serif;}
input,textarea,select,button{font-family:inherit;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#334155;border-radius:4px;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
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

// ── DEFAULT DATA ──────────────────────────────────────────
const EMPTY = {
  name:"",email:"",phone:"",location:"",linkedin:"",github:"",website:"",summary:"",
  education:[{degree:"",school:"",year:"",gpa:""}],
  experience:[{role:"",company:"",duration:"",bullets:""}],
  projects:[{name:"",tech:"",description:"",link:""}],
  skills:{technical:"",languages:"",soft:"",tools:""},
  certifications:"",achievements:"",customSections:[],
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
    {name:"Smart Attendance System",tech:"Python, OpenCV, Flask, MySQL",description:"Face recognition attendance. 95% accuracy. Used by 400+ students.",link:"github.com/arjunsharma"},
  ],
  skills:{
    technical:"React.js, Node.js, Express, MongoDB, MySQL, REST APIs, Git, Docker, AWS EC2/S3",
    languages:"JavaScript, Python, Java, C++, SQL",
    soft:"Problem Solving, Team Leadership, Communication, Time Management",
    tools:"VS Code, Postman, Figma, Jira, Linux"
  },
  certifications:"AWS Certified Cloud Practitioner — Amazon (2024)\nGoogle Data Analytics Professional Certificate (2023)\nHackerRank Gold Badge — Problem Solving",
  achievements:"Academic Rank 3 in Department (2023)\nWinner — Internal Hackathon 2024 (Team of 4)\nGoogle DSC Lead — RVCE Chapter (150+ members)",
  customSections:[],
};

// ══════════════════════════════════════════════════════════
// RESUME TEMPLATES
// ══════════════════════════════════════════════════════════

// ── WATERMARK ─────────────────────────────────────────────
function Watermark(){
  return(
    <div style={{position:"absolute",inset:0,zIndex:5,pointerEvents:"none",
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{transform:"rotate(-35deg)",textAlign:"center",userSelect:"none"}}>
        <div style={{fontSize:"22px",fontWeight:"800",color:"rgba(0,0,0,0.08)",
          letterSpacing:"6px",textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          PREVIEW ONLY
        </div>
        <div style={{fontSize:"11px",color:"rgba(0,0,0,0.06)",letterSpacing:"3px",marginTop:"5px"}}>
          Pay ₹9 to unlock
        </div>
      </div>
    </div>
  );
}

// ── TEMPLATE 1: CLASSIC ATS ───────────────────────────────
function TemplateClassic({form,watermark}){
  const S={
    page:{fontFamily:"'Times New Roman',Georgia,serif",fontSize:"10.5pt",color:"#111",
      background:"#fff",padding:"0.6in 0.7in",lineHeight:1.55,maxWidth:"760px",
      margin:"0 auto",position:"relative",minHeight:"1070px"},
    name:{fontSize:"22pt",fontWeight:"700",color:"#000",textAlign:"center",marginBottom:"4px"},
    contacts:{fontSize:"9.5pt",color:"#333",display:"flex",gap:"8px",flexWrap:"wrap",
      justifyContent:"center",marginBottom:"6px"},
    hr:{borderTop:"1.5pt solid #000",margin:"6px 0"},
    thr:{borderTop:"0.5pt solid #999",margin:"4px 0 5px"},
    sh:{fontSize:"10.5pt",fontWeight:"700",color:"#000",textTransform:"uppercase",
      letterSpacing:"0.7px",marginBottom:"2px",marginTop:"10px"},
    row:{display:"flex",justifyContent:"space-between",gap:"6px"},
    bold:{fontWeight:"700",fontSize:"10.5pt"},
    sub:{color:"#555",fontSize:"9.5pt"},
    ul:{marginLeft:"14px",marginTop:"3px"},
    li:{marginBottom:"2px",fontSize:"10pt",lineHeight:1.5},
  };
  return(
    <div style={{position:"relative"}}>
      {watermark&&<Watermark/>}
      <div style={S.page} id="resume-print">
        <div style={S.name}>{form.name||"Your Name"}</div>
        <div style={S.contacts}>
          {[form.location,form.email,form.phone,form.linkedin,form.github,form.website].filter(Boolean).map((v,i,a)=>(
            <span key={i}>{v}{i<a.length-1?" |":""}</span>
          ))}
        </div>
        <div style={S.hr}/>

        {form.summary&&<>
          <div style={S.sh}>Professional Summary</div>
          <div style={S.thr}/>
          <p style={{fontSize:"10pt",lineHeight:1.7,marginTop:"3px"}}>{form.summary}</p>
        </>}

        {form.education?.[0]?.degree&&<>
          <div style={S.sh}>Education</div>
          <div style={S.thr}/>
          {form.education.map((e,i)=>(
            <div key={i} style={{...S.row,marginBottom:"5px",marginTop:"4px"}}>
              <div>
                <div style={S.bold}>{e.degree}</div>
                <div style={S.sub}>{e.school}</div>
              </div>
              <div style={{textAlign:"right",fontSize:"9.5pt",color:"#444",flexShrink:0}}>
                <div>{e.year}</div>
                {e.gpa&&<div>{e.gpa}</div>}
              </div>
            </div>
          ))}
        </>}

        {form.experience?.[0]?.role&&<>
          <div style={S.sh}>Work Experience</div>
          <div style={S.thr}/>
          {form.experience.map((e,i)=>(
            <div key={i} style={{marginBottom:"9px",marginTop:"4px"}}>
              <div style={S.row}>
                <span style={S.bold}>{e.role}{e.company&&<span style={{fontWeight:"400"}}> — {e.company}</span>}</span>
                <span style={{...S.sub,flexShrink:0}}>{e.duration}</span>
              </div>
              {e.bullets&&<ul style={S.ul}>{e.bullets.split("\n").filter(Boolean).map((b,j)=><li key={j} style={S.li}>{b}</li>)}</ul>}
            </div>
          ))}
        </>}

        {form.projects?.[0]?.name&&<>
          <div style={S.sh}>Projects</div>
          <div style={S.thr}/>
          {form.projects.map((p,i)=>(
            <div key={i} style={{marginBottom:"7px",marginTop:"4px"}}>
              <div style={S.row}>
                <span style={S.bold}>{p.name}</span>
                {p.link&&<span style={{...S.sub,flexShrink:0}}>{p.link}</span>}
              </div>
              {p.tech&&<div style={{fontSize:"9.5pt",fontStyle:"italic",color:"#555"}}>{p.tech}</div>}
              {p.description&&<div style={{fontSize:"10pt",marginTop:"2px"}}>{p.description}</div>}
            </div>
          ))}
        </>}

        {(form.skills?.technical||form.skills?.languages)&&<>
          <div style={S.sh}>Technical Skills</div>
          <div style={S.thr}/>
          <div style={{marginTop:"3px"}}>
            {[["Core Skills",form.skills?.technical],["Languages",form.skills?.languages],
              ["Tools",form.skills?.tools],["Soft Skills",form.skills?.soft]].filter(([,v])=>v).map(([k,v],i)=>(
              <div key={i} style={{fontSize:"10pt",marginBottom:"2px"}}><strong>{k}: </strong>{v}</div>
            ))}
          </div>
        </>}

        {form.certifications&&<>
          <div style={S.sh}>Certifications</div>
          <div style={S.thr}/>
          <ul style={{...S.ul,marginTop:"3px"}}>{form.certifications.split("\n").filter(Boolean).map((c,i)=><li key={i} style={S.li}>{c}</li>)}</ul>
        </>}

        {form.achievements&&<>
          <div style={S.sh}>Achievements & Activities</div>
          <div style={S.thr}/>
          <ul style={{...S.ul,marginTop:"3px"}}>{form.achievements.split("\n").filter(Boolean).map((a,i)=><li key={i} style={S.li}>{a}</li>)}</ul>
        </>}

        {form.customSections?.map((sec,i)=>sec.title&&sec.content?(
          <div key={i}>
            <div style={S.sh}>{sec.title}</div>
            <div style={S.thr}/>
            <ul style={{...S.ul,marginTop:"3px"}}>{sec.content.split("\n").filter(Boolean).map((l,j)=><li key={j} style={S.li}>{l}</li>)}</ul>
          </div>
        ):null)}
      </div>
    </div>
  );
}

// ── TEMPLATE 2: MODERN ────────────────────────────────────
function TemplateModern({form,watermark}){
  const acc="#2563eb";
  return(
    <div style={{position:"relative"}}>
      {watermark&&<Watermark/>}
      <div style={{display:"flex",fontFamily:"Arial,Helvetica,sans-serif",fontSize:"10.5px",
        background:"#fff",color:"#1e293b",maxWidth:"760px",margin:"0 auto",minHeight:"1070px"}}>
        <div style={{width:"215px",background:"#1e293b",padding:"28px 16px",flexShrink:0,color:"#e2e8f0"}}>
          <div style={{fontSize:"17px",fontWeight:"700",color:"#fff",marginBottom:"3px",lineHeight:1.2}}>{form.name||"Your Name"}</div>
          <div style={{fontSize:"9px",color:"#94a3b8",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"18px"}}>
            {form.experience?.[0]?.role||"Software Engineer"}
          </div>
          <SideSection title="Contact" accent={acc}>
            
            {[[form.email,"✉"],[form.phone,"✆"],[form.location,"📍"],[form.linkedin,"🔗"],[form.github,"⌥"],[form.website,"🌐"]].filter(([v])=>v).map(([v,icon],i)=>(
              <div key={i} style={{fontSize:"9px",marginBottom:"5px",display:"flex",gap:"5px",wordBreak:"break-all"}}>
                <span style={{flexShrink:0}}>{icon}</span><span style={{color:"#cbd5e1"}}>{v}</span>
              </div>
            ))}
          </SideSection>
          {form.skills?.technical&&<SideSection title="Skills" accent={acc}>
            <div style={{display:"flex",flexWrap:"wrap",gap:"3px"}}>
              {form.skills.technical.split(",").map((s,i)=>(
                <span key={i} style={{fontSize:"8px",padding:"2px 6px",background:"#334155",
                  color:"#94a3b8",borderRadius:"3px"}}>{s.trim()}</span>
              ))}
            </div>
          </SideSection>}
          {form.skills?.languages&&<SideSection title="Languages" accent={acc}>
            <div style={{fontSize:"9px",color:"#cbd5e1",lineHeight:1.6}}>{form.skills.languages}</div>
          </SideSection>}
          {form.certifications&&<SideSection title="Certifications" accent={acc}>
            {form.certifications.split("\n").filter(Boolean).map((c,i)=>(
              <div key={i} style={{fontSize:"8.5px",color:"#cbd5e1",marginBottom:"4px",lineHeight:1.4}}>• {c}</div>
            ))}
          </SideSection>}
        </div>
        <div style={{flex:1,padding:"28px 22px"}}>
          {form.summary&&<MSection title="Summary" accent={acc}>
            <p style={{fontSize:"10.5px",lineHeight:1.75,color:"#374151"}}>{form.summary}</p>
          </MSection>}
          {form.experience?.[0]?.role&&<MSection title="Experience" accent={acc}>
            {form.experience.map((e,i)=>(
              <div key={i} style={{marginBottom:"11px"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <strong style={{fontSize:"11px"}}>{e.role}</strong>
                  <span style={{fontSize:"9.5px",color:"#94a3b8",flexShrink:0}}>{e.duration}</span>
                </div>
                {e.company&&<div style={{color:acc,fontSize:"10px",marginBottom:"3px"}}>{e.company}</div>}
                <ul style={{marginLeft:"14px"}}>{e.bullets?.split("\n").filter(Boolean).map((b,j)=><li key={j} style={{fontSize:"10px",marginBottom:"2px",lineHeight:1.5}}>{b}</li>)}</ul>
              </div>
            ))}
          </MSection>}
          {form.education?.[0]?.degree&&<MSection title="Education" accent={acc}>
            {form.education.map((e,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                <div>
                  <strong style={{fontSize:"11px"}}>{e.degree}</strong>
                  <div style={{color:"#64748b",fontSize:"10px"}}>{e.school}</div>
                </div>
                <div style={{textAlign:"right",fontSize:"10px",color:"#94a3b8",flexShrink:0}}>{e.year}<br/>{e.gpa}</div>
              </div>
            ))}
          </MSection>}
          {form.projects?.[0]?.name&&<MSection title="Projects" accent={acc}>
            {form.projects.map((p,i)=>(
              <div key={i} style={{marginBottom:"8px"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <strong style={{fontSize:"11px"}}>{p.name}</strong>
                  {p.link&&<span style={{fontSize:"9.5px",color:"#94a3b8",flexShrink:0}}>{p.link}</span>}
                </div>
                {p.tech&&<div style={{fontSize:"9.5px",color:"#64748b",fontStyle:"italic"}}>{p.tech}</div>}
                {p.description&&<div style={{fontSize:"10px",marginTop:"2px",color:"#374151"}}>{p.description}</div>}
              </div>
            ))}
          </MSection>}
          {form.achievements&&<MSection title="Achievements" accent={acc}>
            <ul style={{marginLeft:"14px"}}>{form.achievements.split("\n").filter(Boolean).map((a,i)=><li key={i} style={{fontSize:"10px",marginBottom:"2px"}}>{a}</li>)}</ul>
          </MSection>}
          {form.customSections?.map((sec,i)=>sec.title&&sec.content?(
            <MSection key={i} title={sec.title} accent={acc}>
              <ul style={{marginLeft:"14px"}}>{sec.content.split("\n").filter(Boolean).map((l,j)=><li key={j} style={{fontSize:"10px",marginBottom:"2px"}}>{l}</li>)}</ul>
            </MSection>
          ):null)}
        </div>
      </div>
    </div>
  );
}
function SideSection({title,accent,children}){
  return(
    <div style={{marginBottom:"14px"}}>
      <div style={{fontSize:"8.5px",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1.5px",
        color:accent,marginBottom:"7px",paddingBottom:"3px",borderBottom:`1px solid #334155`}}>{title}</div>
      {children}
    </div>
  );
}
function MSection({title,accent,children}){
  return(
    <div style={{marginBottom:"16px"}}>
      <div style={{fontWeight:"700",fontSize:"10px",textTransform:"uppercase",letterSpacing:"1px",
        color:accent,marginBottom:"7px",paddingBottom:"3px",borderBottom:`2px solid ${accent}`}}>{title}</div>
      {children}
    </div>
  );
}

// ── TEMPLATE 3: EXECUTIVE ─────────────────────────────────
function TemplateExecutive({form,watermark}){
  const gold="#92702a";
  const ESH=({title})=>(
    <div style={{display:"flex",alignItems:"center",gap:"10px",margin:"14px 0 7px"}}>
      <div style={{width:"22px",height:"1px",background:gold}}/>
      <div style={{fontSize:"9pt",fontWeight:"700",color:gold,textTransform:"uppercase",letterSpacing:"2px"}}>{title}</div>
      <div style={{flex:1,height:"0.5px",background:"#d6d0c4"}}/>
    </div>
  );
  return(
    <div style={{position:"relative"}}>
      {watermark&&<Watermark/>}
      <div style={{fontFamily:"Georgia,serif",fontSize:"10.5px",background:"#fdfbf7",
        color:"#2c2c2c",padding:"36px 44px",maxWidth:"760px",margin:"0 auto",minHeight:"1070px"}}>
        <div style={{textAlign:"center",marginBottom:"18px",paddingBottom:"14px",borderBottom:`2px solid ${gold}`}}>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:"28px",
            color:"#1a1a1a",letterSpacing:"3px",marginBottom:"4px"}}>{form.name||"Your Name"}</div>
          <div style={{fontSize:"9px",letterSpacing:"3px",color:gold,textTransform:"uppercase",marginBottom:"8px"}}>
            {form.experience?.[0]?.role||"Software Engineer"}
          </div>
          <div style={{fontSize:"9.5px",color:"#666",display:"flex",justifyContent:"center",
            gap:"16px",flexWrap:"wrap"}}>
            {[form.email,form.phone,form.location,form.linkedin].filter(Boolean).map((v,i)=><span key={i}>{v}</span>)}
          </div>
        </div>
        {form.summary&&<><ESH title="Profile"/><p style={{fontStyle:"italic",color:"#555",fontSize:"10.5px",lineHeight:1.9}}>{form.summary}</p></>}
        {form.education?.[0]?.degree&&<><ESH title="Education"/>
          {form.education.map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
              <div><strong>{e.degree}</strong><div style={{color:"#666",fontSize:"10px"}}>{e.school}</div></div>
              <div style={{textAlign:"right",color:"#666",fontSize:"10px",flexShrink:0}}>{e.year}<br/>{e.gpa}</div>
            </div>
          ))}
        </>}
        {form.experience?.[0]?.role&&<><ESH title="Experience"/>
          {form.experience.map((e,i)=>(
            <div key={i} style={{marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <strong style={{fontSize:"11px"}}>{e.role}</strong>
                <span style={{color:"#888",fontSize:"10px",flexShrink:0}}>{e.duration}</span>
              </div>
              {e.company&&<div style={{color:gold,fontSize:"10px",fontStyle:"italic",marginBottom:"3px"}}>{e.company}</div>}
              <ul style={{marginLeft:"16px"}}>{e.bullets?.split("\n").filter(Boolean).map((b,j)=><li key={j} style={{fontSize:"10.5px",marginBottom:"3px",lineHeight:1.5}}>{b}</li>)}</ul>
            </div>
          ))}
        </>}
        {form.projects?.[0]?.name&&<><ESH title="Projects"/>
          {form.projects.map((p,i)=>(
            <div key={i} style={{marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <strong style={{fontSize:"11px"}}>{p.name}</strong>
                {p.link&&<span style={{fontSize:"9.5px",color:"#888",fontStyle:"italic",flexShrink:0}}>{p.link}</span>}
              </div>
              {p.tech&&<span style={{fontSize:"9.5px",color:"#888",fontStyle:"italic"}}>{p.tech}</span>}
              {p.description&&<div style={{fontSize:"10.5px",marginTop:"2px"}}>{p.description}</div>}
            </div>
          ))}
        </>}
        {form.skills?.technical&&<><ESH title="Skills"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
            {[["Technical",form.skills.technical],["Languages",form.skills.languages],
              ["Tools",form.skills.tools],["Soft Skills",form.skills.soft]].filter(([,v])=>v).map(([k,v],i)=>(
              <div key={i} style={{fontSize:"10px"}}><strong style={{color:gold}}>{k}: </strong>{v}</div>
            ))}
          </div>
        </>}
        {form.certifications&&<><ESH title="Certifications"/>
          <div style={{columnCount:2,gap:"12px"}}>
            {form.certifications.split("\n").filter(Boolean).map((c,i)=><div key={i} style={{fontSize:"10px",marginBottom:"3px"}}>◆ {c}</div>)}
          </div>
        </>}
        {form.achievements&&<><ESH title="Achievements"/>
          <div style={{columnCount:2,gap:"12px"}}>
            {form.achievements.split("\n").filter(Boolean).map((a,i)=><div key={i} style={{fontSize:"10px",marginBottom:"3px"}}>◆ {a}</div>)}
          </div>
        </>}
        {form.customSections?.map((sec,i)=>sec.title&&sec.content?(
          <div key={i}><ESH title={sec.title}/><ul style={{marginLeft:"16px"}}>{sec.content.split("\n").filter(Boolean).map((l,j)=><li key={j} style={{fontSize:"10.5px",marginBottom:"3px"}}>{l}</li>)}</ul></div>
        ):null)}
      </div>
    </div>
  );
}

const TEMPLATES=[
  {id:"classic",name:"Classic ATS",icon:"📋",desc:"Clean B&W, perfect for all ATS systems"},
  {id:"modern",name:"Modern",icon:"💼",desc:"Two-column with dark sidebar"},
  {id:"executive",name:"Executive",icon:"✨",desc:"Premium serif style with gold accents"},
];

// ══════════════════════════════════════════════════════════
// PAYMENT MODAL — with polling fallback for QR/UPI
// ══════════════════════════════════════════════════════════
function PaymentModal({onClose,onSuccess,form}){
  const [step,setStep]=useState("pay"); // pay | loading | open | verifying | success | error
  const [err,setErr]=useState("");
  const [orderId,setOrderId]=useState("");
  const pollRef=useRef(null);
  const C=DARK;

  // Stop polling on unmount
  useEffect(()=>()=>{if(pollRef.current)clearInterval(pollRef.current);},[]);

  // POLL backend every 4 seconds to check if payment completed
  // This handles QR/UPI where Razorpay handler callback may not fire
  const startPolling=(oid)=>{
    if(pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async()=>{
      try{
        const r = await fetch(`${BACKEND}/check-payment`,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({order_id:oid})
        });
        const d = await r.json();
        if(d.paid){
          clearInterval(pollRef.current);
          setStep("success");
          setTimeout(()=>onSuccess(),1800);
        }
      }catch(e){/* keep polling */}
    },4000);
    // Stop polling after 10 minutes
    setTimeout(()=>clearInterval(pollRef.current),600000);
  };

  const startPay=async()=>{
    if(!rateLimit("pay",5,300000)){setErr("Too many attempts. Please wait 5 minutes.");return;}
    setStep("loading");setErr("");
    try{
      // Wake up Render (free tier sleeps)
      try{await fetch(`${BACKEND}/`,{signal:(AbortSignal.timeout?AbortSignal.timeout(8000):undefined)});}catch(e){}
      const r=await fetch(`${BACKEND}/create-order`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({amount:900}),
        signal:(AbortSignal.timeout?AbortSignal.timeout(15000):undefined)
      });
      if(!r.ok){
        const d=await r.json().catch(()=>({}));
        throw new Error(d.error||"Server error ("+r.status+"). Please try again.");
      }
      const order=await r.json();
      if(!order.id) throw new Error("Invalid order response. Please try again.");
      setOrderId(order.id);
      if(!window.Razorpay) throw new Error("Payment system failed to load. Please refresh the page.");
      const rzp=new window.Razorpay({
        key:RAZORPAY_KEY,
        amount:900, currency:"INR",
        name:"ResumeMint",
        description:"ATS Resume — ₹9",
        order_id:order.id,
        prefill:{name:form.name||"",email:form.email||"",contact:form.phone||""},
        theme:{color:"#22c55e"},
        modal:{
          ondismiss:()=>{
            // Don't reset to pay — keep polling in background in case payment was made
            setStep("open");
          },
          escape:false
        },
        handler:async(resp)=>{
          // This fires for card/netbanking. For UPI/QR, polling handles it.
          if(pollRef.current) clearInterval(pollRef.current);
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
            else throw new Error(vd.error||"Verification failed. Contact support@resumemint.in");
          }catch(e){
            setErr("Payment received but verification pending. If download doesn't start in 30s, email support@resumemint.in with payment ID.");
            setStep("error");
          }
        }
      });
      rzp.open();
      setStep("open");
      // Start polling immediately so QR payments are caught
      startPolling(order.id);
    }catch(e){
      const msg=e.message||"Connection failed. Please check internet and try again.";
      setErr(msg);setStep("error");
    }
  };

  const btn=(text,onClick,accent)=>(
    <button onClick={onClick} style={{width:"100%",padding:"14px",borderRadius:"10px",
      border:"none",fontWeight:"700",fontSize:"15px",cursor:"pointer",
      background:accent?C.accent:"transparent",
      color:accent?"#000":C.sub}}>
      {text}
    </button>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:3000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"#16161f",border:"1px solid #22222e",borderRadius:"20px",
        width:"100%",maxWidth:"380px",animation:"slideIn 0.25s ease",overflow:"hidden"}}>

        {(step==="pay"||step==="error")&&<>
          <div style={{padding:"22px 22px 14px",borderBottom:"1px solid #22222e"}}>
            <div style={{fontWeight:"700",fontSize:"18px",color:"#f1f5f9",marginBottom:"2px"}}>
              Secure Checkout
            </div>
            <div style={{color:"#475569",fontSize:"12px"}}>Powered by Razorpay · All payments encrypted</div>
          </div>
          <div style={{padding:"18px 22px"}}>
            {/* Price box */}
            <div style={{background:"#0a0a0f",border:"1px solid #22c55e33",borderRadius:"12px",
              padding:"18px",textAlign:"center",marginBottom:"16px"}}>
              <div style={{fontSize:"13px",color:"#475569",marginBottom:"4px"}}>One Resume • Clean PDF • No Subscription</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"48px",color:"#22c55e",lineHeight:1}}>₹9</div>
              <div style={{display:"flex",justifyContent:"center",gap:"14px",marginTop:"10px"}}>
                {["✓ No watermark","✓ Instant download","✓ ATS-ready PDF"].map((t,i)=>(
                  <span key={i} style={{fontSize:"11px",color:"#64748b"}}>{t}</span>
                ))}
              </div>
            </div>
            {/* Payment methods */}
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"14px",justifyContent:"center"}}>
              {["UPI","GPay","PhonePe","Paytm","Debit Card","Net Banking"].map(m=>(
                <span key={m} style={{fontSize:"10px",padding:"3px 8px",
                  background:"#22222e",color:"#64748b",borderRadius:"5px"}}>{m}</span>
              ))}
            </div>
            {err&&<div style={{color:"#fca5a5",fontSize:"12px",marginBottom:"12px",
              padding:"10px 12px",background:"rgba(239,68,68,0.1)",borderRadius:"8px",lineHeight:1.6}}>
              ⚠ {err}
            </div>}
            <button onClick={startPay}
              style={{width:"100%",padding:"14px",background:"#22c55e",color:"#000",
                border:"none",borderRadius:"10px",fontWeight:"800",fontSize:"16px",cursor:"pointer"}}>
              Pay ₹9 & Download →
            </button>
            <button onClick={onClose} style={{width:"100%",marginTop:"8px",padding:"9px",
              background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:"12px"}}>
              Cancel
            </button>
          </div>
        </>}

        {step==="loading"&&<CenterState icon="⏳" title="Connecting to Razorpay..." sub="Setting up your secure payment..." spin/>}

        {step==="open"&&<div style={{padding:"32px 22px",textAlign:"center"}}>
          <div style={{fontSize:"40px",marginBottom:"14px"}}>💳</div>
          <div style={{fontWeight:"700",fontSize:"18px",color:"#f1f5f9",marginBottom:"8px"}}>
            Complete payment in the popup
          </div>
          <div style={{color:"#475569",fontSize:"12px",lineHeight:1.9,marginBottom:"16px"}}>
            Pay via UPI, QR code, card or net banking.<br/>
            <strong style={{color:"#94a3b8"}}>Keep this tab open.</strong><br/>
            This page <strong style={{color:"#94a3b8"}}>auto-unlocks</strong> within seconds of payment.
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
            padding:"10px 14px",background:"#0a0a0f",borderRadius:"8px",marginBottom:"14px",
            border:"1px solid #22222e"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#22c55e",
              animation:"pulse 1.2s infinite",flexShrink:0}}/>
            <span style={{fontSize:"12px",color:"#64748b"}}>Checking payment status every 4 seconds...</span>
          </div>
          <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={startPay} style={{fontSize:"12px",color:"#64748b",
              background:"transparent",border:"1px solid #22222e",
              padding:"8px 16px",borderRadius:"8px",cursor:"pointer"}}>
              Reopen payment popup
            </button>
            <button onClick={()=>setStep("pay")} style={{fontSize:"12px",color:"#475569",
              background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>
              Cancel
            </button>
          </div>
        </div>}

        {step==="verifying"&&<CenterState icon="🔐" title="Verifying payment..." sub="Almost done, please wait..." spin/>}

        {step==="success"&&<CenterState icon="✅" title="Payment Successful!" sub="Preparing your clean PDF now..." accent/>}
      </div>
    </div>
  );
}

function CenterState({icon,title,sub,spin,accent}){
  return(
    <div style={{padding:"52px 22px",textAlign:"center"}}>
      {spin
        ?<div style={{width:"44px",height:"44px",border:"3px solid #22222e",
          borderTop:"3px solid #22c55e",borderRadius:"50%",margin:"0 auto 18px",
          animation:"spin 0.8s linear infinite"}}/>
        :<div style={{fontSize:"48px",marginBottom:"16px"}}>{icon}</div>
      }
      <div style={{fontWeight:"700",fontSize:"18px",
        color:accent?"#22c55e":"#f1f5f9",marginBottom:"6px"}}>{title}</div>
      <div style={{color:"#475569",fontSize:"12px",lineHeight:1.6}}>{sub}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AI JOB MATCH — graceful when API quota is exceeded
// ══════════════════════════════════════════════════════════
function AIModal({onClose,onApply,form}){
  const [jd,setJd]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");
  const [status,setStatus]=useState("");
  const C=DARK;

  const analyze=async()=>{
    if(jd.trim().length<50){setErr("Please paste a complete job description (at least 50 characters).");return;}
    if(!rateLimit("ai",3,60000)){setErr("Too many requests. Please wait 1 minute.");return;}
    setLoading(true);setErr("");setStatus("Connecting to AI server...");
    try{await fetch(`${BACKEND}/`,{signal:(AbortSignal.timeout?AbortSignal.timeout(8000):undefined)});}catch(e){}
    setStatus("Analyzing job description...");
    try{
      const res=await fetch(`${BACKEND}/ai-job-match`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are a resume optimizer. Analyze the job description and return ONLY a JSON object, no markdown, no explanation:\n{"match_score":85,"summary":"2-3 sentence optimized summary","skills_technical":"comma,separated,matching,skills","experience_bullets":["bullet 1 with metric","bullet 2","bullet 3"],"keywords":["kw1","kw2","kw3"]}`,
          messages:[{role:"user",content:`JD: ${jd}\n\nResume: ${form.name}, ${form.summary}, Skills: ${form.skills?.technical}, Role: ${form.experience?.[0]?.role}`}]
        }),
        signal:(AbortSignal.timeout?AbortSignal.timeout(30000):undefined)
      });
      if(!res.ok){
        const d=await res.json().catch(()=>({}));
        const msg=typeof d.error==="string"?d.error:JSON.stringify(d.error)||"";
        if(res.status===429||msg==="AI_QUOTA_EXCEEDED"||msg.toLowerCase().includes("quota")||msg.toLowerCase().includes("limit")){
          throw new Error("QUOTA");
        }
        throw new Error("AI service unavailable. Please try again in a few minutes.");
      }
      const data=await res.json();
      if(data.error){
        const msg=typeof data.error==="string"?data.error:JSON.stringify(data.error);
        if(msg==="AI_QUOTA_EXCEEDED"||msg.includes("quota")||msg.includes("limit")||msg.includes("rate")||msg.includes("529")){
          throw new Error("QUOTA");
        }
        throw new Error(msg);
      }
      const text=data.content?.map(b=>b.text||"").join("")||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      setResult(parsed);setStatus("");
    }catch(e){
      if(e.message==="QUOTA"){
        setErr("⚠️ AI credits are temporarily exhausted. This is a shared limit — it resets daily. You can still build your resume manually and pay to download it. The AI feature will be back soon.");
      } else {
        setErr(e.message||"AI analysis failed. Please try again in a few minutes.");
      }
    }
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"#16161f",border:"1px solid #22222e",borderRadius:"20px",
        width:"100%",maxWidth:"600px",maxHeight:"90vh",overflow:"auto",animation:"slideIn 0.25s ease"}}>
        <div style={{padding:"20px 22px",borderBottom:"1px solid #22222e",
          display:"flex",justifyContent:"space-between",alignItems:"center",
          position:"sticky",top:0,background:"#16161f",zIndex:1}}>
          <div>
            <div style={{fontWeight:"700",fontSize:"17px",color:"#f1f5f9"}}>AI Job-Match Optimizer</div>
            <div style={{color:"#475569",fontSize:"12px",marginTop:"2px"}}>Paste a JD → AI tailors your resume for that exact role</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid #22222e",
            color:"#475569",padding:"6px 12px",borderRadius:"8px",fontSize:"14px"}}>✕</button>
        </div>
        <div style={{padding:"20px 22px"}}>
          {!result?<>
            <textarea value={jd} onChange={e=>setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              style={{width:"100%",height:"150px",padding:"12px",background:"#0a0a0f",
                border:"1px solid #22222e",borderRadius:"10px",color:"#f1f5f9",
                fontSize:"13px",lineHeight:1.6,resize:"vertical",outline:"none",fontFamily:"inherit"}}/>
            {status&&<div style={{color:"#22c55e",fontSize:"12px",marginTop:"8px",
              display:"flex",gap:"6px",alignItems:"center"}}>
              <div style={{width:"10px",height:"10px",border:"2px solid #22c55e44",borderTop:"2px solid #22c55e",
                borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
              {status}
            </div>}
            {err&&<div style={{color:"#fca5a5",fontSize:"12px",marginTop:"10px",
              padding:"12px",background:"rgba(239,68,68,0.08)",borderRadius:"8px",lineHeight:1.7}}>
              {err}
            </div>}
            <button onClick={analyze} disabled={loading}
              style={{marginTop:"12px",width:"100%",padding:"13px",
                background:loading?"#22222e":"#22c55e",color:loading?"#475569":"#000",
                border:"none",borderRadius:"10px",fontWeight:"700",fontSize:"14px",cursor:loading?"not-allowed":"pointer"}}>
              {loading?"Analyzing...":"⚡ Analyze & Optimize"}
            </button>
          </>:<>
            <div style={{textAlign:"center",padding:"16px",background:"rgba(34,197,94,0.08)",
              border:"1px solid rgba(34,197,94,0.2)",borderRadius:"12px",marginBottom:"18px"}}>
              <div style={{fontSize:"36px",fontWeight:"700",color:"#22c55e"}}>{result.match_score}%</div>
              <div style={{fontSize:"12px",color:"#64748b"}}>Match score after optimization</div>
            </div>
            {result.summary&&<>
              <div style={{fontWeight:"600",color:"#f1f5f9",fontSize:"13px",marginBottom:"6px"}}>Optimized Summary</div>
              <div style={{padding:"12px",background:"#0a0a0f",borderRadius:"9px",fontSize:"12px",
                color:"#94a3b8",lineHeight:1.75,borderLeft:"3px solid #22c55e",marginBottom:"14px"}}>{result.summary}</div>
            </>}
            {result.keywords?.length>0&&<>
              <div style={{fontWeight:"600",color:"#f1f5f9",fontSize:"13px",marginBottom:"7px"}}>Keywords Added</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"14px"}}>
                {result.keywords.map((k,i)=>(
                  <span key={i} style={{fontSize:"11px",padding:"3px 10px",
                    background:"rgba(34,197,94,0.1)",color:"#22c55e",borderRadius:"20px"}}>{k}</span>
                ))}
              </div>
            </>}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>onApply({...form,
                summary:result.summary||form.summary,
                skills:{...form.skills,technical:result.skills_technical||form.skills?.technical},
                experience:form.experience?.map((e,i)=>i===0?{...e,bullets:result.experience_bullets?.join("\n")||e.bullets}:e)
              })} style={{flex:1,padding:"12px",background:"#22c55e",color:"#000",
                border:"none",borderRadius:"10px",fontWeight:"700",fontSize:"14px",cursor:"pointer"}}>
                Apply Changes to Resume
              </button>
              <button onClick={()=>{setResult(null);setJd("");}}
                style={{padding:"12px 14px",background:"transparent",border:"1px solid #22222e",
                  color:"#475569",borderRadius:"10px",fontSize:"13px",cursor:"pointer"}}>New JD</button>
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
function UploadModal({onClose,onExtracted}){
  const [status,setStatus]=useState("idle");
  const [err,setErr]=useState("");
  const C=DARK;

  const handleFile=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    if(file.size>5*1024*1024){setErr("File too large. Max 5MB.");setStatus("error");return;}
    setStatus("loading");setErr("");
    try{
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      try{await fetch(`${BACKEND}/`,{signal:(AbortSignal.timeout?AbortSignal.timeout(8000):undefined)});}catch(e){}
      const resp=await fetch(`${BACKEND}/ai-job-match`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:2000,
          system:`Extract resume data and return ONLY valid JSON:\n{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","website":"","summary":"","education":[{"degree":"","school":"","year":"","gpa":""}],"experience":[{"role":"","company":"","duration":"","bullets":""}],"projects":[{"name":"","tech":"","description":"","link":""}],"skills":{"technical":"","languages":"","soft":"","tools":""},"certifications":"","achievements":"","customSections":[]}`,
          messages:[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:file.type||"application/pdf",data:b64}},
            {type:"text",text:"Extract all resume information. Return only the JSON."}
          ]}]
        }),
        signal:(AbortSignal.timeout?AbortSignal.timeout(45000):undefined)
      });
      if(!resp.ok){
        const d=await resp.json().catch(()=>({}));
        const msg=typeof d.error==="string"?d.error:JSON.stringify(d.error)||"";
        if(resp.status===429||msg.includes("quota")||msg.includes("limit")||msg==="AI_QUOTA_EXCEEDED")
          throw new Error("AI credits temporarily exhausted. Click 'Load Sample' to try the builder with demo data, or fill in your details manually.");
        throw new Error("Server error. Please try again in a moment.");
      }
      const data=await resp.json();
      if(data.error) throw new Error(typeof data.error==="string"?data.error:JSON.stringify(data.error));
      const text=data.content?.map(b=>b.text||"").join("")||"";
      const extracted=JSON.parse(text.replace(/```json|```/g,"").trim());
      extracted.customSections=extracted.customSections||[];
      setStatus("done");
      setTimeout(()=>{onExtracted(extracted);onClose();},600);
    }catch(e){setErr(e.message||"Could not extract data.");setStatus("error");}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"#16161f",border:"1px solid #22222e",borderRadius:"20px",
        width:"100%",maxWidth:"400px",padding:"32px 28px",animation:"slideIn 0.25s ease",textAlign:"center"}}>
        <div style={{fontSize:"44px",marginBottom:"14px"}}>
          {status==="done"?"✅":status==="error"?"❌":"📄"}
        </div>
        <div style={{fontWeight:"700",fontSize:"19px",color:"#f1f5f9",marginBottom:"8px"}}>
          {status==="idle"&&"Upload Your Resume"}
          {status==="loading"&&"AI Reading Resume..."}
          {status==="done"&&"Data Extracted!"}
          {status==="error"&&"Upload Failed"}
        </div>
        {status==="idle"&&<>
          <div style={{color:"#475569",fontSize:"13px",marginBottom:"22px",lineHeight:1.7}}>
            Upload your PDF or image — AI fills all fields automatically.
          </div>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFile} style={{display:"none"}} id="fu"/>
          <label htmlFor="fu" style={{display:"inline-block",padding:"13px 28px",background:"#22c55e",
            color:"#000",borderRadius:"10px",cursor:"pointer",fontWeight:"700",fontSize:"14px"}}>
            Choose File
          </label>
          <div style={{color:"#475569",fontSize:"11px",marginTop:"10px"}}>PDF, PNG, JPG · Max 5MB</div>
          <button onClick={onClose} style={{display:"block",width:"100%",marginTop:"14px",
            padding:"9px",background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:"12px"}}>
            Cancel
          </button>
        </>}
        {status==="loading"&&<>
          <div style={{width:"40px",height:"40px",border:"3px solid #22222e",borderTop:"3px solid #22c55e",
            borderRadius:"50%",margin:"16px auto",animation:"spin 0.8s linear infinite"}}/>
          <div style={{color:"#475569",fontSize:"12px"}}>Extracting data from your resume...</div>
        </>}
        {status==="done"&&<div style={{color:"#22c55e",fontSize:"13px",fontWeight:"600"}}>
          All fields filled successfully!
        </div>}
        {status==="error"&&<>
          <div style={{color:"#fca5a5",fontSize:"12px",margin:"12px 0",padding:"12px",
            background:"rgba(239,68,68,0.08)",borderRadius:"8px",lineHeight:1.6,textAlign:"left"}}>
            {err}
          </div>
          <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
            <button onClick={()=>setStatus("idle")} style={{padding:"9px 18px",background:"#22222e",
              border:"none",color:"#94a3b8",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>
              Try Again
            </button>
            <button onClick={()=>{onExtracted({...SAMPLE,customSections:[]});onClose();}}
              style={{padding:"9px 18px",background:"#22c55e",border:"none",
                color:"#000",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"700"}}>
              Load Sample Data
            </button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════
function AdminPanel({onClose}){
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [stats,setStats]=useState(null);
  const [payments,setPayments]=useState([]);
  const [loading,setLoading]=useState(false);
  const C=DARK;

  const check=(s)=>s.split("").reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0).toString(16);
  const login=()=>{
    if(!rateLimit("adm",5,300000)){setErr("Too many attempts. Locked 5 min.");return;}
    if(check(pw)===check("admin@resumemint")){setAuthed(true);load();}
    else setErr("Wrong password.");setPw("");
  };
  const load=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${BACKEND}/admin/stats`,{headers:{"x-admin-key":"resumemint_admin_2025"}});
      const d=await r.json();
      setStats(d);setPayments(d.recent||[]);
    }catch(e){setErr("Could not load: "+e.message);}
    setLoading(false);
  };

  if(!authed) return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:4000,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#16161f",border:"1px solid #22222e",borderRadius:"16px",
        padding:"32px",width:"320px",animation:"slideIn 0.25s ease"}}>
        <div style={{fontWeight:"700",fontSize:"18px",color:"#f1f5f9",textAlign:"center",marginBottom:"4px"}}>
          🛡️ Admin
        </div>
        <div style={{color:"#475569",fontSize:"12px",textAlign:"center",marginBottom:"22px"}}>ResumeMint Control Panel</div>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Password"
          style={{width:"100%",padding:"11px",background:"#0a0a0f",border:"1px solid #22222e",
            borderRadius:"8px",color:"#f1f5f9",fontSize:"13px",outline:"none",marginBottom:"8px"}}/>
        {err&&<div style={{color:"#fca5a5",fontSize:"12px",marginBottom:"10px"}}>{err}</div>}
        <button onClick={login} style={{width:"100%",padding:"12px",background:"#22c55e",
          color:"#000",border:"none",borderRadius:"8px",fontWeight:"700",cursor:"pointer"}}>Login</button>
        <button onClick={onClose} style={{width:"100%",marginTop:"7px",padding:"9px",
          background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:"12px"}}>Cancel</button>
      </div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:4000,overflowY:"auto"}}>
      <div style={{maxWidth:"900px",margin:"0 auto",padding:"28px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
          <div>
            <div style={{fontWeight:"700",fontSize:"22px",color:"#f1f5f9"}}>
              Resume<span style={{color:"#22c55e"}}>Mint</span> Admin
            </div>
            <div style={{color:"#475569",fontSize:"12px",marginTop:"2px"}}>Live data from MongoDB</div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={load} style={{padding:"8px 14px",background:"#22222e",border:"none",
              color:"#94a3b8",borderRadius:"8px",cursor:"pointer",fontSize:"12px"}}>↻ Refresh</button>
            <button onClick={onClose} style={{padding:"8px 14px",background:"transparent",
              border:"1px solid #22222e",color:"#475569",borderRadius:"8px",cursor:"pointer",fontSize:"12px"}}>✕ Close</button>
          </div>
        </div>
        {loading?<div style={{textAlign:"center",padding:"48px",color:"#475569"}}>Loading...</div>:<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"24px"}}>
            {[["Total Revenue",`₹${(stats?.revenue||0).toLocaleString()}`,"#22c55e"],
              ["Resumes Sold",(stats?.total||0).toString(),"#3b82f6"],
              ["Today Revenue",`₹${stats?.todayRevenue||0}`,"#f59e0b"],
              ["Today Sales",(stats?.today||0).toString(),"#a855f7"]
            ].map(([l,v,col],i)=>(
              <div key={i} style={{background:"#16161f",border:"1px solid #22222e",borderRadius:"12px",padding:"16px"}}>
                <div style={{fontSize:"11px",color:"#475569",marginBottom:"8px",textTransform:"uppercase"}}>{l}</div>
                <div style={{fontWeight:"700",fontSize:"24px",color:col}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#16161f",border:"1px solid #22222e",borderRadius:"12px",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #22222e",fontWeight:"600",
              color:"#f1f5f9",fontSize:"14px"}}>Recent Payments</div>
            {payments.length===0
              ?<div style={{padding:"40px",textAlign:"center",color:"#475569",fontSize:"13px"}}>
                No payments yet. They'll appear here after first purchase.
              </div>
              :payments.map((p,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1.5fr",
                  padding:"12px 18px",borderBottom:"1px solid #22222e",alignItems:"center"}}>
                  <div style={{fontSize:"13px",color:"#f1f5f9",fontWeight:"600"}}>{p.name||"—"}</div>
                  <div style={{fontSize:"12px",color:"#64748b"}}>{p.email||"—"}</div>
                  <div style={{fontSize:"13px",color:"#22c55e",fontWeight:"700"}}>₹9</div>
                  <div style={{fontSize:"12px",color:"#475569"}}>
                    {p.createdAt?new Date(p.createdAt).toLocaleDateString("en-IN"):"-"}
                  </div>
                </div>
              ))
            }
          </div>
        </>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// LANDING PAGE — Clean, trustworthy, conversion-focused
// ══════════════════════════════════════════════════════════
function Landing({onStart,onUpload,theme,setTheme,onAdmin}){
  const C=theme==="dark"?DARK:LIGHT;
  const s=(base,over)=>({...base,...over});

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`
        .feat-card:hover{border-color:${C.accent}66!important;transform:translateY(-2px);transition:all 0.2s;}
        .testi-card:hover{border-color:${C.accent}44!important;transition:all 0.2s;}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"14px 40px",borderBottom:`1px solid ${C.border}`,
        position:"sticky",top:0,background:`${C.bg}f0`,backdropFilter:"blur(16px)",
        zIndex:100,gap:"8px",flexWrap:"wrap"}}>
        <div style={{fontWeight:"800",fontSize:"20px",color:C.text,letterSpacing:"-0.3px"}}>
          Resume<span style={{color:C.accent}}>Mint</span>
          <span style={{fontSize:"10px",background:C.accentDim,color:C.accent,
            padding:"2px 7px",borderRadius:"4px",marginLeft:"8px",fontWeight:"600",letterSpacing:"0.5px"}}>INDIA</span>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}
            style={{padding:"7px 12px",background:C.card,border:`1px solid ${C.border}`,
              color:C.sub,borderRadius:"8px",fontSize:"14px",cursor:"pointer"}}>
            {theme==="dark"?"☀️":"🌙"}
          </button>
          <button onClick={onAdmin} style={{padding:"7px 14px",background:"transparent",
            border:`1px solid ${C.border}`,color:C.sub,borderRadius:"8px",
            fontSize:"12px",cursor:"pointer"}}>Admin</button>
          <button onClick={onStart} style={{padding:"9px 20px",background:C.accent,
            color:"#fff",border:"none",borderRadius:"9px",fontWeight:"700",
            fontSize:"13px",cursor:"pointer"}}>
            Build Resume →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{padding:"72px 40px 56px",maxWidth:"1100px",margin:"0 auto",animation:"fadeUp 0.5s ease"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"7px",
          background:C.accentDim,border:`1px solid ${C.accent}33`,
          padding:"5px 14px",borderRadius:"100px",marginBottom:"24px"}}>
          <span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.accent,
            display:"inline-block",animation:"pulse 1.8s infinite"}}/>
          <span style={{color:C.accent,fontSize:"12px",fontWeight:"600"}}>
            12,400+ resumes built · 87% shortlist rate
          </span>
        </div>

        <h1 style={{fontFamily:"'DM Serif Display',serif",fontWeight:"400",
          fontSize:"clamp(38px,5.5vw,68px)",lineHeight:1.1,marginBottom:"18px",color:C.text}}>
          The resume that gets you<br/>
          <span style={{color:C.accent}}>the interview.</span>
        </h1>

        <p style={{fontSize:"17px",color:C.sub,maxWidth:"520px",marginBottom:"32px",lineHeight:1.8}}>
          ATS-optimised templates, AI job-matching, and a 3-minute build time.
          Built for Indian students and freshers. <strong style={{color:C.text}}>Flat ₹9 to download.</strong>
        </p>

        <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"48px"}}>
          <button onClick={onStart} style={{padding:"14px 32px",background:C.accent,
            color:"#fff",border:"none",borderRadius:"10px",fontWeight:"700",
            fontSize:"15px",cursor:"pointer"}}>
            🚀 Build My Resume — ₹9
          </button>
          <button onClick={onUpload} style={{padding:"14px 22px",background:"transparent",
            color:C.text,border:`1px solid ${C.border}`,borderRadius:"10px",
            fontWeight:"600",fontSize:"14px",cursor:"pointer"}}>
            📄 Upload Existing Resume
          </button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",
          maxWidth:"640px"}}>
          {[["₹9","One-time flat price"],["3 min","Average build time"],["100%","ATS compatible"],["87%","Shortlist rate"]].map(([n,l],i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
              borderRadius:"12px",padding:"18px 14px",textAlign:"center"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"26px",color:C.accent}}>{n}</div>
              <div style={{color:C.muted,fontSize:"11px",marginTop:"4px"}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:"48px 40px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:"400",
            fontSize:"36px",color:C.text,marginBottom:"8px"}}>Built to get you hired</h2>
          <p style={{color:C.sub,fontSize:"14px"}}>Not just a template — a complete job-winning system</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
          {[
            ["🤖","AI Job-Match","Paste any job description → AI rewrites your summary, skills, and bullets to match perfectly."],
            ["📋","3 ATS Templates","Classic, Modern, and Executive — all pass ATS scanners used by Indian companies."],
            ["📄","Upload & Auto-fill","Upload your old resume (PDF/image) and AI extracts all data automatically."],
            ["🇮🇳","India-Focused","Optimized for TCS, Infosys, Wipro, product startups, and campus placements."],
            ["✏️","Full Customization","Edit every section. Add custom sections. Remove anything. Total control."],
            ["💳","Pay Only to Download","Build for free. Pay ₹9 only when you're happy. No account needed."],
          ].map(([icon,title,desc],i)=>(
            <div key={i} className="feat-card" style={{background:C.card,border:`1px solid ${C.border}`,
              borderRadius:"14px",padding:"22px"}}>
              <div style={{fontSize:"26px",marginBottom:"10px"}}>{icon}</div>
              <div style={{fontWeight:"700",fontSize:"14px",color:C.text,marginBottom:"7px"}}>{title}</div>
              <div style={{color:C.sub,fontSize:"12px",lineHeight:1.75}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:"48px 40px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:"400",
            fontSize:"36px",color:C.text,marginBottom:"8px"}}>How it works</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"}}>
          {[
            ["1","Fill Details","Enter your education, experience, projects and skills — takes 3 minutes."],
            ["2","Pick Template","Choose Classic ATS, Modern, or Executive design."],
            ["3","AI Optimize","Paste a job description and AI tailors your resume for that role."],
            ["4","Pay & Download","Pay ₹9 via UPI/card. Clean PDF downloads instantly."],
          ].map(([num,title,desc],i)=>(
            <div key={i} style={{textAlign:"center",padding:"22px 16px"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"50%",background:C.accentDim,
                border:`2px solid ${C.accent}44`,display:"flex",alignItems:"center",
                justifyContent:"center",margin:"0 auto 14px",
                fontFamily:"'DM Serif Display',serif",fontSize:"18px",color:C.accent}}>
                {num}
              </div>
              <div style={{fontWeight:"700",fontSize:"14px",color:C.text,marginBottom:"6px"}}>{title}</div>
              <div style={{color:C.sub,fontSize:"12px",lineHeight:1.7}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:"48px 40px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:"400",
            fontSize:"36px",color:C.text}}>Students who got shortlisted</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
          {[
            ["Priya Nair","NIT Calicut","Got calls from Infosys and TCS within a week. The AI job-match is brilliant — it matched my resume perfectly to each JD."],
            ["Rahul Verma","SRM University","Used the Executive template for a product startup and got a callback. Honestly didn't expect ₹9 to make this big a difference."],
            ["Sneha Reddy","BITS Pilani","3 interview calls in a week after I updated my resume here. The ATS tips actually work."],
          ].map(([name,college,text],i)=>(
            <div key={i} className="testi-card" style={{background:C.card,
              border:`1px solid ${C.border}`,borderRadius:"14px",padding:"22px"}}>
              <div style={{color:C.gold,fontSize:"14px",marginBottom:"10px"}}>★★★★★</div>
              <p style={{color:C.sub,fontSize:"13px",lineHeight:1.8,marginBottom:"16px"}}>"{text}"</p>
              <div style={{fontWeight:"700",color:C.text,fontSize:"13px"}}>{name}</div>
              <div style={{color:C.muted,fontSize:"11px",marginTop:"2px"}}>{college}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{padding:"56px 40px 72px"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,
          borderRadius:"20px",padding:"52px 40px",maxWidth:"560px",margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontWeight:"400",
            fontSize:"34px",color:C.text,marginBottom:"12px"}}>
            Your next job starts here.
          </h2>
          <p style={{color:C.sub,fontSize:"14px",lineHeight:1.8,marginBottom:"28px"}}>
            Build for free. Choose your template. Pay ₹9 only when you're ready to download.
          </p>
          <button onClick={onStart} style={{padding:"15px 40px",background:C.accent,
            color:"#fff",border:"none",borderRadius:"11px",fontWeight:"700",
            fontSize:"16px",cursor:"pointer"}}>
            Start Building — It's Free
          </button>
          <div style={{color:C.muted,fontSize:"11px",marginTop:"12px"}}>
            No account needed · ₹9 to download · Instant PDF
          </div>
        </div>
      </section>

      <footer style={{borderTop:`1px solid ${C.border}`,padding:"20px 40px",
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
        <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>
          Resume<span style={{color:C.accent}}>Mint</span>
        </div>
        <div style={{color:C.muted,fontSize:"11px"}}>
          © 2025 ResumeMint · Made in India 🇮🇳 · support@resumemint.in
        </div>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// BUILDER — Clean form + live preview
// ══════════════════════════════════════════════════════════
function Builder({onBack,theme,setTheme,initialForm}){
  const C=theme==="dark"?DARK:LIGHT;
  const [form,setForm]=useState({...EMPTY,...(initialForm||{}),customSections:initialForm?.customSections||[]});
  const [tplId,setTplId]=useState("classic");
  const [tab,setTab]=useState("personal");
  const [showAI,setShowAI]=useState(false);
  const [showPay,setShowPay]=useState(false);
  const [paid,setPaid]=useState(false);
  const [mView,setMView]=useState("form"); // "form"|"preview"

  const T=TEMPLATES.find(t=>t.id===tplId)||TEMPLATES[0];
  const Tmpl=tplId==="classic"?TemplateClassic:tplId==="modern"?TemplateModern:TemplateExecutive;

  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const updA=(s,i,k,v)=>setForm(p=>{const a=[...p[s]];a[i]={...a[i],[k]:v};return{...p,[s]:a};});
  const updS=(k,v)=>setForm(p=>({...p,skills:{...p.skills,[k]:v}}));
  const addR=(s,empty)=>setForm(p=>({...p,[s]:[...p[s],{...empty}]}));
  const delR=(s,i)=>setForm(p=>({...p,[s]:p[s].filter((_,j)=>j!==i)}));
  const addC=()=>setForm(p=>({...p,customSections:[...p.customSections,{title:"",content:""}]}));
  const updC=(i,k,v)=>setForm(p=>{const a=[...p.customSections];a[i]={...a[i],[k]:v};return{...p,customSections:a};});
  const delC=(i)=>setForm(p=>({...p,customSections:p.customSections.filter((_,j)=>j!==i)}));

  const downloadPDF=()=>{
    const s=document.createElement("style");
    s.id="rmp";
    s.textContent=`@media print{body>*:not(#resume-root){display:none!important;}#resume-root{display:block!important;}@page{margin:0;size:A4;}.no-print{display:none!important;}}`;
    document.head.appendChild(s);
    // wrap preview
    const preview=document.getElementById("rm-preview");
    if(preview){
      preview.id="resume-root";
      window.print();
      setTimeout(()=>{preview.id="rm-preview";s.remove();},1500);
    } else {
      window.print();
      setTimeout(()=>s.remove(),1500);
    }
  };

  // Shared input styles
  const inp={width:"100%",padding:"9px 11px",background:C.bg,
    border:`1px solid ${C.border}`,borderRadius:"8px",color:C.text,
    fontSize:"13px",outline:"none",marginBottom:"10px",lineHeight:1.5};
  const lbl={fontSize:"11px",color:C.sub,display:"block",marginBottom:"4px",
    fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.4px"};
  const card={background:C.card,border:`1px solid ${C.border}`,
    borderRadius:"12px",padding:"16px",marginBottom:"12px"};
  const rmbtn={padding:"4px 10px",background:"rgba(239,68,68,0.1)",
    border:"1px solid rgba(239,68,68,0.3)",color:"#ef4444",
    borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontWeight:"600"};
  const addbtn={width:"100%",padding:"10px",background:"transparent",
    border:`1px dashed ${C.border}`,color:C.accent,borderRadius:"9px",
    fontSize:"13px",fontWeight:"600",cursor:"pointer",marginTop:"2px"};

  const FORM_TABS=[
    {id:"personal",icon:"👤",label:"Personal"},
    {id:"education",icon:"🎓",label:"Education"},
    {id:"experience",icon:"💼",label:"Experience"},
    {id:"projects",icon:"🚀",label:"Projects"},
    {id:"skills",icon:"🛠",label:"Skills"},
    {id:"extra",icon:"➕",label:"Extra"},
  ];

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",
      background:C.bg,fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden"}}>

      {/* TOP BAR */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"10px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,
        flexShrink:0,gap:"8px",flexWrap:"wrap",zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={onBack} style={{padding:"6px 12px",background:"transparent",
            border:`1px solid ${C.border}`,color:C.sub,borderRadius:"7px",
            fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>← Back</button>
          <div style={{fontWeight:"800",fontSize:"16px",color:C.text}}>
            Resume<span style={{color:C.accent}}>Mint</span>
          </div>
        </div>
        <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          {/* Mobile toggle */}
          <div style={{display:"flex",border:`1px solid ${C.border}`,borderRadius:"7px",overflow:"hidden"}}>
            {[["form","✏️ Edit"],["preview","👁 Preview"]].map(([v,l])=>(
              <button key={v} onClick={()=>setMView(v)}
                style={{padding:"6px 12px",background:mView===v?C.accent:"transparent",
                  color:mView===v?"#fff":C.sub,border:"none",
                  fontSize:"12px",fontWeight:mView===v?"700":"400",cursor:"pointer"}}>
                {l}
              </button>
            ))}
          </div>
          {/* Template selector */}
          <div style={{display:"flex",border:`1px solid ${C.border}`,borderRadius:"7px",overflow:"hidden"}}>
            {TEMPLATES.map(t=>(
              <button key={t.id} onClick={()=>setTplId(t.id)} title={t.desc}
                style={{padding:"6px 11px",background:tplId===t.id?C.accentDim:"transparent",
                  border:"none",borderRight:`1px solid ${C.border}`,
                  color:tplId===t.id?C.accent:C.sub,fontSize:"11px",
                  fontWeight:tplId===t.id?"700":"400",cursor:"pointer",whiteSpace:"nowrap"}}>
                {t.icon} {t.name}
              </button>
            ))}
          </div>
          <button onClick={()=>setForm({...SAMPLE,customSections:[]})}
            style={{padding:"6px 10px",background:C.card,border:`1px solid ${C.border}`,
              color:C.sub,borderRadius:"7px",fontSize:"11px",cursor:"pointer"}}>
            Sample
          </button>
          <button onClick={()=>setShowAI(true)}
            style={{padding:"6px 12px",background:C.accentDim,border:`1px solid ${C.accent}44`,
              color:C.accent,borderRadius:"7px",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>
            🤖 AI Match
          </button>
          <button onClick={()=>paid?downloadPDF():setShowPay(true)}
            style={{padding:"8px 18px",background:C.accent,color:"#fff",border:"none",
              borderRadius:"8px",fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>
            {paid?"⬇ Download PDF":"💳 Pay ₹9"}
          </button>
        </div>
      </div>

      {/* SPLIT */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* FORM */}
        <div style={{
          width:"380px",minWidth:"300px",flexShrink:0,
          display:"flex",flexDirection:"column",
          borderRight:`1px solid ${C.border}`,background:C.surface,
          position:"relative",
          ...(mView==="preview"?{position:"absolute",visibility:"hidden"}:{})
        }}>
          {/* Tab bar */}
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,
            overflowX:"auto",flexShrink:0,background:C.surface}}>
            {FORM_TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{padding:"10px 13px",border:"none",cursor:"pointer",
                  background:tab===t.id?C.bg:C.surface,
                  color:tab===t.id?C.accent:C.sub,
                  fontSize:"11px",fontWeight:tab===t.id?"700":"500",
                  borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",
                  flexShrink:0,whiteSpace:"nowrap"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Form scrollable */}
          <div style={{flex:1,overflowY:"auto",padding:"14px"}}>

            {tab==="personal"&&<>
              <div style={card}>
                <div style={{fontWeight:"700",color:C.text,fontSize:"14px",marginBottom:"14px"}}>Contact Information</div>
                {[["Full Name","name","Arjun Sharma"],["Email","email","arjun@gmail.com"],
                  ["Phone","phone","+91 98765 43210"],["City, State","location","Bangalore, Karnataka"],
                  ["LinkedIn URL","linkedin","linkedin.com/in/..."],
                  ["GitHub URL","github","github.com/..."],
                  ["Portfolio / Website","website","yoursite.dev"]
                ].map(([l,k,ph])=>(
                  <div key={k}><label style={lbl}>{l}</label>
                    <input style={inp} placeholder={ph} value={form[k]||""} onChange={e=>upd(k,e.target.value)}/></div>
                ))}
              </div>
              <div style={card}>
                <label style={lbl}>Professional Summary</label>
                <textarea style={{...inp,height:"88px",resize:"vertical"}}
                  placeholder="3-4 sentences about your skills, experience, and what role you're targeting."
                  value={form.summary||""} onChange={e=>upd("summary",e.target.value)}/>
              </div>
            </>}

            {tab==="education"&&<>
              {form.education.map((e,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>Education {form.education.length>1?`#${i+1}`:""}</div>
                    {form.education.length>1&&<button onClick={()=>delR("education",i)} style={rmbtn}>✕ Remove</button>}
                  </div>
                  {[["Degree / Course","degree","B.Tech Computer Science"],
                    ["College / University","school","NIT Trichy"],
                    ["Year","year","2021–2025"],
                    ["CGPA / Percentage","gpa","8.5 CGPA"]
                  ].map(([l,k,ph])=>(
                    <div key={k}><label style={lbl}>{l}</label>
                      <input style={inp} placeholder={ph} value={e[k]||""} onChange={ev=>updA("education",i,k,ev.target.value)}/></div>
                  ))}
                </div>
              ))}
              <button onClick={()=>addR("education",{degree:"",school:"",year:"",gpa:""})} style={addbtn}>+ Add Education</button>
            </>}

            {tab==="experience"&&<>
              {form.experience.map((e,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>Experience {form.experience.length>1?`#${i+1}`:""}</div>
                    {form.experience.length>1&&<button onClick={()=>delR("experience",i)} style={rmbtn}>✕ Remove</button>}
                  </div>
                  {[["Job Title","role","Software Developer Intern"],
                    ["Company","company","Razorpay, Bangalore"],
                    ["Duration","duration","Jun 2024 – Aug 2024"]
                  ].map(([l,k,ph])=>(
                    <div key={k}><label style={lbl}>{l}</label>
                      <input style={inp} placeholder={ph} value={e[k]||""} onChange={ev=>updA("experience",i,k,ev.target.value)}/></div>
                  ))}
                  <label style={lbl}>Key Achievements (one per line — use numbers)</label>
                  <textarea style={{...inp,height:"100px",resize:"vertical"}}
                    placeholder={"Built X reducing time by 40%\nProcessed 10k+ events/day\nImproved test coverage to 90%"}
                    value={e.bullets||""} onChange={ev=>updA("experience",i,"bullets",ev.target.value)}/>
                </div>
              ))}
              <button onClick={()=>addR("experience",{role:"",company:"",duration:"",bullets:""})} style={addbtn}>+ Add Experience</button>
            </>}

            {tab==="projects"&&<>
              {form.projects.map((p,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>Project {form.projects.length>1?`#${i+1}`:""}</div>
                    {form.projects.length>1&&<button onClick={()=>delR("projects",i)} style={rmbtn}>✕ Remove</button>}
                  </div>
                  {[["Project Name","name","ATS Resume Builder"],
                    ["Tech Stack","tech","React, Node.js, MongoDB"],
                    ["Link / GitHub","link","github.com/..."]
                  ].map(([l,k,ph])=>(
                    <div key={k}><label style={lbl}>{l}</label>
                      <input style={inp} placeholder={ph} value={p[k]||""} onChange={ev=>updA("projects",i,k,ev.target.value)}/></div>
                  ))}
                  <label style={lbl}>Description & Impact</label>
                  <textarea style={{...inp,height:"65px",resize:"vertical"}}
                    placeholder="Built for X users. Achieved Y. Used Z."
                    value={p.description||""} onChange={ev=>updA("projects",i,"description",ev.target.value)}/>
                </div>
              ))}
              <button onClick={()=>addR("projects",{name:"",tech:"",description:"",link:""})} style={addbtn}>+ Add Project</button>
            </>}

            {tab==="skills"&&<div style={card}>
              <div style={{fontWeight:"700",color:C.text,fontSize:"14px",marginBottom:"14px"}}>Skills & Qualifications</div>
              {[["Technical Skills","technical","React, Node.js, MongoDB, Git, Docker, AWS"],
                ["Programming Languages","languages","Java, JavaScript, Python, C++, SQL"],
                ["Tools & Platforms","tools","VS Code, Postman, Figma, Jira, Linux"],
                ["Soft Skills","soft","Leadership, Communication, Problem Solving"]
              ].map(([l,k,ph])=>(
                <div key={k}><label style={lbl}>{l}</label>
                  <input style={inp} placeholder={ph} value={form.skills[k]||""} onChange={e=>updS(k,e.target.value)}/></div>
              ))}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"14px",marginTop:"4px"}}>
                <label style={lbl}>Certifications (one per line)</label>
                <textarea style={{...inp,height:"70px",resize:"vertical"}}
                  placeholder={"AWS Cloud Practitioner (2024)\nGoogle Analytics Certificate"}
                  value={form.certifications||""} onChange={e=>upd("certifications",e.target.value)}/>
                <label style={lbl}>Achievements / Activities</label>
                <textarea style={{...inp,height:"62px",resize:"vertical"}}
                  placeholder={"Winner — Hackathon 2024\nGoogle DSC Lead"}
                  value={form.achievements||""} onChange={e=>upd("achievements",e.target.value)}/>
              </div>
            </div>}

            {tab==="extra"&&<>
              <div style={{...card,marginBottom:"14px",background:C.accentDim,
                border:`1px solid ${C.accent}33`,color:C.sub,fontSize:"12px",lineHeight:1.7}}>
                💡 Add custom sections: Volunteer Work, Languages, Research, Publications, Hobbies, etc.
              </div>
              {form.customSections.map((sec,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"13px"}}>Custom Section {i+1}</div>
                    <button onClick={()=>delC(i)} style={rmbtn}>✕ Remove</button>
                  </div>
                  <label style={lbl}>Section Title</label>
                  <input style={inp} placeholder="e.g. Volunteer Work" value={sec.title||""} onChange={e=>updC(i,"title",e.target.value)}/>
                  <label style={lbl}>Content (one item per line)</label>
                  <textarea style={{...inp,height:"88px",resize:"vertical"}}
                    placeholder={"Volunteer Teacher — Teach For India (2023)\nFluent in English, Hindi, Kannada"}
                    value={sec.content||""} onChange={e=>updC(i,"content",e.target.value)}/>
                </div>
              ))}
              <button onClick={addC} style={{...addbtn,border:`1px dashed ${C.accent}`,color:C.accent}}>
                + Add Custom Section
              </button>
            </>}

          </div>
        </div>

        {/* PREVIEW */}
        <div style={{flex:1,display:"flex",flexDirection:"column",
          background:theme==="dark"?"#080810":"#dde3ed",overflow:"hidden",
          ...(mView==="form"?{position:"absolute",visibility:"hidden"}:{})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"9px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{fontSize:"13px",fontWeight:"600",color:C.text}}>
              Live Preview · {T.name}
            </div>
            <div style={{fontSize:"11px",color:paid?C.accent:C.muted,fontWeight:paid?"700":"400"}}>
              {paid?"✅ Unlocked":"🔒 Preview (watermarked)"}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
            <div id="rm-preview" style={{background:"#fff",borderRadius:"6px",overflow:"hidden",
              boxShadow:"0 4px 32px rgba(0,0,0,0.2)",maxWidth:"760px",margin:"0 auto"}}>
              <Tmpl form={form} watermark={!paid}/>
            </div>
            {!paid&&(
              <div style={{maxWidth:"760px",margin:"14px auto 0",background:C.card,
                border:`1px solid ${C.border}`,borderRadius:"12px",
                padding:"18px",textAlign:"center"}}>
                <div style={{fontWeight:"700",color:C.text,marginBottom:"5px",fontSize:"15px"}}>
                  Ready to download your clean PDF?
                </div>
                <div style={{color:C.sub,fontSize:"12px",marginBottom:"14px"}}>
                  Remove watermark · Perfect print quality · Just ₹9
                </div>
                <button onClick={()=>setShowPay(true)}
                  style={{padding:"11px 28px",background:C.accent,color:"#fff",
                    border:"none",borderRadius:"9px",fontWeight:"700",fontSize:"14px",cursor:"pointer"}}>
                  Pay ₹9 & Download →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: always show both */}
        <style>{`@media(min-width:769px){
          .form-panel-d{position:relative!important;visibility:visible!important;}
          .prev-panel-d{position:relative!important;visibility:visible!important;}
        }`}</style>
      </div>

      {showAI&&<AIModal onClose={()=>setShowAI(false)} form={form}
        onApply={f=>{setForm(f);setShowAI(false);}}/>}
      {showPay&&<PaymentModal form={form} onClose={()=>setShowPay(false)}
        onSuccess={()=>{setPaid(true);setShowPay(false);setTimeout(()=>{setMView("preview");setTimeout(downloadPDF,500);},300);}}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════
export default function App(){
  const [page,setPage]=useState("landing");
  const [theme,setTheme]=useState("dark");
  const [showAdmin,setShowAdmin]=useState(false);
  const [showUpload,setShowUpload]=useState(false);
  const [seedForm,setSeedForm]=useState(null);

  return(<>
    <style>{GS}</style>
    {page==="landing"&&(
      <Landing
        theme={theme} setTheme={setTheme}
        onStart={()=>{setSeedForm(null);setPage("builder");}}
        onUpload={()=>setShowUpload(true)}
        onAdmin={()=>setShowAdmin(true)}
      />
    )}
    {page==="builder"&&(
      <Builder
        theme={theme} setTheme={setTheme}
        initialForm={seedForm||EMPTY}
        onBack={()=>setPage("landing")}
      />
    )}
    {showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}
    {showUpload&&<UploadModal
      onClose={()=>setShowUpload(false)}
      onExtracted={f=>{setSeedForm(f);setShowUpload(false);setPage("builder");}}
    />}
  </>);
}

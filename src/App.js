// ResumeMint v5 — All bugs fixed, clean UI, Overleaf-style Classic template
import { useState, useEffect, useRef } from "react";

const BACKEND = "https://resumemint-backend.onrender.com";
const getB = () => BACKEND;

const DARK = {
  bg:"#07070f", surface:"#0e0e1a", card:"#13131f", border:"#1c1c2e",
  accent:"#00e5a0", accentDim:"#00e5a015", gold:"#f5c842", red:"#ff4560", blue:"#3b82f6",
  text:"#e2e2f0", muted:"#5a5a75", white:"#ffffff",
};
const LIGHT = {
  bg:"#f4f6fa", surface:"#ffffff", card:"#ffffff", border:"#e2e8f0",
  accent:"#0ea96e", accentDim:"#0ea96e15", gold:"#d97706", red:"#dc2626", blue:"#2563eb",
  text:"#1a1a2e", muted:"#64748b", white:"#1a1a2e",
};

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#2a2a3e;border-radius:4px;}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes modalIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  @keyframes glow{0%,100%{box-shadow:0 0 8px #00e5a044}50%{box-shadow:0 0 24px #00e5a088}}
  @media(max-width:700px){
    .builder-layout{flex-direction:column !important;}
    .builder-form{width:100% !important;max-height:none !important;border-right:none !important;}
    .builder-preview{display:none;}
    .builder-preview.show{display:block !important;flex:1;}
    .landing-feat{grid-template-columns:1fr 1fr !important;}
    .landing-testi{grid-template-columns:1fr !important;}
    .stat-grid{grid-template-columns:1fr 1fr !important;}
    .admin-layout{flex-direction:column !important;}
    .admin-sidebar{width:100% !important;flex-direction:row !important;flex-wrap:wrap;padding:12px !important;}
    .metric-grid{grid-template-columns:1fr 1fr !important;}
  }
`;

const Security = {
  _a:{},
  sanitize:(s)=>String(s).replace(/<script[^>]*>.*?<\/script>/gi,"").trim().slice(0,2000),
  rateLimit:(key,max,win)=>{
    const now=Date.now();
    if(!Security._a[key])Security._a[key]=[];
    Security._a[key]=Security._a[key].filter(t=>now-t<win);
    if(Security._a[key].length>=max)return false;
    Security._a[key].push(now);return true;
  },
  hash:(s)=>s.split("").reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0).toString(16),
};

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
  location:"Bangalore, Karnataka",linkedin:"linkedin.com/in/arjunsharma",github:"github.com/arjunsharma",website:"arjunsharma.dev",
  summary:"Final year B.Tech CSE student with 1+ year internship experience in full-stack development. Built 3 production projects with 500+ active users. Strong in React, Node.js and AWS. Seeking SDE role at product-based company.",
  education:[{degree:"B.Tech Computer Science Engineering",school:"RV College of Engineering, Bangalore",year:"2021–2025",gpa:"8.7 CGPA"}],
  experience:[{role:"Software Development Intern",company:"Razorpay, Bangalore",duration:"Jun 2024 – Aug 2024",bullets:"Built payment analytics dashboard reducing reporting time by 40%\nIntegrated webhook system processing 10k+ events/day with 99.9% uptime\nWrote unit tests achieving 90% coverage using Jest & React Testing Library\nCollaborated with 8-member team using Agile/Scrum methodology"}],
  projects:[
    {name:"ResumeMint — ATS Resume Builder",tech:"React, Node.js, MongoDB, Razorpay",description:"SaaS tool for Indian job seekers. 500+ resumes downloaded in first month.",link:"resumemint.in"},
    {name:"Smart Attendance System",tech:"Python, OpenCV, Flask, MySQL",description:"Face recognition attendance. 95% accuracy. Used by 400+ students.",link:"github.com/arjunsharma"},
  ],
  skills:{technical:"React.js, Node.js, Express, MongoDB, MySQL, REST APIs, Git, Docker, AWS EC2/S3",languages:"JavaScript, Python, Java, C++, SQL",soft:"Problem Solving, Team Leadership, Communication",tools:"VS Code, Postman, Figma, Jira, Linux"},
  certifications:"AWS Certified Cloud Practitioner — Amazon (2024)\nGoogle Data Analytics Professional Certificate (2023)\nHackerRank Gold Badge — Problem Solving",
  achievements:"Academic Rank 3 in Dept. (2023)\nWinner — Internal Hackathon 2024\nGoogle DSC Lead — RVCE Chapter",
  customSections:[],
};

// ── WATERMARK ─────────────────────────────────────────────
function Watermark(){
  return(
    <div style={{position:"absolute",inset:0,zIndex:10,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.3)"}}>
      <div style={{transform:"rotate(-30deg)",textAlign:"center",userSelect:"none"}}>
        <div style={{fontSize:"22px",fontWeight:"900",color:"#00000022",letterSpacing:"4px",fontFamily:"Outfit,sans-serif"}}>PREVIEW ONLY</div>
        <div style={{fontSize:"13px",color:"#00000018",letterSpacing:"2px"}}>Pay ₹9 to Download</div>
      </div>
    </div>
  );
}

// ── CLASSIC ATS TEMPLATE (Overleaf-style clean black/white) ───
function TemplateClassic({form,watermark}){
  const S={
    wrap:{fontFamily:"'Times New Roman',Georgia,serif",fontSize:"10.5pt",color:"#000",background:"#fff",padding:"0.7in 0.7in",lineHeight:1.5,maxWidth:"700px",margin:"0 auto",position:"relative"},
    name:{fontSize:"20pt",fontWeight:"700",color:"#000",textAlign:"center",letterSpacing:"1px",marginBottom:"2px"},
    contact:{fontSize:"9pt",color:"#333",display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center",marginBottom:"8px"},
    divider:{borderTop:"1.2pt solid #000",margin:"6px 0 5px"},
    sh:{fontSize:"11pt",fontWeight:"700",color:"#000",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"4px",marginTop:"10px",borderBottom:"0.5pt solid #000",paddingBottom:"2px"},
    row:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},
    sub:{color:"#333",fontSize:"9.5pt"},
    ul:{marginLeft:"16px",listStyleType:"disc",marginTop:"2px"},
    li:{marginBottom:"1px",fontSize:"10pt"},
  };
  return(
    <div style={{position:"relative"}}>
      {watermark&&<Watermark/>}
      <div style={S.wrap}>
        <div style={S.name}>{form.name||"Your Name"}</div>
        <div style={S.contact}>
          {form.location&&<span>{form.location}</span>}
          {form.email&&<span>| {form.email}</span>}
          {form.phone&&<span>| {form.phone}</span>}
          {form.linkedin&&<span>| {form.linkedin}</span>}
          {form.github&&<span>| {form.github}</span>}
        </div>
        <div style={S.divider}/>

        {form.summary&&<>
          <div style={S.sh}>Professional Summary</div>
          <p style={{fontSize:"10pt",lineHeight:1.6,marginBottom:"4px"}}>{form.summary}</p>
        </>}

        {form.education?.[0]?.degree&&<>
          <div style={S.sh}>Education</div>
          {form.education.map((e,i)=>(
            <div key={i} style={{...S.row,marginBottom:"5px"}}>
              <div>
                <strong style={{fontSize:"10.5pt"}}>{e.degree}</strong>
                <div style={S.sub}>{e.school}</div>
              </div>
              <div style={{textAlign:"right",fontSize:"9.5pt",color:"#333"}}>
                <div>{e.year}</div>
                {e.gpa&&<div>{e.gpa}</div>}
              </div>
            </div>
          ))}
        </>}

        {form.experience?.[0]?.role&&<>
          <div style={S.sh}>Work Experience</div>
          {form.experience.map((e,i)=>(
            <div key={i} style={{marginBottom:"8px"}}>
              <div style={S.row}>
                <strong style={{fontSize:"10.5pt"}}>{e.role}{e.company&&` — ${e.company}`}</strong>
                <span style={S.sub}>{e.duration}</span>
              </div>
              <ul style={S.ul}>
                {e.bullets?.split("\n").filter(Boolean).map((b,j)=><li key={j} style={S.li}>{b}</li>)}
              </ul>
            </div>
          ))}
        </>}

        {form.projects?.[0]?.name&&<>
          <div style={S.sh}>Projects</div>
          {form.projects.map((p,i)=>(
            <div key={i} style={{marginBottom:"6px"}}>
              <div style={S.row}>
                <strong style={{fontSize:"10.5pt"}}>{p.name}</strong>
                {p.link&&<span style={S.sub}>{p.link}</span>}
              </div>
              {p.tech&&<div style={{...S.sub,fontStyle:"italic",marginBottom:"1px"}}>{p.tech}</div>}
              <div style={{fontSize:"10pt"}}>{p.description}</div>
            </div>
          ))}
        </>}

        {(form.skills?.technical||form.skills?.languages)&&<>
          <div style={S.sh}>Technical Skills</div>
          {form.skills?.technical&&<div style={{fontSize:"10pt",marginBottom:"2px"}}><strong>Core Skills: </strong>{form.skills.technical}</div>}
          {form.skills?.languages&&<div style={{fontSize:"10pt",marginBottom:"2px"}}><strong>Languages: </strong>{form.skills.languages}</div>}
          {form.skills?.tools&&<div style={{fontSize:"10pt",marginBottom:"2px"}}><strong>Tools: </strong>{form.skills.tools}</div>}
        </>}

        {form.certifications&&<>
          <div style={S.sh}>Certifications</div>
          <ul style={S.ul}>{form.certifications.split("\n").filter(Boolean).map((c,i)=><li key={i} style={S.li}>{c}</li>)}</ul>
        </>}

        {form.achievements&&<>
          <div style={S.sh}>Achievements</div>
          <ul style={S.ul}>{form.achievements.split("\n").filter(Boolean).map((a,i)=><li key={i} style={S.li}>{a}</li>)}</ul>
        </>}

        {form.customSections?.map((sec,i)=>sec.title&&sec.content?(
          <div key={i}>
            <div style={S.sh}>{sec.title}</div>
            <ul style={S.ul}>{sec.content.split("\n").filter(Boolean).map((l,j)=><li key={j} style={S.li}>{l}</li>)}</ul>
          </div>
        ):null)}
      </div>
    </div>
  );
}

function TemplateModern({form,watermark,theme}){
  const T=theme==="dark"?{bg:"#0d1117",sb:"#161b22",text:"#c9d1d9",head:"#58a6ff",acc:"#3fb950",name:"#f0f6fc",sub:"#8b949e",line:"#21262d"}:{bg:"#ffffff",sb:"#f0f4f8",text:"#2d3748",head:"#2563eb",acc:"#059669",name:"#0f172a",sub:"#718096",line:"#e2e8f0"};
  return(<div style={{position:"relative"}}>{watermark&&<Watermark/>}
    <div style={{display:"flex",fontFamily:"Arial,sans-serif",fontSize:"10.5px",background:T.bg,color:T.text,maxWidth:"700px",margin:"0 auto",lineHeight:1.6,minHeight:"900px"}}>
      <div style={{width:"210px",background:T.sb,padding:"28px 16px",flexShrink:0}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontSize:"17px",fontWeight:"800",color:T.name,marginBottom:"4px"}}>{form.name||"Your Name"}</div>
        <div style={{fontSize:"9px",color:T.head,fontWeight:"600",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"14px"}}>{form.experience?.[0]?.role||"Software Engineer"}</div>
        <div style={{borderTop:`1px solid ${T.line}`,paddingTop:"10px",marginBottom:"10px"}}>
          <div style={{fontSize:"9px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"7px"}}>Contact</div>
          {[[form.email,"✉"],[form.phone,"✆"],[form.location,"⊙"],[form.linkedin,"in"],[form.github,"gh"]].filter(([v])=>v).map(([v,icon],i)=><div key={i} style={{fontSize:"9px",marginBottom:"5px",wordBreak:"break-all",color:T.text}}>{icon} {v}</div>)}
        </div>
        {form.skills?.technical&&<div style={{borderTop:`1px solid ${T.line}`,paddingTop:"10px",marginBottom:"10px"}}>
          <div style={{fontSize:"9px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"7px"}}>Skills</div>
          {form.skills.technical.split(",").map((s,i)=><span key={i} style={{display:"inline-block",fontSize:"8.5px",padding:"2px 6px",background:`${T.head}22`,color:T.head,borderRadius:"3px",margin:"2px"}}>{s.trim()}</span>)}
        </div>}
        {form.certifications&&<div style={{borderTop:`1px solid ${T.line}`,paddingTop:"10px"}}>
          <div style={{fontSize:"9px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"7px"}}>Certifications</div>
          {form.certifications.split("\n").filter(Boolean).map((c,i)=><div key={i} style={{fontSize:"9px",marginBottom:"4px",color:T.text}}>• {c}</div>)}
        </div>}
      </div>
      <div style={{flex:1,padding:"28px 22px"}}>
        {form.summary&&<div style={{marginBottom:"14px"}}><div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Summary</div><p style={{fontSize:"10.5px",lineHeight:1.7}}>{form.summary}</p></div>}
        {form.experience?.[0]?.role&&<div style={{marginBottom:"14px"}}><div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"7px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Experience</div>{form.experience.map((e,i)=><div key={i} style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong style={{fontSize:"11px",color:T.name}}>{e.role}</strong><span style={{fontSize:"9.5px",color:T.sub}}>{e.duration}</span></div><div style={{color:T.head,fontSize:"10px",marginBottom:"3px"}}>{e.company}</div><ul style={{marginLeft:"14px"}}>{e.bullets?.split("\n").filter(Boolean).map((b,j)=><li key={j} style={{marginBottom:"2px",fontSize:"10.5px"}}>{b}</li>)}</ul></div>)}</div>}
        {form.education?.[0]?.degree&&<div style={{marginBottom:"14px"}}><div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"7px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Education</div>{form.education.map((e,i)=><div key={i} style={{marginBottom:"6px",display:"flex",justifyContent:"space-between"}}><div><strong style={{fontSize:"11px"}}>{e.degree}</strong><div style={{color:T.sub,fontSize:"10px"}}>{e.school}</div></div><div style={{textAlign:"right",fontSize:"10px",color:T.sub}}>{e.year}<br/>{e.gpa}</div></div>)}</div>}
        {form.projects?.[0]?.name&&<div><div style={{fontSize:"10px",fontWeight:"700",color:T.acc,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"7px",borderBottom:`2px solid ${T.acc}`,paddingBottom:"3px"}}>Projects</div>{form.projects.map((p,i)=><div key={i} style={{marginBottom:"8px"}}><strong style={{fontSize:"11px"}}>{p.name}</strong>{p.tech&&<span style={{color:T.sub,fontSize:"9.5px"}}> | {p.tech}</span>}<div style={{fontSize:"10.5px"}}>{p.description}</div></div>)}</div>}
      </div>
    </div>
  </div>);
}

function TemplateExecutive({form,watermark,theme}){
  const T=theme==="dark"?{bg:"#0c0c14",text:"#dde1f0",head:"#c8a96e",name:"#ffffff",sub:"#7070a0",line:"#1e1e30"}:{bg:"#fefefe",text:"#2c2c3a",head:"#8b6914",name:"#0a0a1a",sub:"#8899aa",line:"#ddd"};
  const SH=({title})=>(<div style={{display:"flex",alignItems:"center",gap:"12px",margin:"14px 0 8px"}}><div style={{height:"1px",background:T.head,width:"24px"}}/><div style={{fontFamily:"Outfit,sans-serif",fontSize:"10px",fontWeight:"700",color:T.head,textTransform:"uppercase",letterSpacing:"2px"}}>{title}</div><div style={{flex:1,height:"1px",background:T.line}}/></div>);
  return(<div style={{position:"relative"}}>{watermark&&<Watermark/>}
    <div style={{fontFamily:"Georgia,serif",fontSize:"10.5px",background:T.bg,color:T.text,padding:"36px 44px",maxWidth:"700px",margin:"0 auto",lineHeight:1.7}}>
      <div style={{textAlign:"center",marginBottom:"18px",paddingBottom:"14px",borderBottom:`3px double ${T.head}`}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontSize:"26px",fontWeight:"900",color:T.name,letterSpacing:"3px",textTransform:"uppercase",marginBottom:"5px"}}>{form.name||"Your Name"}</div>
        <div style={{fontSize:"9px",letterSpacing:"3px",color:T.head,textTransform:"uppercase",marginBottom:"7px"}}>{form.experience?.[0]?.role||"Software Engineer"}</div>
        <div style={{fontSize:"9.5px",color:T.sub,display:"flex",justifyContent:"center",gap:"16px",flexWrap:"wrap"}}>{[form.email,form.phone,form.location,form.linkedin].filter(Boolean).map((v,i)=><span key={i}>{v}</span>)}</div>
      </div>
      {form.summary&&<div style={{textAlign:"center",marginBottom:"14px"}}><p style={{fontStyle:"italic",color:T.sub,maxWidth:"560px",margin:"0 auto",fontSize:"11px",lineHeight:1.8}}>{form.summary}</p></div>}
      {form.education?.[0]?.degree&&<><SH title="Education"/>{form.education.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><div><strong>{e.degree}</strong><div style={{color:T.sub,fontSize:"10px"}}>{e.school}</div></div><div style={{textAlign:"right",color:T.sub,fontSize:"10px"}}>{e.year}<br/>{e.gpa}</div></div>)}</>}
      {form.experience?.[0]?.role&&<><SH title="Professional Experience"/>{form.experience.map((e,i)=><div key={i} style={{marginBottom:"12px"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong style={{fontSize:"12px"}}>{e.role}</strong><span style={{color:T.sub,fontSize:"10px"}}>{e.duration}</span></div><div style={{color:T.head,fontSize:"10px",fontStyle:"italic",marginBottom:"3px"}}>{e.company}</div><ul style={{marginLeft:"16px"}}>{e.bullets?.split("\n").filter(Boolean).map((b,j)=><li key={j} style={{marginBottom:"2px"}}>{b}</li>)}</ul></div>)}</>}
      {form.projects?.[0]?.name&&<><SH title="Projects"/>{form.projects.map((p,i)=><div key={i} style={{marginBottom:"8px"}}><strong>{p.name}</strong>{p.tech&&<span style={{color:T.sub,fontSize:"10px",fontStyle:"italic"}}> · {p.tech}</span>}<div style={{fontSize:"10.5px"}}>{p.description}</div></div>)}</>}
      {form.skills?.technical&&<><SH title="Technical Expertise"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>{[["Core",form.skills.technical],["Languages",form.skills.languages],["Tools",form.skills.tools],["Soft Skills",form.skills.soft]].filter(([,v])=>v).map(([k,v],i)=><div key={i} style={{fontSize:"10px"}}><strong>{k}: </strong><span style={{color:T.sub}}>{v}</span></div>)}</div></>}
      {form.certifications&&<><SH title="Certifications & Honours"/><ul style={{marginLeft:"16px"}}>{form.certifications.split("\n").filter(Boolean).map((c,i)=><li key={i} style={{fontSize:"10px",marginBottom:"2px"}}>{c}</li>)}</ul></>}
    </div>
  </div>);
}

const TEMPLATES=[
  {id:"classic",name:"Classic ATS",icon:"📄",component:TemplateClassic},
  {id:"modern",name:"Modern Sidebar",icon:"🎨",component:TemplateModern},
  {id:"executive",name:"Executive",icon:"👔",component:TemplateExecutive},
];

// ── PAYMENT MODAL ─────────────────────────────────────────
function PaymentModal({onClose,onSuccess,form}){
  const [step,setStep]=useState("pay");
  const [err,setErr]=useState("");
  const C=DARK;

  const startPay=async()=>{
    if(!Security.rateLimit("pay",3,300000)){setErr("Too many attempts. Wait 5 min.");return;}
    setStep("loading");setErr("");
    try{
      const r=await fetch(`${getB()}/create-order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:900})});
      if(!r.ok)throw new Error("Backend error "+r.status);
      const order=await r.json();
      if(!window.Razorpay)throw new Error("Razorpay not loaded. Refresh and try again.");
      const rzp=new window.Razorpay({
        key:"rzp_test_SPK3M2HkvjRH0C",
        amount:900,currency:"INR",
        name:"ResumeMint",description:"ATS Resume — ₹9",
        order_id:order.id,
        prefill:{name:form.name||"",email:form.email||"",contact:form.phone||""},
        theme:{color:"#00e5a0"},
        modal:{ondismiss:()=>setStep("pay")},
        handler:async(resp)=>{
          setStep("verifying");
          try{
            const vr=await fetch(`${getB()}/verify-payment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({razorpay_order_id:resp.razorpay_order_id,razorpay_payment_id:resp.razorpay_payment_id,razorpay_signature:resp.razorpay_signature,name:form.name,email:form.email})});
            const vd=await vr.json();
            if(vd.success){setStep("success");setTimeout(()=>onSuccess({token:vd.token}),1500);}
            else{setErr("Payment verification failed. Contact support.");setStep("error");}
          }catch{setErr("Verification error. Email support with your payment ID.");setStep("error");}
        }
      });
      rzp.open();setStep("open");
    }catch(e){setErr(e.message||"Cannot connect. Check internet.");setStep("error");}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"400px",animation:"modalIn 0.3s ease"}}>
        {(step==="pay"||step==="error")&&<>
          <div style={{padding:"22px 24px 16px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontFamily:"Outfit,sans-serif",fontSize:"20px",fontWeight:"800",color:"#fff"}}>🔐 Secure Checkout</div>
            <div style={{color:C.muted,fontSize:"12px"}}>Powered by Razorpay</div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <div style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:"12px",padding:"18px",textAlign:"center",marginBottom:"18px"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:"40px",fontWeight:"900",color:C.accent}}>₹9</div>
              <div style={{color:C.muted,fontSize:"11px",marginTop:"5px"}}>One resume • Full PDF • No subscription</div>
              <div style={{display:"flex",justifyContent:"center",gap:"10px",marginTop:"8px",fontSize:"11px",color:C.muted}}>
                <span>✅ No watermark</span><span>✅ Instant</span><span>✅ Clean PDF</span>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
              {["UPI","GPay","PhonePe","Paytm","Cards"].map(m=><span key={m} style={{fontSize:"10px",padding:"3px 8px",background:C.border,color:C.muted,borderRadius:"5px"}}>{m}</span>)}
            </div>
            {err&&<div style={{color:C.red,fontSize:"12px",marginBottom:"12px",padding:"9px 12px",background:`${C.red}18`,borderRadius:"8px"}}>⚠ {err}</div>}
            <div style={{fontSize:"10px",color:C.muted,marginBottom:"14px"}}>🔒 256-bit SSL • Razorpay PCI DSS • No card data stored</div>
            <button onClick={startPay} style={{width:"100%",padding:"13px",background:C.accent,color:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"15px",cursor:"pointer"}}>Open Razorpay →</button>
            <button onClick={onClose} style={{width:"100%",marginTop:"6px",padding:"9px",background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:"12px"}}>Cancel</button>
          </div>
        </>}
        {step==="loading"&&<div style={{padding:"48px",textAlign:"center"}}><div style={{width:"44px",height:"44px",border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 0.8s linear infinite"}}/><div style={{color:"#fff",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"17px"}}>Creating order...</div></div>}
        {step==="open"&&<div style={{padding:"48px",textAlign:"center"}}><div style={{fontSize:"40px",marginBottom:"14px"}}>💳</div><div style={{color:"#fff",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"17px",marginBottom:"8px"}}>Complete payment in popup</div><div style={{color:C.muted,fontSize:"12px"}}>Don't close this tab.</div></div>}
        {step==="verifying"&&<div style={{padding:"48px",textAlign:"center"}}><div style={{width:"44px",height:"44px",border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 0.8s linear infinite"}}/><div style={{color:"#fff",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"17px"}}>Verifying payment...</div></div>}
        {step==="success"&&<div style={{padding:"48px",textAlign:"center"}}><div style={{fontSize:"52px",marginBottom:"14px"}}>✅</div><div style={{fontFamily:"Outfit,sans-serif",fontSize:"20px",fontWeight:"800",color:C.accent,marginBottom:"6px"}}>Payment Verified!</div><div style={{color:C.muted,fontSize:"12px"}}>Preparing your PDF download...</div></div>}
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
  const C=DARK;

  const analyze=async()=>{
    if(jd.trim().length<50){setErr("Please paste a job description (min 50 characters)");return;}
    if(!Security.rateLimit("ai",3,60000)){setErr("Too many requests. Wait 1 minute.");return;}
    setLoading(true);setErr("");
    try{
      const res=await fetch(`${getB()}/ai-job-match`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are an ATS resume optimizer for Indian job market. Return ONLY valid JSON:\n{"match_score":85,"summary":"optimized summary","skills_technical":"skill1,skill2","experience_bullets":["bullet 1","bullet 2"],"keywords_added":["kw1","kw2"]}`,
          messages:[{role:"user",content:`JD:\n${jd}\n\nResume:\nName: ${currentForm.name}\nSummary: ${currentForm.summary}\nRole: ${currentForm.experience?.[0]?.role} at ${currentForm.experience?.[0]?.company}\nSkills: ${currentForm.skills?.technical}\n\nReturn JSON only.`}]
        })
      });
      if(!res.ok)throw new Error("Backend error "+res.status);
      const data=await res.json();
      if(data.error)throw new Error(data.error);
      const text=data.content?.map(b=>b.text||"").join("")||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      setResult(parsed);
    }catch(e){setErr("AI failed: "+e.message);}
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:DARK.card,border:`1px solid ${DARK.border}`,borderRadius:"20px",width:"100%",maxWidth:"620px",maxHeight:"90vh",overflow:"auto",animation:"modalIn 0.3s ease"}}>
        <div style={{padding:"22px 26px",borderBottom:`1px solid ${DARK.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:DARK.card,zIndex:1}}>
          <div>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"18px",color:"#fff"}}>🤖 AI Job-Match Optimizer</div>
            <div style={{color:DARK.muted,fontSize:"12px",marginTop:"2px"}}>Paste JD → AI tailors your resume for that exact role</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${DARK.border}`,color:DARK.muted,padding:"6px 12px",borderRadius:"8px",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"22px 26px"}}>
          {!result?<>
            <label style={{fontSize:"11px",color:DARK.muted,display:"block",marginBottom:"6px",textTransform:"uppercase"}}>Paste Job Description *</label>
            <textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="We are looking for a Software Engineer with experience in React, Node.js..." style={{width:"100%",height:"160px",padding:"12px",background:DARK.bg,border:`1px solid ${DARK.border}`,borderRadius:"10px",color:DARK.text,fontSize:"13px",lineHeight:1.6,resize:"vertical",outline:"none",fontFamily:"sans-serif"}}/>
            {err&&<div style={{color:DARK.red,fontSize:"12px",marginTop:"8px",padding:"8px",background:`${DARK.red}15`,borderRadius:"6px"}}>{err}</div>}
            <button onClick={analyze} disabled={loading} style={{marginTop:"14px",width:"100%",padding:"12px",background:loading?DARK.border:DARK.accent,color:loading?DARK.muted:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"14px",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
              {loading?<><div style={{width:"16px",height:"16px",border:"2px solid #fff4",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Analyzing...</>:"⚡ Analyze & Optimize"}
            </button>
          </>:<>
            <div style={{padding:"14px",background:`${DARK.accent}15`,border:`1px solid ${DARK.accent}44`,borderRadius:"12px",marginBottom:"16px",textAlign:"center"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"900",fontSize:"36px",color:DARK.accent}}>{result.match_score}%</div>
              <div style={{color:DARK.muted,fontSize:"12px"}}>Match Score after optimization</div>
            </div>
            {result.summary&&<div style={{marginBottom:"14px"}}><div style={{fontWeight:"700",color:"#fff",fontSize:"13px",marginBottom:"6px"}}>✏️ Optimized Summary</div><div style={{padding:"10px",background:DARK.bg,borderRadius:"8px",fontSize:"12px",lineHeight:1.7,color:DARK.text,borderLeft:`3px solid ${DARK.accent}`}}>{result.summary}</div></div>}
            {result.keywords_added?.length>0&&<div style={{marginBottom:"14px"}}><div style={{fontWeight:"700",color:"#fff",fontSize:"13px",marginBottom:"6px"}}>🔑 Keywords Added</div><div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>{result.keywords_added.map((k,i)=><span key={i} style={{fontSize:"11px",padding:"3px 9px",background:DARK.accentDim,color:DARK.accent,borderRadius:"20px"}}>{k}</span>)}</div></div>}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{onApply({...currentForm,summary:result.summary||currentForm.summary,skills:{...currentForm.skills,technical:result.skills_technical||currentForm.skills?.technical},experience:currentForm.experience?.map((e,i)=>i===0?{...e,bullets:result.experience_bullets?.join("\n")||e.bullets}:e)});onClose();}} style={{flex:1,padding:"12px",background:DARK.accent,color:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"14px",cursor:"pointer"}}>✅ Apply Changes</button>
              <button onClick={()=>setResult(null)} style={{padding:"12px 16px",background:"transparent",border:`1px solid ${DARK.border}`,color:DARK.muted,borderRadius:"10px",cursor:"pointer",fontSize:"13px"}}>↩ Re-analyze</button>
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
  const C=DARK;

  const handleFile=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    if(file.size>5*1024*1024){setErrMsg("File too large. Max 5MB.");setStatus("error");return;}
    setStatus("reading");setErrMsg("");
    try{
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const mediaType=file.type||"application/pdf";
      setStatus("extracting");
      const resp=await fetch(`${getB()}/ai-job-match`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:2000,
          system:`Extract ALL data from this resume. Return ONLY valid JSON, no markdown:\n{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","website":"","summary":"","education":[{"degree":"","school":"","year":"","gpa":""}],"experience":[{"role":"","company":"","duration":"","bullets":"bullet1\\nbullet2"}],"projects":[{"name":"","tech":"","description":"","link":""}],"skills":{"technical":"","languages":"","soft":"","tools":""},"certifications":"","achievements":"","customSections":[]}`,
          messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:mediaType,data:b64}},{type:"text",text:"Extract resume data. Return only JSON."}]}]
        })
      });
      if(!resp.ok)throw new Error("Backend error "+resp.status);
      const data=await resp.json();
      if(data.error)throw new Error(data.error);
      const text=data.content?.map(b=>b.text||"").join("")||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const extracted=JSON.parse(clean);
      if(!extracted.customSections)extracted.customSections=[];
      setStatus("done");
      setTimeout(()=>{onExtracted(extracted);onClose();},700);
    }catch(e){
      setErrMsg("Could not extract: "+e.message);
      setStatus("error");
    }
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"420px",padding:"36px 28px",animation:"modalIn 0.3s ease",textAlign:"center"}}>
        <div style={{fontSize:"44px",marginBottom:"12px"}}>{status==="done"?"✅":status==="error"?"❌":"📄"}</div>
        <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"20px",color:"#fff",marginBottom:"6px"}}>
          {status==="idle"&&"Upload Your Resume"}
          {status==="reading"&&"Reading file..."}
          {status==="extracting"&&"AI Extracting Data..."}
          {status==="done"&&"Extracted!"}
          {status==="error"&&"Extraction Failed"}
        </div>
        {status==="idle"&&<>
          <div style={{color:C.muted,fontSize:"13px",marginBottom:"20px"}}>AI reads your existing resume and fills all fields automatically</div>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFile} style={{display:"none"}} id="upload-input"/>
          <label htmlFor="upload-input" style={{display:"inline-block",padding:"12px 28px",background:C.accent,color:"#000",borderRadius:"10px",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"14px"}}>Choose File (PDF / Image)</label>
          <div style={{color:C.muted,fontSize:"11px",marginTop:"10px"}}>Max 5MB • PDF, PNG, JPG</div>
        </>}
        {(status==="reading"||status==="extracting")&&<div style={{width:"44px",height:"44px",border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",margin:"16px auto",animation:"spin 0.8s linear infinite"}}/>}
        {status==="done"&&<div style={{color:C.accent,fontSize:"13px",marginTop:"8px"}}>All fields filled in!</div>}
        {status==="error"&&<>
          <div style={{color:C.red,fontSize:"12px",margin:"10px 0",padding:"8px",background:`${C.red}18`,borderRadius:"8px"}}>{errMsg}</div>
          <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
            <button onClick={()=>setStatus("idle")} style={{padding:"9px 20px",background:C.border,border:"none",color:C.text,borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Try Again</button>
            <button onClick={()=>{onExtracted({...SAMPLE});onClose();}} style={{padding:"9px 20px",background:C.accent,border:"none",color:"#000",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>Load Sample</button>
          </div>
        </>}
        {status==="idle"&&<button onClick={onClose} style={{display:"block",width:"100%",marginTop:"12px",padding:"9px",background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:"12px"}}>Cancel</button>}
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

  const fetchStats=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${getB()}/admin/stats`,{headers:{"x-admin-key":"resumemint_admin_2025"}});
      if(!r.ok)throw new Error("Unauthorized");
      const d=await r.json();
      setStats(d);setPayments(d.recent||[]);
    }catch(e){
      setStats({total:0,revenue:0,today:0,todayRevenue:0});
      setPayments([]);
      setErr("Backend unreachable — showing zeros.");
    }
    setLoading(false);
  };

  const login=()=>{
    if(!Security.rateLimit("admin",5,300000)){setErr("Too many attempts. Locked 5 min.");return;}
    if(Security.hash(pw)===Security.hash("admin@resumemint")){setAuthed(true);setErr("");fetchStats();}
    else setErr("Invalid password");
    setPw("");
  };

  if(!authed)return(
    <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:4000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"340px",padding:"32px",animation:"modalIn 0.3s ease"}}>
        <div style={{textAlign:"center",marginBottom:"20px"}}>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>🛡️</div>
          <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"20px",color:"#fff"}}>Admin Access</div>
        </div>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Enter admin password" style={{width:"100%",padding:"11px 14px",background:C.bg,border:`1px solid ${err?C.red:C.border}`,borderRadius:"10px",color:C.text,fontSize:"13px",outline:"none",marginBottom:"10px"}}/>
        {err&&<div style={{color:C.red,fontSize:"12px",marginBottom:"10px",padding:"7px",background:`${C.red}15`,borderRadius:"6px"}}>🚫 {err}</div>}
        <button onClick={login} style={{width:"100%",padding:"12px",background:C.accent,color:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"14px",cursor:"pointer"}}>Login</button>
        <button onClick={onClose} style={{width:"100%",marginTop:"6px",padding:"9px",background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:"12px"}}>Cancel</button>
      </div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:4000,overflowY:"auto"}}>
      <div style={{display:"flex",minHeight:"100vh"}} className="admin-layout">
        <div style={{width:"200px",background:C.surface,borderRight:`1px solid ${C.border}`,padding:"18px 12px",display:"flex",flexDirection:"column",gap:"5px",flexShrink:0}} className="admin-sidebar">
          <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"16px",color:"#fff",padding:"6px 8px",marginBottom:"6px"}}>Resume<span style={{color:C.accent}}>Mint</span> <span style={{fontSize:"10px",color:C.muted}}>Admin</span></div>
          {[["📊","Dashboard","dashboard"],["💳","Transactions","transactions"],["🔒","Security","security"]].map(([icon,label,id])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"9px 12px",background:tab===id?C.accentDim:"transparent",border:`1px solid ${tab===id?C.accent+"44":"transparent"}`,borderRadius:"9px",color:tab===id?C.accent:C.muted,cursor:"pointer",textAlign:"left",display:"flex",gap:"8px",alignItems:"center",fontSize:"13px",fontFamily:"Outfit,sans-serif",fontWeight:tab===id?"700":"400"}}>{icon} {label}</button>
          ))}
          <div style={{flex:1}}/>
          <button onClick={fetchStats} style={{padding:"8px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"9px",color:C.muted,cursor:"pointer",fontSize:"12px"}}>↻ Refresh</button>
          <button onClick={onClose} style={{padding:"9px 12px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"9px",color:C.muted,cursor:"pointer",fontSize:"13px"}}>✕ Close</button>
        </div>
        <div style={{flex:1,padding:"28px",overflowY:"auto"}}>
          {tab==="dashboard"&&<>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"24px",color:"#fff",marginBottom:"4px"}}>Dashboard</div>
            <div style={{color:C.muted,fontSize:"12px",marginBottom:"20px"}}>Live data from MongoDB</div>
            {err&&<div style={{color:C.red,fontSize:"12px",marginBottom:"16px",padding:"9px 12px",background:`${C.red}18`,borderRadius:"8px"}}>⚠ {err}</div>}
            {loading?<div style={{textAlign:"center",padding:"40px",color:C.muted}}>Loading...</div>:
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px"}} className="metric-grid">
              {[{label:"Total Revenue",value:`₹${(stats?.revenue||0).toLocaleString()}`,icon:"💰",color:C.accent},{label:"Resumes Sold",value:(stats?.total||0).toString(),icon:"📄",color:C.blue},{label:"Today Revenue",value:`₹${stats?.todayRevenue||0}`,icon:"📈",color:C.gold},{label:"Today Customers",value:(stats?.today||0).toString(),icon:"👥",color:"#a78bfa"}].map((m,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                    <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase"}}>{m.label}</div>
                    <span style={{fontSize:"18px"}}>{m.icon}</span>
                  </div>
                  <div style={{fontFamily:"Outfit,sans-serif",fontSize:"26px",fontWeight:"800",color:m.color}}>{m.value}</div>
                </div>
              ))}
            </div>}
          </>}
          {tab==="transactions"&&<>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"24px",color:"#fff",marginBottom:"20px"}}>Transactions</div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",overflow:"hidden"}}>
              {payments.length===0?<div style={{padding:"36px",textAlign:"center",color:C.muted}}>No payments yet.</div>:
              payments.map((p,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1.5fr",padding:"12px 16px",borderBottom:`1px solid ${C.border}`,gap:"8px",alignItems:"center"}}>
                <div style={{fontSize:"12px",color:C.text}}>{p.name||"—"}</div>
                <div style={{fontSize:"11px",color:C.muted}}>{p.email||"—"}</div>
                <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:C.accent}}>₹9</div>
                <div style={{fontSize:"11px",color:C.muted}}>{p.createdAt?new Date(p.createdAt).toLocaleDateString("en-IN"):"—"}</div>
              </div>)}
            </div>
          </>}
          {tab==="security"&&<div style={{color:C.text}}>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"24px",color:"#fff",marginBottom:"20px"}}>Security Status</div>
            {[["Rate Limiting","Active — Payment 3/5min, AI 3/min"],["HMAC Verification","Razorpay signatures verified server-side"],["Admin Lockout","5 failed attempts triggers 5min lockout"],["HTTPS","Enforced via Vercel + Render"]].map(([t,d],i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 16px",marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:"700",fontSize:"13px"}}>{t}</div><div style={{color:C.muted,fontSize:"11px",marginTop:"3px"}}>{d}</div></div>
                <span style={{color:C.accent,fontSize:"11px",padding:"2px 8px",background:`${C.accent}15`,borderRadius:"20px"}}>Active</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────
function Landing({onStart,onStartUpload,theme,setTheme,onAdmin}){
  const C=theme==="dark"?DARK:LIGHT;
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 32px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:`${C.bg}f0`,backdropFilter:"blur(16px)",zIndex:100,flexWrap:"wrap",gap:"8px"}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"900",fontSize:"20px",color:C.text}}>Resume<span style={{color:C.accent}}>Mint</span><span style={{fontSize:"10px",background:C.accentDim,color:C.accent,padding:"2px 6px",borderRadius:"4px",marginLeft:"7px",fontWeight:"600"}}>INDIA</span></div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{padding:"7px 13px",background:C.card,border:`1px solid ${C.border}`,color:C.muted,borderRadius:"8px",cursor:"pointer",fontSize:"14px"}}>{theme==="dark"?"☀️":"🌙"}</button>
          <button onClick={onAdmin} style={{padding:"7px 13px",background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontFamily:"Outfit,sans-serif"}}>Admin</button>
          <button onClick={onStart} style={{padding:"9px 20px",background:C.accent,color:"#000",border:"none",borderRadius:"8px",fontFamily:"Outfit,sans-serif",fontWeight:"700",cursor:"pointer",fontSize:"13px"}}>Build Resume →</button>
        </div>
      </nav>
      <section style={{padding:"80px 32px 48px",maxWidth:"1100px",margin:"0 auto",animation:"fadeUp 0.6s ease"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:C.accentDim,border:`1px solid ${C.accent}33`,padding:"6px 14px",borderRadius:"100px",marginBottom:"24px"}}>
          <span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.accent,display:"inline-block",animation:"pulse 1.5s infinite"}}/>
          <span style={{color:C.accent,fontSize:"12px",fontWeight:"600"}}>12,400+ resumes built — 87% interview shortlist rate</span>
        </div>
        <h1 style={{fontFamily:"Outfit,sans-serif",fontWeight:"900",fontSize:"clamp(34px,6vw,68px)",lineHeight:1.1,marginBottom:"18px",color:C.text}}>
          Stop Getting Rejected.<br/>
          <span style={{background:`linear-gradient(90deg,${C.accent},${C.gold})`,backgroundClip:"text",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Start Getting Hired.</span>
        </h1>
        <p style={{fontSize:"17px",color:C.muted,maxWidth:"540px",marginBottom:"32px",lineHeight:1.75}}>ATS-optimised resume builder with <strong style={{color:C.text}}>AI job-matching</strong>, 3 professional templates. Built for Indian placements. <strong style={{color:C.text}}>₹9 flat.</strong></p>
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"48px"}}>
          <button onClick={onStart} style={{padding:"14px 32px",background:C.accent,color:"#000",border:"none",borderRadius:"10px",fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"16px",cursor:"pointer",animation:"glow 3s infinite"}}>🚀 Build My Resume — ₹9</button>
          <button onClick={onStartUpload} style={{padding:"14px 22px",background:"transparent",color:C.text,border:`1px solid ${C.border}`,borderRadius:"10px",fontFamily:"Outfit,sans-serif",fontWeight:"600",fontSize:"14px",cursor:"pointer"}}>📄 Upload Existing Resume</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px"}} className="stat-grid">
          {[["₹9","Flat Price"],["3 min","Build Time"],["100%","ATS Ready"],["87%","Shortlist Rate"]].map(([n,l],i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"18px",textAlign:"center"}}>
              <div style={{fontFamily:"Outfit,sans-serif",fontSize:"26px",fontWeight:"900",color:C.accent}}>{n}</div>
              <div style={{color:C.muted,fontSize:"12px",marginTop:"3px"}}>{l}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{padding:"48px 32px",maxWidth:"1100px",margin:"0 auto"}}>
        <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:"34px",fontWeight:"900",textAlign:"center",marginBottom:"6px",color:C.text}}>Everything You Need to Get Hired</h2>
        <p style={{textAlign:"center",color:C.muted,marginBottom:"32px",fontSize:"14px"}}>Not just a template — a complete job-winning system</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}} className="landing-feat">
          {[["🤖","AI Job-Match","Paste any JD → AI rewrites your resume for that exact role in seconds."],["🎨","3 Pro Templates","Classic, Modern Sidebar & Executive. Switch instantly. All ATS-ready."],["📄","Upload & Improve","Upload your existing resume — AI extracts all data instantly."],["🇮🇳","Indian Job Market","Designed for TCS, Infosys, startups & campus placements."],["✏️","Easy Editing","Add/remove/reorder sections. Full control over your resume."],["💰","Just ₹9","Less than a chai. One-time. No subscriptions. Instant clean PDF."]].map(([icon,title,desc],i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"22px"}}>
              <div style={{fontSize:"28px",marginBottom:"10px"}}>{icon}</div>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"15px",color:C.text,marginBottom:"7px"}}>{title}</div>
              <div style={{color:C.muted,fontSize:"12px",lineHeight:1.65}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{padding:"48px 32px",maxWidth:"1100px",margin:"0 auto"}}>
        <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:"28px",fontWeight:"900",textAlign:"center",marginBottom:"28px",color:C.text}}>Students Who Got Shortlisted 🎉</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}} className="landing-testi">
          {[["Priya Nair","NIT Calicut","Got shortlisted at Infosys and TCS within a week. The AI job-match feature is insane."],["Rahul Verma","SRM University","The Executive template got me a callback from a US startup. Worth 100x more than ₹9."],["Sneha Reddy","BITS Pilani","Got 3 interview calls within a week of updating my resume with this tool."]].map(([name,college,text],i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"20px"}}>
              <div style={{color:C.gold,fontSize:"14px",marginBottom:"8px"}}>★★★★★</div>
              <p style={{color:C.text,fontSize:"12px",lineHeight:1.75,marginBottom:"14px",fontStyle:"italic"}}>"{text}"</p>
              <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:C.text,fontSize:"13px"}}>{name}</div>
              <div style={{color:C.muted,fontSize:"11px"}}>{college}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{padding:"60px 32px",textAlign:"center"}}>
        <div style={{background:`linear-gradient(135deg,${C.accentDim},${C.card})`,border:`1px solid ${C.accent}44`,borderRadius:"20px",padding:"52px 32px",maxWidth:"580px",margin:"0 auto"}}>
          <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:"32px",fontWeight:"900",color:C.text,marginBottom:"12px"}}>Your Dream Job Is ₹9 Away</h2>
          <p style={{color:C.muted,marginBottom:"24px",lineHeight:1.7,fontSize:"14px"}}>Build your ATS resume, choose from 3 templates, download instantly.</p>
          <button onClick={onStart} style={{padding:"15px 40px",background:C.accent,color:"#000",border:"none",borderRadius:"12px",fontFamily:"Outfit,sans-serif",fontWeight:"800",fontSize:"17px",cursor:"pointer"}}>Start Free — Pay Only to Download →</button>
          <div style={{color:C.muted,fontSize:"11px",marginTop:"10px"}}>No login • No subscription • ₹9 flat</div>
        </div>
      </section>
      <footer style={{borderTop:`1px solid ${C.border}`,padding:"20px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"900",color:C.text}}>Resume<span style={{color:C.accent}}>Mint</span></div>
        <div style={{color:C.muted,fontSize:"11px"}}>© 2025 ResumeMint · Made in India 🇮🇳</div>
      </footer>
    </div>
  );
}

// ── BUILDER PAGE (Clean redesign) ─────────────────────────
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

  // Form helpers — no sanitize to allow spaces and normal editing
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const updN=(sec,idx,k,v)=>setForm(p=>{const a=[...p[sec]];a[idx]={...a[idx],[k]:v};return{...p,[sec]:a};});
  const updS=(k,v)=>setForm(p=>({...p,skills:{...p.skills,[k]:v}}));
  const addRow=(sec,empty)=>setForm(p=>({...p,[sec]:[...p[sec],empty]}));
  const delRow=(sec,idx)=>setForm(p=>({...p,[sec]:p[sec].filter((_,i)=>i!==idx)}));

  const addCustomSection=()=>setForm(p=>({...p,customSections:[...p.customSections,{title:"",content:""}]}));
  const updCustom=(idx,k,v)=>setForm(p=>{const a=[...p.customSections];a[idx]={...a[idx],[k]:v};return{...p,customSections:a};});
  const delCustom=(idx)=>setForm(p=>({...p,customSections:p.customSections.filter((_,i)=>i!==idx)}));

  const downloadPDF=()=>{
    const style=document.createElement("style");
    style.id="print-style";
    style.textContent=`@media print{body>*:not(#print-target){display:none!important;} #print-target{display:block!important;position:fixed;top:0;left:0;width:100%;} @page{margin:0;}}`;
    document.head.appendChild(style);
    window.print();
    setTimeout(()=>{const s=document.getElementById("print-style");if(s)s.remove();},1000);
  };

  const inp={width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:"8px",color:C.text,fontSize:"13px",outline:"none",marginBottom:"10px",fontFamily:"inherit"};
  const lbl={fontSize:"11px",color:C.muted,display:"block",marginBottom:"4px",fontWeight:"600",letterSpacing:"0.3px"};
  const card={background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"18px",marginBottom:"12px"};

  const TABS=[
    {id:"personal",icon:"👤",label:"Personal"},
    {id:"education",icon:"🎓",label:"Education"},
    {id:"experience",icon:"💼",label:"Experience"},
    {id:"projects",icon:"🚀",label:"Projects"},
    {id:"skills",icon:"🛠",label:"Skills"},
    {id:"extra",icon:"➕",label:"Extra"},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"Outfit,sans-serif"}}>

      {/* TOP NAV */}
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,position:"sticky",top:0,zIndex:50,gap:"8px",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={onBack} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"6px 10px",borderRadius:"7px",cursor:"pointer",fontSize:"13px"}}>← Back</button>
          <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"900",fontSize:"17px",color:C.text}}>Resume<span style={{color:C.accent}}>Mint</span></div>
        </div>
        <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          {/* Mobile toggle */}
          <div style={{display:"flex",background:C.bg,border:`1px solid ${C.border}`,borderRadius:"7px",overflow:"hidden"}}>
            {["edit","preview"].map(v=>(
              <button key={v} onClick={()=>setMobileView(v)} style={{padding:"5px 12px",background:mobileView===v?C.accent:"transparent",color:mobileView===v?"#000":C.muted,border:"none",cursor:"pointer",fontSize:"12px",fontWeight:mobileView===v?"700":"400"}}>
                {v==="edit"?"✏️ Edit":"👁 Preview"}
              </button>
            ))}
          </div>
          {/* Template switcher */}
          <div style={{display:"flex",background:C.bg,border:`1px solid ${C.border}`,borderRadius:"7px",overflow:"hidden"}}>
            {TEMPLATES.map(t=>(
              <button key={t.id} onClick={()=>setTemplateId(t.id)} style={{padding:"5px 10px",background:templateId===t.id?C.accentDim:"transparent",border:"none",borderRight:`1px solid ${C.border}`,color:templateId===t.id?C.accent:C.muted,cursor:"pointer",fontSize:"11px",fontWeight:templateId===t.id?"700":"400"}}>
                {t.icon} {t.name}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowAI(true)} style={{padding:"6px 12px",background:C.accentDim,border:`1px solid ${C.accent}44`,color:C.accent,borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontWeight:"600"}}>🤖 AI Match</button>
          <button onClick={()=>setForm({...SAMPLE})} style={{padding:"6px 10px",background:C.card,border:`1px solid ${C.border}`,color:C.muted,borderRadius:"7px",cursor:"pointer",fontSize:"12px"}}>Sample</button>
          <button onClick={()=>paid?downloadPDF():setShowPayment(true)} style={{padding:"8px 18px",background:C.accent,color:"#000",border:"none",borderRadius:"8px",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>
            {paid?"⬇ Download PDF":"💳 Pay ₹9"}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{display:"flex",flex:1}} className="builder-layout">

        {/* FORM PANEL */}
        <div style={{width:"420px",minWidth:"320px",overflowY:"auto",borderRight:`1px solid ${C.border}`,background:C.surface,display:mobileView==="preview"?"none":"flex",flexDirection:"column"}} className="builder-form">

          {/* TABS */}
          <div style={{display:"flex",gap:"2px",padding:"12px 14px 0",overflowX:"auto",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 12px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",fontSize:"12px",fontFamily:"Outfit,sans-serif",fontWeight:"600",background:tab===t.id?C.bg:C.surface,color:tab===t.id?C.accent:C.muted,flexShrink:0,borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",transition:"all 0.15s",whiteSpace:"nowrap"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* FORM CONTENT */}
          <div style={{padding:"16px",overflowY:"auto",flex:1}}>

            {tab==="personal"&&<>
              <div style={card}>
                <div style={{fontWeight:"700",color:C.text,marginBottom:"14px",fontSize:"14px"}}>📋 Contact Information</div>
                {[["Full Name *","name","Arjun Sharma"],["Email *","email","arjun@gmail.com"],["Phone *","phone","+91 98765 43210"],["City, State","location","Bangalore, Karnataka"],["LinkedIn URL","linkedin","linkedin.com/in/..."],["GitHub URL","github","github.com/..."],["Portfolio Website","website","arjunsharma.dev"]].map(([l,k,ph])=>(
                  <div key={k}><label style={lbl}>{l}</label><input style={inp} placeholder={ph} value={form[k]||""} onChange={e=>upd(k,e.target.value)}/></div>
                ))}
              </div>
              <div style={card}>
                <label style={lbl}>Professional Summary *</label>
                <textarea style={{...inp,height:"90px",resize:"vertical"}} placeholder="3-4 lines about yourself: skills, experience, and what you're seeking." value={form.summary||""} onChange={e=>upd("summary",e.target.value)}/>
              </div>
            </>}

            {tab==="education"&&<>
              {form.education.map((e,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>🎓 Education {form.education.length>1?`#${i+1}`:""}</div>
                    {form.education.length>1&&<button onClick={()=>delRow("education",i)} style={{padding:"3px 10px",background:`${C.red}18`,border:`1px solid ${C.red}44`,color:C.red,borderRadius:"6px",cursor:"pointer",fontSize:"11px"}}>✕ Remove</button>}
                  </div>
                  {[["Degree / Course *","degree","B.Tech Computer Science"],["College / University *","school","NIT Trichy"],["Year","year","2021–2025"],["CGPA / Percentage","gpa","8.5 CGPA"]].map(([l,k,ph])=>(
                    <div key={k}><label style={lbl}>{l}</label><input style={inp} placeholder={ph} value={e[k]||""} onChange={ev=>updN("education",i,k,ev.target.value)}/></div>
                  ))}
                </div>
              ))}
              <button onClick={()=>addRow("education",{degree:"",school:"",year:"",gpa:""})} style={{width:"100%",padding:"10px",background:"transparent",border:`1px dashed ${C.border}`,color:C.accent,borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"600"}}>+ Add Another Education</button>
            </>}

            {tab==="experience"&&<>
              {form.experience.map((e,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>💼 Experience {form.experience.length>1?`#${i+1}`:""}</div>
                    {form.experience.length>1&&<button onClick={()=>delRow("experience",i)} style={{padding:"3px 10px",background:`${C.red}18`,border:`1px solid ${C.red}44`,color:C.red,borderRadius:"6px",cursor:"pointer",fontSize:"11px"}}>✕ Remove</button>}
                  </div>
                  {[["Job Title *","role","Software Developer Intern"],["Company","company","Razorpay, Bangalore"],["Duration","duration","Jun 2024 – Aug 2024"]].map(([l,k,ph])=>(
                    <div key={k}><label style={lbl}>{l}</label><input style={inp} placeholder={ph} value={e[k]||""} onChange={ev=>updN("experience",i,k,ev.target.value)}/></div>
                  ))}
                  <label style={lbl}>Key Achievements (one per line)</label>
                  <textarea style={{...inp,height:"100px",resize:"vertical"}} placeholder={"Built X reducing Y by 40%\nProcessed 10k+ events with 99.9% uptime\nImproved performance by 30%"} value={e.bullets||""} onChange={ev=>updN("experience",i,"bullets",ev.target.value)}/>
                </div>
              ))}
              <button onClick={()=>addRow("experience",{role:"",company:"",duration:"",bullets:""})} style={{width:"100%",padding:"10px",background:"transparent",border:`1px dashed ${C.border}`,color:C.accent,borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"600"}}>+ Add Another Experience</button>
            </>}

            {tab==="projects"&&<>
              {form.projects.map((p,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>🚀 Project {form.projects.length>1?`#${i+1}`:""}</div>
                    {form.projects.length>1&&<button onClick={()=>delRow("projects",i)} style={{padding:"3px 10px",background:`${C.red}18`,border:`1px solid ${C.red}44`,color:C.red,borderRadius:"6px",cursor:"pointer",fontSize:"11px"}}>✕ Remove</button>}
                  </div>
                  {[["Project Name *","name","ATS Resume Builder"],["Tech Stack","tech","React, Node.js, MongoDB"],["Live Link / GitHub","link","github.com/..."]].map(([l,k,ph])=>(
                    <div key={k}><label style={lbl}>{l}</label><input style={inp} placeholder={ph} value={p[k]||""} onChange={ev=>updN("projects",i,k,ev.target.value)}/></div>
                  ))}
                  <label style={lbl}>Description & Impact</label>
                  <textarea style={{...inp,height:"70px",resize:"vertical"}} placeholder="Built for Y users. Achieved Z results." value={p.description||""} onChange={ev=>updN("projects",i,"description",ev.target.value)}/>
                </div>
              ))}
              <button onClick={()=>addRow("projects",{name:"",tech:"",description:"",link:""})} style={{width:"100%",padding:"10px",background:"transparent",border:`1px dashed ${C.border}`,color:C.accent,borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"600"}}>+ Add Another Project</button>
            </>}

            {tab==="skills"&&<div style={card}>
              <div style={{fontWeight:"700",color:C.text,marginBottom:"14px",fontSize:"14px"}}>🛠 Skills & Qualifications</div>
              {[["Technical Skills *","technical","React, Node.js, Express, MongoDB, Git, Docker, AWS"],["Programming Languages","languages","Java, JavaScript, Python, C++, SQL"],["Tools & Platforms","tools","VS Code, Postman, Figma, Jira, Linux"],["Soft Skills","soft","Leadership, Communication, Problem Solving, Agile"]].map(([l,k,ph])=>(
                <div key={k}><label style={lbl}>{l}</label><input style={inp} placeholder={ph} value={form.skills[k]||""} onChange={e=>updS(k,e.target.value)}/></div>
              ))}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"14px",marginTop:"4px"}}>
                <label style={lbl}>Certifications (one per line)</label>
                <textarea style={{...inp,height:"70px",resize:"vertical"}} placeholder={"AWS Cloud Practitioner (2024)\nGoogle Data Analytics (2023)"} value={form.certifications||""} onChange={e=>upd("certifications",e.target.value)}/>
                <label style={lbl}>Achievements / Extra Curriculars</label>
                <textarea style={{...inp,height:"60px",resize:"vertical"}} placeholder={"Winner — Internal Hackathon 2024\nGoogle DSC Lead"} value={form.achievements||""} onChange={e=>upd("achievements",e.target.value)}/>
              </div>
            </div>}

            {tab==="extra"&&<>
              <div style={{color:C.muted,fontSize:"12px",marginBottom:"14px",padding:"10px 12px",background:C.card,borderRadius:"8px",border:`1px solid ${C.border}`}}>
                💡 Add any custom section — Volunteer Work, Languages, Publications, Hobbies, Research, etc.
              </div>
              {form.customSections.map((sec,i)=>(
                <div key={i} style={card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                    <div style={{fontWeight:"700",color:C.text,fontSize:"14px"}}>Custom Section {i+1}</div>
                    <button onClick={()=>delCustom(i)} style={{padding:"3px 10px",background:`${C.red}18`,border:`1px solid ${C.red}44`,color:C.red,borderRadius:"6px",cursor:"pointer",fontSize:"11px"}}>✕ Remove</button>
                  </div>
                  <label style={lbl}>Section Title</label>
                  <input style={inp} placeholder="e.g. Volunteer Work / Languages / Publications" value={sec.title||""} onChange={e=>updCustom(i,"title",e.target.value)}/>
                  <label style={lbl}>Content (one item per line)</label>
                  <textarea style={{...inp,height:"100px",resize:"vertical"}} placeholder={"Volunteer Teacher — Teach For India (2023)\nFluent in English, Hindi, Kannada"} value={sec.content||""} onChange={e=>updCustom(i,"content",e.target.value)}/>
                </div>
              ))}
              <button onClick={addCustomSection} style={{width:"100%",padding:"10px",background:"transparent",border:`1px dashed ${C.accent}`,color:C.accent,borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"600"}}>+ Add Custom Section</button>
            </>}

          </div>
        </div>

        {/* PREVIEW PANEL */}
        <div style={{flex:1,padding:"16px",background:theme==="dark"?"#0a0a14":"#e8ecf4",overflowY:"auto",display:mobileView==="edit"?"none":"flex",flexDirection:"column"}} className="builder-preview show">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"6px"}}>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:C.text,fontSize:"13px"}}>
              Live Preview — {TEMPLATES.find(t=>t.id===templateId)?.name}
            </div>
            <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
              {templateId!=="classic"&&<button onClick={()=>setResumeTheme(t=>t==="light"?"dark":"light")} style={{padding:"4px 10px",background:C.card,border:`1px solid ${C.border}`,color:C.muted,borderRadius:"6px",cursor:"pointer",fontSize:"11px"}}>{resumeTheme==="light"?"🌙 Dark":"☀️ Light"} Resume</button>}
              {paid?<span style={{fontSize:"11px",color:C.accent,fontWeight:"600"}}>✅ Unlocked</span>:<span style={{fontSize:"11px",color:C.muted}}>🔒 Preview</span>}
            </div>
          </div>
          <div style={{background:"#fff",borderRadius:"8px",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}} id="print-target">
            <Tmpl form={form} watermark={!paid} theme={resumeTheme}/>
          </div>
          {!paid&&<div style={{marginTop:"14px",background:C.card,border:`1px solid ${C.accent}44`,borderRadius:"10px",padding:"16px",textAlign:"center"}}>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:"700",color:C.text,marginBottom:"4px",fontSize:"14px"}}>Ready to download your clean PDF?</div>
            <div style={{color:C.muted,fontSize:"12px",marginBottom:"10px"}}>Remove watermark • Full quality • Just ₹9</div>
            <button onClick={()=>setShowPayment(true)} style={{padding:"10px 28px",background:C.accent,color:"#000",border:"none",borderRadius:"8px",fontFamily:"Outfit,sans-serif",fontWeight:"700",fontSize:"13px",cursor:"pointer"}}>💳 Pay ₹9 & Download →</button>
          </div>}
        </div>

        {/* Desktop: both panels visible */}
        <style>{`@media(min-width:701px){.builder-form{display:flex !important;}.builder-preview{display:flex !important;}}`}</style>
      </div>

      {showAI&&<AIModal onClose={()=>setShowAI(false)} onApply={updated=>setForm(updated)} currentForm={form}/>}
      {showPayment&&<PaymentModal form={form} onClose={()=>setShowPayment(false)} onSuccess={()=>{setPaid(true);setShowPayment(false);setTimeout(downloadPDF,800);}}/>}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("landing");
  const [theme,setTheme]=useState("dark");
  const [showAdmin,setShowAdmin]=useState(false);
  const [showUpload,setShowUpload]=useState(false);
  const [uploadedForm,setUploadedForm]=useState(null);

  return(<>
    <style>{GS}</style>
    {page==="landing"&&<Landing
      onStart={()=>{setUploadedForm(null);setPage("builder");}}
      onStartUpload={()=>setShowUpload(true)}
      theme={theme} setTheme={setTheme}
      onAdmin={()=>setShowAdmin(true)}
    />}
    {page==="builder"&&<Builder
      onBack={()=>setPage("landing")}
      theme={theme} setTheme={setTheme}
      initialForm={uploadedForm||EMPTY}
    />}
    {showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}
    {showUpload&&<UploadModal
      onClose={()=>setShowUpload(false)}
      onExtracted={form=>{setUploadedForm(form);setShowUpload(false);setPage("builder");}}
    />}
  </>);
}
        

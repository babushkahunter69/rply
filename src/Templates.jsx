import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const S = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.tp{font-family:'DM Sans',sans-serif;color:#0f0e0c;-webkit-font-smoothing:antialiased;max-width:760px;margin:0 auto;padding:48px 24px 80px}
.tp-title{font-family:'DM Serif Display',serif;font-size:26px;font-weight:400;margin-bottom:6px}
.tp-sub{font-size:14px;color:#9a9590;margin-bottom:32px;line-height:1.6}
.back-btn{background:none;border:none;font-family:'DM Sans',sans-serif;font-size:13px;color:#9a9590;cursor:pointer;padding:0;margin-bottom:24px;display:flex;align-items:center;gap:6px}
.back-btn:hover{color:#0f0e0c}
.add-box{background:#fff;border:1px solid #e8e4de;border-radius:14px;padding:22px 24px;margin-bottom:28px}
.add-title{font-size:13px;font-weight:600;margin-bottom:14px}
.tp-input,.tp-textarea{width:100%;font-family:'DM Sans',sans-serif;font-size:14px;color:#0f0e0c;background:#f8f7f4;border:1px solid #e8e4de;border-radius:8px;padding:10px 14px;outline:none;transition:border-color .15s;margin-bottom:10px}
.tp-input:focus,.tp-textarea:focus{border-color:#b0aba3;background:#fff}
.tp-input::placeholder,.tp-textarea::placeholder{color:#c8c3bb}
.tp-textarea{resize:none;line-height:1.6}
.tp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:480px){.tp-row{grid-template-columns:1fr}}
.tp-btn{background:#0f0e0c;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:9px 20px;cursor:pointer}
.tp-btn:disabled{opacity:.5;cursor:not-allowed}
.tp-btn-ghost{background:#fff;color:#4a4740;border:1px solid #e8e4de;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:5px 12px;cursor:pointer;transition:all .15s}
.tp-btn-ghost:hover{border-color:#b0aba3}
.tpl-grid{display:flex;flex-direction:column;gap:12px}
.tpl-card{background:#fff;border:1px solid #e8e4de;border-radius:14px;padding:20px 22px}
.tpl-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;flex-wrap:wrap}
.tpl-name{font-size:15px;font-weight:500;color:#0f0e0c}
.tpl-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.tpl-tag{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:2px 9px;border-radius:20px;background:#f2efe9;border:1px solid #e8e4de;color:#6b6760}
.tpl-text{font-size:13px;color:#4a4740;line-height:1.7}
.copy-btn{background:#fff;border:1px solid #e8e4de;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:11px;color:#4a4740;padding:3px 9px;cursor:pointer}
.generate-box{background:#f2efe9;border:1px solid #e8e4de;border-radius:10px;padding:16px;margin-bottom:20px}
.generate-title{font-size:13px;font-weight:600;margin-bottom:10px}
.generate-sub{font-size:12px;color:#9a9590;margin-bottom:12px}
.empty{text-align:center;padding:60px 20px;color:#9a9590;font-size:14px}
.spin{display:inline-block;width:13px;height:13px;border:1.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:rot .65s linear infinite;vertical-align:middle;margin-right:5px}
@keyframes rot{to{transform:rotate(360deg)}}
`;

const SITUATIONS = [
  "Late delivery / slow service",
  "Rude or unfriendly staff",
  "Wrong order / incorrect item",
  "Poor food quality",
  "Cleanliness issues",
  "5-star glowing review",
  "Noise / atmosphere complaint",
  "Parking or location issue",
];

export default function Templates({ user, goTo }) {
  const [templates, setTemplates]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [name,      setName]        = useState("");
  const [situation, setSituation]   = useState("");
  const [tone,      setTone]        = useState("friendly");
  const [text,      setText]        = useState("");
  const [generating,setGenerating]  = useState(false);
  const [saving,    setSaving]      = useState(false);
  const [copied,    setCopied]      = useState({});

  const colRef = () => collection(db, "users", user.uid, "templates");

  useEffect(() => {
    getDocs(query(colRef(), orderBy("createdAt","desc")))
      .then(snap => { setTemplates(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); })
      .catch(()=>setLoading(false));
  }, []);

  const generateTemplate = async () => {
    if (!situation) return;
    setGenerating(true); setText("");
    const bv = user.brandVoice || {};
    const brandLines = [
      bv.bizType   && `Business type: ${bv.bizType}`,
      bv.tones?.length && `Brand tone: ${bv.tones.join(", ")}`,
      bv.signOff   && `Preferred sign-off: ${bv.signOff}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are a professional reputation manager for local businesses.
${brandLines ? `\nBrand voice profile:\n${brandLines}\n` : ""}
Write a reusable ${tone} response template for this situation: "${situation}".

Rules:
- Under 90 words
- Use [REVIEWER_NAME] as a placeholder where appropriate
- Sound like a real human business owner
- Do NOT open with "Thank you for your review"
- Use the preferred sign-off if provided, otherwise end naturally
- Should work for any review in this situation without sounding generic

Return ONLY the template text. No preamble.`;

    try {
      const res  = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({prompt}) });
      const data = await res.json();
      setText(data.text || "");
      if (!name) setName(situation);
    } catch {}
    setGenerating(false);
  };

  const save = async () => {
    if (!text.trim() || !name.trim()) return;
    setSaving(true);
    const entry = { name, situation, tone, text: text.trim(), createdAt: new Date().toISOString() };
    const ref = await addDoc(colRef(), entry);
    setTemplates(t => [{ id: ref.id, ...entry }, ...t]);
    setName(""); setSituation(""); setText("");
    setSaving(false);
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "templates", id));
    setTemplates(t => t.filter(x => x.id !== id));
  };

  const copy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(c=>({...c,[id]:true}));
    setTimeout(()=>setCopied(c=>({...c,[id]:false})), 2000);
  };

  return (
    <>
      <style>{S}</style>
      <div className="tp">
        <button className="back-btn" onClick={()=>goTo("dashboard")}>← Back to dashboard</button>
        <div className="tp-title">Response Templates</div>
        <p className="tp-sub">Save reusable responses for common situations. Rply learns your preferred style the more you use it.</p>

        <div className="add-box">
          <div className="add-title">Generate a new template</div>
          <div className="tp-row">
            <select className="tp-input" value={situation} onChange={e=>setSituation(e.target.value)} style={{cursor:"pointer"}}>
              <option value="">Select a situation...</option>
              {SITUATIONS.map(s=><option key={s} value={s}>{s}</option>)}
              <option value="custom">Custom situation...</option>
            </select>
            <select className="tp-input" value={tone} onChange={e=>setTone(e.target.value)} style={{cursor:"pointer"}}>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="apologetic">Apologetic</option>
              <option value="grateful">Grateful</option>
            </select>
          </div>
          {situation==="custom" && (
            <input className="tp-input" placeholder="Describe the situation..." value={name} onChange={e=>{setName(e.target.value);setSituation(e.target.value);}} />
          )}
          <button className="tp-btn" onClick={generateTemplate} disabled={generating||!situation} style={{marginBottom: text?12:0}}>
            {generating ? <><span className="spin"/>Generating...</> : "Generate template"}
          </button>

          {text && (
            <>
              <div style={{marginBottom:10}}>
                <input className="tp-input" placeholder="Template name" value={name} onChange={e=>setName(e.target.value)} />
                <textarea className="tp-textarea" rows={4} value={text} onChange={e=>setText(e.target.value)} />
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="tp-btn" onClick={save} disabled={saving||!text.trim()||!name.trim()}>
                  {saving ? "Saving..." : "Save template"}
                </button>
                <button className="tp-btn-ghost" onClick={generateTemplate} disabled={generating}>Regenerate</button>
              </div>
            </>
          )}
        </div>

        {loading && <div className="empty">Loading templates...</div>}
        {!loading && templates.length===0 && <div className="empty">No templates yet. Generate your first one above!</div>}

        <div className="tpl-grid">
          {templates.map(t => (
            <div key={t.id} className="tpl-card">
              <div className="tpl-header">
                <div className="tpl-name">{t.name}</div>
                <div style={{display:"flex",gap:8}}>
                  <button className="copy-btn" onClick={()=>copy(t.id,t.text)}>{copied[t.id]?"Copied!":"Copy"}</button>
                  <button className="tp-btn-ghost" style={{color:"#991b1b",borderColor:"#fecaca"}} onClick={()=>remove(t.id)}>Delete</button>
                </div>
              </div>
              <div className="tpl-meta">
                {t.situation && <span className="tpl-tag">{t.situation}</span>}
                <span className="tpl-tag">{t.tone}</span>
              </div>
              <div className="tpl-text">{t.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

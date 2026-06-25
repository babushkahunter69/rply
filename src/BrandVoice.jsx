import { useState } from "react";
import { saveBrandVoice } from "./firebase";

const S = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.bv{font-family:'DM Sans',sans-serif;color:#0f0e0c;-webkit-font-smoothing:antialiased;max-width:640px;margin:0 auto;padding:48px 24px 80px}
.bv-title{font-family:'DM Serif Display',serif;font-size:26px;font-weight:400;margin-bottom:6px}
.bv-sub{font-size:14px;color:#9a9590;margin-bottom:36px;line-height:1.6}
.bv-section{margin-bottom:28px}
.bv-label{display:block;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b6760;margin-bottom:8px}
.bv-hint{font-size:12px;color:#8b8580;margin-bottom:8px}
.bv-input,.bv-textarea{width:100%;font-family:'DM Sans',sans-serif;font-size:14px;color:#0f0e0c;background:#fff;border:1px solid #e8e4de;border-radius:8px;padding:10px 14px;outline:none;transition:border-color .15s}
.bv-input:focus,.bv-textarea:focus{border-color:#b0aba3}
.bv-input::placeholder,.bv-textarea::placeholder{color:#c8c3bb}
.bv-textarea{resize:none;line-height:1.6}
.bv-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:520px){.bv-row{grid-template-columns:1fr}}
.tone-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(max-width:420px){.tone-grid{grid-template-columns:1fr 1fr}}
.tone-chip{border:1px solid #e8e4de;border-radius:8px;padding:10px 12px;cursor:pointer;text-align:center;font-size:13px;font-weight:500;color:#4a4740;transition:all .15s;background:#fff}
.tone-chip:hover{border-color:#b0aba3}
.tone-chip.on{border-color:#0f0e0c;background:#0f0e0c;color:#fff}
.save-btn{background:#0f0e0c;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;padding:12px 28px;cursor:pointer;transition:background .15s}
.save-btn:hover:not(:disabled){background:#2c2a26}
.save-btn:disabled{opacity:.5;cursor:not-allowed}
.back-btn{background:none;border:none;font-family:'DM Sans',sans-serif;font-size:13px;color:#9a9590;cursor:pointer;padding:0;margin-bottom:24px;display:flex;align-items:center;gap:6px}
.back-btn:hover{color:#0f0e0c}
.success{font-size:13px;color:#1a6644;background:#edf7f1;border:1px solid #b6e4cc;border-radius:7px;padding:10px 14px;margin-top:12px}
.preview-box{background:#f8f7f4;border:1px solid #e8e4de;border-radius:10px;padding:16px;margin-top:20px}
.preview-label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9a9590;margin-bottom:8px}
.preview-text{font-size:13px;color:#4a4740;line-height:1.7;font-style:italic}
`;

const TONES = ["Professional","Friendly","Warm","Witty","Empathetic","Formal","Casual","Enthusiastic","Concise"];

export default function BrandVoice({ user, onSave, goTo }) {
  const bv = user.brandVoice || {};

  const [bizName,    setBizName]    = useState(bv.bizName    || user.savedBiz || "");
  const [bizType,    setBizType]    = useState(bv.bizType    || "");
  const [location,   setLocation]   = useState(bv.location   || "");
  const [ownerName,  setOwnerName]  = useState(bv.ownerName  || "");
  const [signOff,    setSignOff]    = useState(bv.signOff    || "");
  const [tones,      setTones]      = useState(bv.tones      || []);
  const [complaints, setComplaints] = useState(bv.complaints || "");
  const [extras,     setExtras]     = useState(bv.extras     || "");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const toggleTone = (t) => {
    setTones(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].slice(0, 3));
  };

  const save = async () => {
    setSaving(true);
    const brandVoice = { bizName, bizType, location, ownerName, signOff, tones, complaints, extras };
    await saveBrandVoice(user.uid, brandVoice);
    onSave(brandVoice);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const buildPreview = () => {
    const parts = [];
    if (bizName) parts.push(`Business: ${bizName}`);
    if (bizType) parts.push(`Type: ${bizType}`);
    if (location) parts.push(`Location: ${location}`);
    if (tones.length) parts.push(`Tone: ${tones.join(", ")}`);
    if (signOff) parts.push(`Sign-off: ${signOff}`);
    return parts.length ? parts.join(" · ") : "Fill in the fields above to preview your brand voice.";
  };

  return (
    <>
      <style>{S}</style>
      <div className="bv">
        <button className="back-btn" onClick={() => goTo("dashboard")}>
          ← Back to dashboard
        </button>

        <div className="bv-title">Brand Voice</div>
        <p className="bv-sub">
          Tell Rply about your business so every response sounds authentically like you, not a generic template.
        </p>

        <div className="bv-row" style={{marginBottom:28}}>
          <div>
            <label className="bv-label">Business name</label>
            <input className="bv-input" placeholder="e.g. Tony's Pizza" value={bizName} onChange={e=>setBizName(e.target.value)} />
          </div>
          <div>
            <label className="bv-label">Business type</label>
            <input className="bv-input" placeholder="e.g. Italian restaurant" value={bizType} onChange={e=>setBizType(e.target.value)} />
          </div>
        </div>

        <div className="bv-row" style={{marginBottom:28}}>
          <div>
            <label className="bv-label">Location</label>
            <input className="bv-input" placeholder="e.g. Downtown Dubai, UAE" value={location} onChange={e=>setLocation(e.target.value)} />
          </div>
          <div>
            <label className="bv-label">Owner / manager name</label>
            <input className="bv-input" placeholder="e.g. Tony" value={ownerName} onChange={e=>setOwnerName(e.target.value)} />
          </div>
        </div>

        <div className="bv-section">
          <label className="bv-label">Preferred sign-off</label>
          <div className="bv-hint">How you want to end every response</div>
          <input className="bv-input" placeholder="e.g. Warm regards, Tony and the team" value={signOff} onChange={e=>setSignOff(e.target.value)} />
        </div>

        <div className="bv-section">
          <label className="bv-label">Tone of voice (pick up to 3)</label>
          <div className="bv-hint">How your brand sounds to customers</div>
          <div className="tone-grid">
            {TONES.map(t => (
              <div key={t} className={`tone-chip ${tones.includes(t)?"on":""}`} onClick={()=>toggleTone(t)}>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="bv-section">
          <label className="bv-label">Common complaints you receive</label>
          <div className="bv-hint">Helps Rply address these more naturally</div>
          <textarea className="bv-textarea" rows={3}
            placeholder="e.g. Wait times during weekends, parking, noise levels..."
            value={complaints} onChange={e=>setComplaints(e.target.value)} />
        </div>

        <div className="bv-section">
          <label className="bv-label">Anything else Rply should know</label>
          <div className="bv-hint">Special offers, awards, values, what makes you different</div>
          <textarea className="bv-textarea" rows={3}
            placeholder="e.g. We won Best Pizza 2024, we offer a loyalty card, we source ingredients locally..."
            value={extras} onChange={e=>setExtras(e.target.value)} />
        </div>

        <div className="preview-box">
          <div className="preview-label">Your brand voice summary</div>
          <div className="preview-text">{buildPreview()}</div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:16,marginTop:24}}>
          <button className="save-btn" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save brand voice"}
          </button>
          {saved && <div className="success">Saved! Your responses will now reflect your brand.</div>}
        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy,
} from "firebase/firestore";

const S = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.rq{font-family:'DM Sans',sans-serif;color:#0f0e0c;-webkit-font-smoothing:antialiased;max-width:860px;margin:0 auto;padding:48px 24px 80px}
.rq-title{font-family:'DM Serif Display',serif;font-size:26px;font-weight:400;margin-bottom:6px}
.rq-sub{font-size:14px;color:#9a9590;margin-bottom:32px}
.back-btn{background:none;border:none;font-family:'DM Sans',sans-serif;font-size:13px;color:#9a9590;cursor:pointer;padding:0;margin-bottom:24px;display:flex;align-items:center;gap:6px}
.back-btn:hover{color:#0f0e0c}
.add-box{background:#fff;border:1px solid #e8e4de;border-radius:14px;padding:22px 24px;margin-bottom:24px}
.add-title{font-size:13px;font-weight:600;color:#0f0e0c;margin-bottom:14px}
.rq-input,.rq-textarea{width:100%;font-family:'DM Sans',sans-serif;font-size:14px;color:#0f0e0c;background:#f8f7f4;border:1px solid #e8e4de;border-radius:8px;padding:10px 14px;outline:none;transition:border-color .15s}
.rq-input:focus,.rq-textarea:focus{border-color:#b0aba3;background:#fff}
.rq-input::placeholder,.rq-textarea::placeholder{color:#c8c3bb}
.rq-textarea{resize:none;line-height:1.6}
.add-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media(max-width:520px){.add-row{grid-template-columns:1fr}}
.star-row{display:flex;gap:4px;align-items:center;margin-bottom:12px}
.star-btn{background:none;border:none;cursor:pointer;font-size:22px;padding:2px;line-height:1;opacity:.2;transition:opacity .12s}
.star-btn.lit{opacity:1}
.star-label{font-size:12px;color:#9a9590;margin-left:6px}
.rq-btn{background:#0f0e0c;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:9px 20px;cursor:pointer}
.rq-btn:disabled{opacity:.5;cursor:not-allowed}
.rq-btn-ghost{background:#fff;color:#4a4740;border:1px solid #e8e4de;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:6px 12px;cursor:pointer;transition:all .15s}
.rq-btn-ghost:hover{border-color:#b0aba3}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.filter-btn{font-size:12px;font-weight:500;padding:5px 14px;border-radius:20px;border:1px solid #e8e4de;background:#fff;color:#6b6760;cursor:pointer;transition:all .15s}
.filter-btn.on{background:#0f0e0c;color:#fff;border-color:#0f0e0c}
.queue-list{display:flex;flex-direction:column;gap:12px}
.q-card{background:#fff;border:1px solid #e8e4de;border-radius:14px;padding:20px 22px;transition:opacity .2s}
.q-card.done{opacity:.5}
.q-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;flex-wrap:wrap}
.q-name{font-size:15px;font-weight:500;color:#0f0e0c}
.q-meta{font-size:12px;color:#9a9590;margin-bottom:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.q-review{font-size:13px;color:#4a4740;line-height:1.6;font-style:italic;margin-bottom:14px}
.q-actions{display:flex;gap:8px;flex-wrap:wrap}
.q-response{background:#f8f7f4;border:1px solid #e8e4de;border-radius:10px;padding:14px;margin-top:12px}
.q-response-label{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9a9590;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.q-response-text{font-size:13px;color:#0f0e0c;line-height:1.7}
.status-badge{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:2px 9px;border-radius:20px;border:1px solid}
.s-pending{color:#92400e;background:#fef3c7;border-color:#fcd7a0}
.s-generated{color:#1a56b0;background:#eff6ff;border-color:#bfdbfe}
.s-done{color:#1a6644;background:#edf7f1;border-color:#b6e4cc}
.spin{display:inline-block;width:13px;height:13px;border:1.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:rot .65s linear infinite;vertical-align:middle;margin-right:5px}
@keyframes rot{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:60px 20px;color:#9a9590;font-size:14px}
.copy-btn{background:#fff;border:1px solid #e8e4de;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:11px;color:#4a4740;padding:3px 9px;cursor:pointer}
`;

const STAR_LABELS = ["","Terrible","Poor","Average","Good","Excellent"];

function StarPicker({ value, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div className="star-row">
      {[1,2,3,4,5].map(n => (
        <button key={n} className={`star-btn ${(hov||value)>=n?"lit":""}`}
          onClick={()=>onChange(n)} onMouseEnter={()=>setHov(n)} onMouseLeave={()=>setHov(0)}>★</button>
      ))}
      {(hov||value)>0 && <span className="star-label">{STAR_LABELS[hov||value]}</span>}
    </div>
  );
}

export default function ReviewQueue({ user, goTo }) {
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [genning,   setGenning]   = useState({});
  const [copied,    setCopied]    = useState({});

  // Add form
  const [reviewer,  setReviewer]  = useState("");
  const [stars,     setStars]     = useState(0);
  const [reviewTxt, setReviewTxt] = useState("");
  const [tone,      setTone]      = useState("friendly");
  const [adding,    setAdding]    = useState(false);

  const colRef = () => collection(db, "users", user.uid, "queue");

  useEffect(() => {
    getDocs(query(colRef(), orderBy("createdAt", "desc")))
      .then(snap => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addReview = async () => {
    if (!reviewTxt.trim() || !stars) return;
    setAdding(true);
    const entry = {
      reviewer: reviewer || "Anonymous",
      stars, review: reviewTxt.trim(), tone,
      status: "pending", response: "",
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(colRef(), entry);
    setReviews(r => [{ id: ref.id, ...entry }, ...r]);
    setReviewer(""); setStars(0); setReviewTxt("");
    setAdding(false);
  };

  const generateResponse = async (item) => {
    setGenning(g => ({...g, [item.id]: true}));
    const bv = user.brandVoice || {};
    const brandLines = [
      bv.bizType    && `Business type: ${bv.bizType}`,
      bv.location   && `Location: ${bv.location}`,
      bv.ownerName  && `Owner name: ${bv.ownerName}`,
      bv.tones?.length && `Brand tone: ${bv.tones.join(", ")}`,
      bv.complaints && `Common complaints: ${bv.complaints}`,
      bv.extras     && `About the business: ${bv.extras}`,
      bv.signOff    && `Preferred sign-off: ${bv.signOff}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are a professional reputation manager for local businesses.
${brandLines ? `\nBrand voice profile:\n${brandLines}\n` : ""}
A customer left this ${item.stars}-star review${user.savedBiz ? ` for "${user.savedBiz}"` : ""}:

"${item.review}"

Write a ${item.tone} response from the business owner. Rules:
- Under 100 words
- Acknowledge specific feedback mentioned
- Sound like a real human business owner, not a template
- ${item.stars <= 2 ? "Apologize sincerely and offer to make it right" : "Thank them warmly and invite them back"}
- Do NOT open with "Thank you for your review"
- Use the preferred sign-off if provided, otherwise end naturally
- Never use placeholder text like [Business Owner Name]

Return ONLY the response. No preamble, no labels.`;

    try {
      const res  = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({prompt}) });
      const data = await res.json();
      const response = data.text || "";
      await updateDoc(doc(db, "users", user.uid, "queue", item.id), { response, status:"generated" });
      setReviews(r => r.map(x => x.id===item.id ? {...x, response, status:"generated"} : x));
    } catch {}
    setGenning(g => ({...g, [item.id]: false}));
  };

  const markDone = async (item) => {
    await updateDoc(doc(db, "users", user.uid, "queue", item.id), { status:"done" });
    setReviews(r => r.map(x => x.id===item.id ? {...x, status:"done"} : x));
  };

  const remove = async (item) => {
    await deleteDoc(doc(db, "users", user.uid, "queue", item.id));
    setReviews(r => r.filter(x => x.id!==item.id));
  };

  const copy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(c => ({...c, [id]: true}));
    setTimeout(() => setCopied(c => ({...c, [id]: false})), 2000);
  };

  const filtered = filter==="all" ? reviews : reviews.filter(r => r.status===filter);
  const counts   = { pending: reviews.filter(r=>r.status==="pending").length, generated: reviews.filter(r=>r.status==="generated").length, done: reviews.filter(r=>r.status==="done").length };

  return (
    <>
      <style>{S}</style>
      <div className="rq">
        <button className="back-btn" onClick={()=>goTo("dashboard")}>← Back to dashboard</button>
        <div className="rq-title">Review Queue</div>
        <p className="rq-sub">Add reviews, generate responses, mark them done. Your reputation to-do list.</p>

        {/* Add review */}
        <div className="add-box">
          <div className="add-title">Add a review</div>
          <div className="add-row">
            <input className="rq-input" placeholder="Reviewer name (optional)" value={reviewer} onChange={e=>setReviewer(e.target.value)} />
            <select className="rq-input" value={tone} onChange={e=>setTone(e.target.value)} style={{cursor:"pointer"}}>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="apologetic">Apologetic</option>
              <option value="grateful">Grateful</option>
            </select>
          </div>
          <StarPicker value={stars} onChange={setStars} />
          <textarea className="rq-textarea" rows={3} placeholder="Paste the review here..." value={reviewTxt} onChange={e=>setReviewTxt(e.target.value)} style={{marginBottom:12}} />
          <button className="rq-btn" onClick={addReview} disabled={adding||!reviewTxt.trim()||!stars}>
            {adding ? "Adding..." : "Add to queue"}
          </button>
        </div>

        {/* Filters */}
        <div className="filters">
          <button className={`filter-btn ${filter==="all"?"on":""}`} onClick={()=>setFilter("all")}>All ({reviews.length})</button>
          <button className={`filter-btn ${filter==="pending"?"on":""}`} onClick={()=>setFilter("pending")}>Pending ({counts.pending})</button>
          <button className={`filter-btn ${filter==="generated"?"on":""}`} onClick={()=>setFilter("generated")}>Generated ({counts.generated})</button>
          <button className={`filter-btn ${filter==="done"?"on":""}`} onClick={()=>setFilter("done")}>Done ({counts.done})</button>
        </div>

        {loading && <div className="empty">Loading queue...</div>}
        {!loading && filtered.length===0 && <div className="empty">{filter==="all" ? "No reviews in queue yet. Add one above!" : `No ${filter} reviews.`}</div>}

        <div className="queue-list">
          {filtered.map(item => (
            <div key={item.id} className={`q-card ${item.status==="done"?"done":""}`}>
              <div className="q-header">
                <div>
                  <div className="q-name">{item.reviewer}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span className={`status-badge s-${item.status}`}>{item.status}</span>
                  {item.status!=="done" && (
                    <button className="rq-btn" style={{fontSize:12,padding:"6px 14px"}} onClick={()=>generateResponse(item)} disabled={genning[item.id]}>
                      {genning[item.id] ? <><span className="spin"/>Generating...</> : item.response ? "Regenerate" : "Generate response"}
                    </button>
                  )}
                  {item.status==="generated" && (
                    <button className="rq-btn-ghost" style={{color:"#1a6644",borderColor:"#b6e4cc",background:"#edf7f1"}} onClick={()=>markDone(item)}>Mark posted</button>
                  )}
                  <button className="rq-btn-ghost" style={{color:"#991b1b",borderColor:"#fecaca"}} onClick={()=>remove(item)}>Remove</button>
                </div>
              </div>

              <div className="q-meta">
                <span>{"★".repeat(item.stars)}{"☆".repeat(5-item.stars)}</span>
                <span>{item.tone}</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="q-review">"{item.review}"</p>

              {item.response && (
                <div className="q-response">
                  <div className="q-response-label">
                    <span>Generated response</span>
                    <button className="copy-btn" onClick={()=>copy(item.id, item.response)}>
                      {copied[item.id] ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="q-response-text">{item.response}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import '../styles/cosmic-dashboard.css';
import PregnancyJourneyExtras from './PregnancyJourneyExtras';

type SharedNote = { id:number; author_name:string; note_date:string; body:string; is_mine:boolean; read_at:string|null };
type Relationship = {
 id:number; relationship_type:'observer'|'co_tracker'; status:string; companion_name:string|null; companion_journey?:'cycle'|'fertility'|'pregnancy'|'postpartum'|null; companion_pregnancy_summary?:{status:string;due_date:string;gestational_week:number|null;trimester:number|null;days_until_due:number|null;baby_name?:string|null;baby_birth_date?:string|null;baby_birth_time?:string|null;baby_birth_place?:string|null}|null;
 companion_cycle_summary:{cycle_day:number;last_period_start:string;estimated_next_period:string|null}|null;
 companion_wellbeing:{log_date:string;symptoms?:string[];mood?:string[];energy_level?:number|null;notes?:string|null}|null;
};
type Dashboard = { user:{name:string}; profile:{relationship_role:'tracker'|'support';active_journey:string}; cycle_day:number|null; today_checkin:{symptoms:string[];mood:string[]|string|null;notes:string|null}|null; relationships:Relationship[] };
type Insight = { compatibility:{available:boolean;score:number|null;summary:string;themes:{label:string;left:string;right:string;text:string}[]}; daily:{title:string;tip:string;transit_note:string;cycle_context?:{phase:string;cycle_day:number|null;available?:boolean};transits:{name:string;sign?:string|null}[]} };
type NotesPayload = {notes:SharedNote[];can_write:boolean;today_note:{body:string;read_at:string|null}|null};
function csrf(){return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'';}
async function json(response:Response){return response.json().catch(()=>({})) as Promise<Record<string,any>>;}
export default function SharedPartnerSpace(){
 const [relationship,setRelationship]=useState<Relationship|null>(null);
 const [role,setRole]=useState<'tracker'|'support'>('tracker');
 const [checkin,setCheckin]=useState<Dashboard['today_checkin']>(null);
 const [insight,setInsight]=useState<Insight|null>(null);
 const [notes,setNotes]=useState<NotesPayload|null>(null);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{let live=true;(async()=>{try{
  const response=await fetch('/api/dashboard',{credentials:'same-origin',headers:{Accept:'application/json'}});
  if(!response.ok)return;const data=await response.json() as Dashboard;
  if(!live)return;setRole(data.profile.relationship_role);setCheckin(data.today_checkin);
  const rel=(data.relationships??[]).find(item=>item.status==='accepted'&&(item.relationship_type==='observer'||item.relationship_type==='co_tracker'));
  if(!rel)return;setRelationship(rel);
  const [noteResponse,insightResponse]=await Promise.all([
   fetch('/api/relationships/'+rel.id+'/notes',{credentials:'same-origin',headers:{Accept:'application/json'}}),
   fetch('/api/relationships/'+rel.id+'/insights',{credentials:'same-origin',headers:{Accept:'application/json'}})
  ]);
  if(!live)return;
  if(noteResponse.ok){const payload=await noteResponse.json() as NotesPayload;setNotes(payload);setDraft(payload.today_note?.body??'');}
  if(insightResponse.ok)setInsight(await insightResponse.json() as Insight);
 }catch{/* The dashboard remains usable if shared data is temporarily unavailable. */}})();return()=>{live=false;}},[]);
 async function saveNote(event:FormEvent){event.preventDefault();if(!relationship||!draft.trim())return;setBusy(true);setMessage('');
  try{const response=await fetch('/api/relationships/'+relationship.id+'/notes',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/json','X-CSRF-TOKEN':csrf()},body:JSON.stringify({body:draft})});const data=await json(response);if(!response.ok)throw new Error(data.message??'Could not save your note.');setMessage('Your note has been saved.');const refreshed=await fetch('/api/relationships/'+relationship.id+'/notes',{credentials:'same-origin',headers:{Accept:'application/json'}});if(refreshed.ok)setNotes(await refreshed.json() as NotesPayload);}
  catch(error){setMessage(error instanceof Error?error.message:'Could not save your note.');}finally{setBusy(false);}
 }
 if(!relationship)return null;
 const sharedSymptoms=relationship.relationship_type==='co_tracker'?(relationship.companion_wellbeing?.symptoms??[]):role==='support'?(relationship.companion_wellbeing?.symptoms??[]):(checkin?.symptoms??[]);
 const sharedDate=role==='support'||relationship.relationship_type==='co_tracker'?relationship.companion_wellbeing?.log_date:null;
 const sharedMood=relationship.relationship_type==='co_tracker'?(relationship.companion_wellbeing?.mood??[]):role==='support'?(relationship.companion_wellbeing?.mood??[]):(Array.isArray(checkin?.mood)?checkin?.mood??[]:typeof checkin?.mood==='string'?checkin.mood.split(','):[]);
 return <section id="shared-partner-space" className="cosmic-week-card cosmic-shared-partner-space">
  <div className="cosmic-section-heading"><div><p className="cosmic-eyebrow">YOUR SHARED PARTNER SPACE</p><h2>A little closer, today</h2><p className="cosmic-muted">A private space for the updates you have chosen to share, daily notes and gentle relationship reflections.</p></div><span className="cosmic-guide-stamp" aria-hidden="true">♡</span></div>
  <div className="cosmic-shared-space-grid">
   <article className="cosmic-shared-space-card"><p className="cosmic-eyebrow">TODAY'S CHECK-IN</p><h3>{role==='support'?'Their day, as shared':'Your day'}</h3>{sharedSymptoms.length||sharedMood.length?<><p>{[...sharedSymptoms,...sharedMood].join(' · ')}</p><small>{role==='support'?'From the check-in your partner chose to share.':'Your logged symptoms and mood for today.'}</small></>:<p className="cosmic-muted">No symptoms or mood updates to show today. A check-in is always optional.</p>}</article>
   <article className="cosmic-shared-space-card"><p className="cosmic-eyebrow">COSMIC COMPATIBILITY</p><h3>{insight?.compatibility.available&&insight.compatibility.score!=null?insight.compatibility.score+'% reflective snapshot':'Your shared sky'}</h3><p>{insight?.compatibility.summary??'Opt in to astrology and add birth details to explore your natal connection.'}</p><a href="/astrology">Explore The Cosmic Atelier ↗</a></article>
   <article className="cosmic-shared-space-card cosmic-shared-space-card--daily"><p className="cosmic-eyebrow">TODAY'S RELATIONSHIP TIP</p><h3>{insight?.daily.title??'Ask, do not assume'}</h3><p>{insight?.daily.tip??'Ask what kind of support would feel good today: listening, practical help, company or space.'}</p>{insight?.daily.cycle_context&&insight.daily.cycle_context.available!==false&&<small>Cycle-aware reflection · {insight.daily.cycle_context.phase.replace(/-/g,' ')}{insight.daily.cycle_context.cycle_day?' · estimated day '+insight.daily.cycle_context.cycle_day:''}</small>}</article>
   <article className="cosmic-shared-space-card"><p className="cosmic-eyebrow">A NOTE FROM THE HEART</p><h3>{notes?.can_write?'Send a little note':'Your shared notes'}</h3>{notes?.can_write&&<form className="cosmic-shared-note-form" onSubmit={saveNote}><textarea value={draft} maxLength={1200} rows={3} onChange={event=>setDraft(event.target.value)} placeholder="What would you like your partner to know today?"/><button type="submit" disabled={busy||!draft.trim()}>{busy?'Saving…':notes.today_note?'Update today’s note':'Send today’s note'}</button></form>}{message&&<small role="status">{message}</small>}<div className="cosmic-shared-note-history">{(notes?.notes??[]).slice().reverse().map(note=><article key={note.id}><div><strong>{note.is_mine?'You':note.author_name}</strong><small>{note.note_date}</small></div><p>{note.body}</p><small>{note.is_mine?(note.read_at?'Read by your partner':'Not read yet'):(note.read_at?'Read':'New note')}</small></article>)}</div></article>
  </div>
  {(relationship.companion_journey === 'pregnancy' || relationship.companion_journey === 'postpartum') && <PregnancyJourneyExtras week={relationship.companion_pregnancy_summary?.gestational_week ?? 1} trimester={relationship.companion_pregnancy_summary?.trimester ?? 1} postpartum={relationship.companion_journey === 'postpartum'} partnerView baby={relationship.companion_pregnancy_summary ? {name:relationship.companion_pregnancy_summary.baby_name,birth_date:relationship.companion_pregnancy_summary.baby_birth_date,birth_time:relationship.companion_pregnancy_summary.baby_birth_time,birth_place:relationship.companion_pregnancy_summary.baby_birth_place} : null} />}
  <p className="cosmic-fineprint">Astrology and cycle reflections are estimates for conversation and care, not medical advice, consent, or a guarantee about fertility or mood.</p>
 </section>;
}

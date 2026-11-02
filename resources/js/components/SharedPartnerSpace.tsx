import { useEffect, useRef, useState, type FormEvent } from 'react';
import '../styles/cosmic-dashboard.css';
import PregnancyJourneyExtras from './PregnancyJourneyExtras';

type SharedNote = { id:number; author_name:string; note_date:string; body:string; is_mine:boolean; read_at:string|null; created_at?:string|null };
type Relationship = {
 id:number; relationship_type:'observer'|'co_tracker'; status:string; companion_name:string|null; companion_journey?:'cycle'|'fertility'|'pregnancy'|'postpartum'|null; companion_pregnancy_summary?:{status:string;due_date:string;gestational_week:number|null;trimester:number|null;days_until_due:number|null;baby_name?:string|null;baby_birth_date?:string|null;baby_birth_time?:string|null;baby_birth_place?:string|null}|null;
 companion_cycle_summary:{cycle_day:number;last_period_start:string;cycle_phase?:{phase:'menstrual'|'follicular'|'ovulatory'|'luteal'|'unknown';is_estimated:boolean;presentation_status?:'pending'|'dismissed'|'acknowledged'|null}|null;last_period_end?:string|null;flow_intensity?:string|null;estimated_next_period:string|null;estimated_ovulation_date?:string|null;estimated_fertile_start?:string|null;estimated_fertile_end?:string|null;estimated_cycle_length?:number|null;period_is_active?:boolean;current_period_day?:number|null}|null;
 companion_wellbeing:{log_date:string;symptoms?:string[];mood?:string[];energy_level?:string|null;notes?:string|null}|null;
 companion_sharing_preferences?:{cycle_details?:boolean;wellbeing_updates?:boolean;intimate_updates?:boolean;pregnancy_details?:boolean;astrology?:boolean};
 companion_intimacy?:{log_date:string;sex_drive:number|null;activities:string[];protection_methods:string[];orgasm:boolean|null;notes:string|null}[]|null;
};
type Dashboard = { user:{name:string}; profile:{relationship_role?:'tracker'|'support';active_journey?:string;display_name?:string|null}; cycle_day?:number|null; cycle_phase?:{phase:'menstrual'|'follicular'|'ovulatory'|'luteal'|'unknown';is_estimated:boolean;presentation_status?:'pending'|'dismissed'|'acknowledged'|null}|null; latest_period?:{start_date:string;end_date:string|null}|null; period_is_active?:boolean; current_period_day?:number|null; today_checkin?:{log_date?:string;symptoms:string[];mood:string[]|string|null;notes:string|null;energy_level?:string|null}|null; relationships?:Relationship[] };
type Insight = { compatibility:{available:boolean;score:number|null;summary:string;themes:{label:string;left:string;right:string;text:string}[]}; daily:{title:string;tip:string;transit_note:string;cycle_context?:{phase:string;cycle_day:number|null;available?:boolean};transits:{name:string;sign?:string|null}[]} };
type NotesPayload = {notes:SharedNote[];can_write:boolean;today_note:{body:string;read_at:string|null}|null};
const wellbeingLabels: Record<string, { label: string; icon: string }> = {
    calm: { label: 'Calm', icon: 'spa' }, zen: { label: 'At peace', icon: 'self_improvement' },
    cramps: { label: 'Menstrual cramps', icon: 'healing' }, pelvic_pain: { label: 'Pelvic pain', icon: 'healing' },
    painful_bowel_movement: { label: 'Painful bowel movements', icon: 'favorite' }, painful_urination: { label: 'Painful urination', icon: 'water_drop' },
    dizziness: { label: 'Dizziness', icon: 'cyclone' }, breast_tenderness: { label: 'Breast tenderness', icon: 'health_and_safety' },
    bloating: { label: 'Bloating', icon: 'spa' }, nausea: { label: 'Nausea', icon: 'medication' }, diarrhea: { label: 'Diarrhoea', icon: 'water_drop' },
    gas: { label: 'Gas', icon: 'air' }, appetite_increase: { label: 'Increased appetite', icon: 'restaurant' },
    sweet_cravings: { label: 'Sweet cravings', icon: 'cookie' }, savoury_cravings: { label: 'Savoury cravings', icon: 'lunch_dining' },
    creamy_discharge: { label: 'Creamy discharge', icon: 'water_drop' }, fatigue: { label: 'Fatigue', icon: 'bedtime' },
    libido_decrease: { label: 'Lower libido', icon: 'favorite' }, headache: { label: 'Headache', icon: 'psychology' },
    migraine: { label: 'Migraine', icon: 'psychology' }, mood_swings: { label: 'Mood changes', icon: 'mood' },
};
function wellbeingLabel(value: string) {
    return wellbeingLabels[value] ?? { label: value.replace(/[_-]+/g, ' ').replace(/\\b\\w/g, letter => letter.toUpperCase()), icon: 'spa' };
}
function wellbeingPill(value: string) {
    const item = wellbeingLabel(value);
    return <span className="cosmic-wellbeing-pill" key={value}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span>{item.label}</span>;
}
function csrf(){return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'';}
async function json(response:Response){return response.json().catch(()=>({})) as Promise<Record<string,any>>;}
export default function SharedPartnerSpace({data}:{data?:Dashboard}){
 const [relationship,setRelationship]=useState<Relationship|null>(null);
 const [myName,setMyName]=useState('');
 const [role,setRole]=useState<'tracker'|'support'>('tracker');
 const [checkin,setCheckin]=useState<Dashboard['today_checkin']>(null);
 const [periodUpdate,setPeriodUpdate]=useState<{active:boolean;day:number|null;start:string|null}>({active:false,day:null,start:null});
 const [insight,setInsight]=useState<Insight|null>(null);
 const [notes,setNotes]=useState<NotesPayload|null>(null);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const threadRef=useRef<HTMLDivElement|null>(null);
 const relationshipId=relationship?.id;
 useEffect(()=>{let live=true;
  void (async()=>{try{
   let snapshot=data;
   if(!snapshot){const response=await fetch('/api/dashboard',{credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)return;snapshot=await response.json() as Dashboard;}
   if(!live)return;
   setRole(snapshot.profile.relationship_role??'tracker');setMyName(snapshot.profile.display_name?.trim()||snapshot.user.name?.trim()||'You');setCheckin(snapshot.today_checkin??null);setPeriodUpdate({active:Boolean(snapshot.period_is_active),day:snapshot.current_period_day??null,start:snapshot.latest_period?.start_date??null});
   const rel=(snapshot.relationships??[]).find(item=>item.status==='accepted'&&(item.relationship_type==='observer'||item.relationship_type==='co_tracker'));
   if(!rel){setRelationship(null);setNotes(null);setInsight(null);return;}
   setRelationship(rel);
   const [noteResponse,insightResponse]=await Promise.all([
    fetch('/api/relationships/'+rel.id+'/notes',{credentials:'same-origin',headers:{Accept:'application/json'}}),
    fetch('/api/relationships/'+rel.id+'/insights',{credentials:'same-origin',headers:{Accept:'application/json'}})
   ]);
   if(!live)return;
   if(noteResponse.ok)setNotes(await noteResponse.json() as NotesPayload);
   if(insightResponse.ok)setInsight(await insightResponse.json() as Insight);
  }catch{/* Keep the last known shared content if a refresh fails. */}})();
  return()=>{live=false;};
 },[data]);
 useEffect(()=>{if(!relationshipId)return;const timer=window.setInterval(async()=>{if(document.hidden)return;try{
  const [dashboardResponse,notesResponse]=await Promise.all([
   fetch('/api/dashboard',{credentials:'same-origin',headers:{Accept:'application/json'}}),
   fetch('/api/relationships/'+relationshipId+'/notes',{credentials:'same-origin',headers:{Accept:'application/json'}})
  ]);
  if(dashboardResponse.ok){const latest=await dashboardResponse.json() as Dashboard;setRole(latest.profile.relationship_role??'tracker');setMyName(latest.profile.display_name?.trim()||latest.user.name?.trim()||'You');setCheckin(latest.today_checkin??null);setPeriodUpdate({active:Boolean(latest.period_is_active),day:latest.current_period_day??null,start:latest.latest_period?.start_date??null});const latestRelationship=(latest.relationships??[]).find(item=>item.id===relationshipId&&item.status==='accepted');if(latestRelationship)setRelationship(latestRelationship);}
  if(notesResponse.ok)setNotes(await notesResponse.json() as NotesPayload);
 }catch{/* keep the last known shared content */}},20000);return()=>window.clearInterval(timer);},[relationshipId]);
 const noteCount=notes?.notes.length??0;
 useEffect(()=>{const el=threadRef.current;if(el)el.scrollTop=el.scrollHeight;},[noteCount]);
 async function saveNote(event:FormEvent){event.preventDefault();if(!relationship||!draft.trim())return;setBusy(true);setMessage('');
  try{const response=await fetch('/api/relationships/'+relationship.id+'/notes',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/json','X-CSRF-TOKEN':csrf()},body:JSON.stringify({body:draft})});const data=await json(response);if(!response.ok)throw new Error(data.errors?.body?.[0]??data.message??'Could not send your message.');setDraft('');setMessage('');const refreshed=await fetch('/api/relationships/'+relationship.id+'/notes',{credentials:'same-origin',headers:{Accept:'application/json'}});if(refreshed.ok)setNotes(await refreshed.json() as NotesPayload);}
  catch(error){setMessage(error instanceof Error?error.message:'Could not send your message.');}finally{setBusy(false);}
 }
 if(!relationship)return null;
 // Keep these names role-aware: the companion name is the other person's name
 // in each account's relationship payload.
 const partnerName=role==='support'?(relationship.companion_name?.trim()||'your partner'):myName;
 const supportName=role==='support'?myName:(relationship.companion_name?.trim()||'your partner');
 const primaryName=role==='support'?partnerName:supportName;
 const sharedSymptoms=role==='support'?(relationship.companion_wellbeing?.symptoms??[]):(checkin?.symptoms??[]);
 const sharedDate=role==='support'?relationship.companion_wellbeing?.log_date:checkin?.log_date??null;
 const sharedMood=role==='support'?(relationship.companion_wellbeing?.mood??[]):(Array.isArray(checkin?.mood)?checkin?.mood??[]:typeof checkin?.mood==='string'?checkin.mood.split(','):[]);
 const partnerSymptoms=relationship.companion_wellbeing?.symptoms??[];
 const partnerMood=relationship.companion_wellbeing?.mood??[];
 const partnerEnergy=relationship.companion_wellbeing?.energy_level;
 const partnerDate=relationship.companion_wellbeing?.log_date;
 const sharedEnergy=role==='support'?relationship.companion_wellbeing?.energy_level:checkin?.energy_level;
 const currentCycleDay=data?.cycle_day??null;
 const ownLatestPeriod=data?.latest_period??null;
 const displayedPhase=role==='support'?relationship.companion_cycle_summary?.cycle_phase?.phase:data?.cycle_phase?.phase;\n const displayedPhaseStatus=role==='support'?(relationship.companion_cycle_summary?.cycle_phase?.presentation_status==='acknowledged'?'acknowledged':relationship.companion_cycle_summary?.cycle_phase?.is_estimated?'estimated':'logged'):(data?.phase_presentation?.status==='acknowledged'?'acknowledged':data?.cycle_phase?.phase==='menstrual'&&data?.cycle_phase?.cycle_start_is_confirmed?'logged':'estimated');
 return <section id="shared-partner-space" className={'cosmic-week-card cosmic-shared-partner-space '+(role==='support'?'is-support-view':'is-primary-view')+(displayedPhase&&displayedPhase!=='unknown'?' cosmic-shared-partner-space--phase-'+displayedPhase+' cosmic-shared-partner-space--phase-status-'+displayedPhaseStatus:'')} aria-labelledby="shared-partner-space-title">
  <span className="cosmic-shared-orbit cosmic-shared-orbit--one" aria-hidden="true">✦</span><span className="cosmic-shared-orbit cosmic-shared-orbit--two" aria-hidden="true">☾</span><span className="cosmic-shared-orbit cosmic-shared-orbit--three" aria-hidden="true">♡</span>
  <div className="cosmic-shared-hero">
   <div className="cosmic-shared-hero__copy"><p className="cosmic-eyebrow"><span aria-hidden="true">✧ </span>YOUR SHARED PARTNER SPACE <span aria-hidden="true"> ✧</span></p><h2 id="shared-partner-space-title">{role==='support'?'A little closer, today':'A little closer, today'}</h2><p>{role==='support'?'A softer place to show up for your person — with the updates they chose to share, thoughtful notes and gentle ways to connect.':'A private space for the updates you have chosen to share, daily notes and gentle relationship reflections.'}</p><div className="cosmic-shared-hero__promise"><span>♡</span> {role==='support'?'Care, not assumptions':'Your space, your pace'} <span>✦</span> Always optional</div></div>
   <div className="cosmic-shared-hero__art" aria-hidden="true"><span className="cosmic-shared-hero__moon">☾</span><span className="cosmic-shared-hero__heart">♡</span><span className="cosmic-shared-hero__flower">✿</span><span className="cosmic-shared-hero__spark">✧</span><span className="cosmic-shared-hero__star">✦</span></div>
  </div>
  <div className="cosmic-shared-space-grid">
   {role!=='support'&&<article className="cosmic-shared-space-card cosmic-shared-space-card--checkin"><span className="cosmic-shared-card-icon" aria-hidden="true">♡</span><p className="cosmic-eyebrow">TODAY'S CHECK-IN</p><h3>Your day</h3>{periodUpdate.active&&<p className="cosmic-checkin-period-confirmation"><span>✿</span><span>Period day {periodUpdate.day??1}{periodUpdate.start?' · began '+periodUpdate.start:''}</span></p>}{sharedSymptoms.length||sharedMood.length?<><div className="cosmic-support-tags cosmic-shared-checkin-tags">{[...sharedSymptoms,...sharedMood].filter((tag,index,all)=>Boolean(tag)&&all.indexOf(tag)===index).map(wellbeingPill)}</div><small>Your logged symptoms and mood for today.</small></>:periodUpdate.active?<p className="cosmic-muted">Your period start is today's check-in. Add symptoms or a wellbeing update whenever you wish.</p>:<p className="cosmic-muted">No symptoms or mood updates to show today. A check-in is always optional.</p>}{sharedEnergy&&<small className="cosmic-shared-date">Energy · {({low:'Running low',balanced:'Balanced',high:'High',peak:'Glowing'} as Record<string,string>)[sharedEnergy]??sharedEnergy}</small>}{sharedDate&&<small className="cosmic-shared-date">✧ Your update · {sharedDate}</small>}</article>}
   {role==='support'&&relationship.companion_wellbeing&&<article className="cosmic-shared-space-card cosmic-shared-space-card--checkin"><span className="cosmic-shared-card-icon" aria-hidden="true">♡</span><p className="cosmic-eyebrow">YOUR PARTNER'S CHECK-IN</p><h3>{primaryName}'s day</h3>{relationship.companion_wellbeing.symptoms?.length||relationship.companion_wellbeing.mood?.length?<div className="cosmic-support-tags cosmic-shared-checkin-tags">{[...(relationship.companion_wellbeing.symptoms??[]),...(relationship.companion_wellbeing.mood??[])].filter((tag,index,all)=>Boolean(tag)&&all.indexOf(tag)===index).map(wellbeingPill)}</div>:<p className="cosmic-muted">A wellbeing update was shared, without symptom or mood details.</p>}{relationship.companion_wellbeing.energy_level&&<small className="cosmic-shared-date">Energy · {({low:'Running low',balanced:'Balanced',high:'High',peak:'Glowing'} as Record<string,string>)[relationship.companion_wellbeing.energy_level]??relationship.companion_wellbeing.energy_level}</small>}{relationship.companion_wellbeing.notes&&<p className="cosmic-shared-date">{relationship.companion_wellbeing.notes}</p>}<small className="cosmic-shared-date">✧ Shared update · {relationship.companion_wellbeing.log_date}</small></article>}
   {role!=='support'&&relationship.relationship_type==='co_tracker'&&relationship.companion_sharing_preferences?.wellbeing_updates&&<article className="cosmic-shared-space-card cosmic-shared-space-card--checkin"><span className="cosmic-shared-card-icon" aria-hidden="true">✿</span><p className="cosmic-eyebrow">YOUR PARTNER'S CHECK-IN</p><h3>{primaryName}'s day, as shared</h3>{partnerSymptoms.length||partnerMood.length?<div className="cosmic-support-tags cosmic-shared-checkin-tags">{[...partnerSymptoms,...partnerMood].filter((tag,index,all)=>Boolean(tag)&&all.indexOf(tag)===index).map(wellbeingPill)}</div>:<p className="cosmic-muted">No wellbeing update has been shared for today.</p>}{partnerEnergy&&<small className="cosmic-shared-date">Energy · {({low:'Running low',balanced:'Balanced',high:'High',peak:'Glowing'} as Record<string,string>)[partnerEnergy]??partnerEnergy}</small>}{partnerDate&&<small className="cosmic-shared-date">✧ Shared update · {partnerDate}</small>}</article>}
   {role!=='support'&&currentCycleDay!==null&&<article className="cosmic-shared-space-card cosmic-shared-space-card--checkin"><span className="cosmic-shared-card-icon" aria-hidden="true">☾</span><p className="cosmic-eyebrow">YOUR CYCLE UPDATE</p><h3>Your cycle · Day {currentCycleDay}</h3>{ownLatestPeriod?.start_date&&<small>Last period began {ownLatestPeriod.start_date}</small>}</article>}
   {role==='support'&&relationship.companion_intimacy&&relationship.companion_intimacy.length>0&&<article className="cosmic-shared-space-card cosmic-shared-space-card--checkin"><span className="cosmic-shared-card-icon" aria-hidden="true">♡</span><p className="cosmic-eyebrow">INTIMATE WELLBEING, AS SHARED</p><h3>{primaryName}'s personal updates</h3>{relationship.companion_intimacy.map((log,index)=><div className="cosmic-shared-intimacy-entry" key={log.log_date+'-'+index}><small>{log.log_date}</small>{log.sex_drive!==null&&<p>Sex drive · {log.sex_drive}/5</p>}{log.activities.length>0&&<p>Activities · {log.activities.map(value=>value.replace(/_/g,' ')).join(', ')}</p>}{log.protection_methods.length>0&&<p>Protection · {log.protection_methods.map(value=>value.replace(/_/g,' ')).join(', ')}</p>}{log.orgasm!==null&&<p>Orgasm · {log.orgasm?'Yes':'No'}</p>}{log.notes&&<p>{log.notes}</p>}</div>)}</article>}
   {relationship.companion_cycle_summary&&<article className="cosmic-shared-space-card cosmic-shared-space-card--checkin"><span className="cosmic-shared-card-icon" aria-hidden="true">☾</span><p className="cosmic-eyebrow">A CYCLE UPDATE, AS SHARED</p><h3>{primaryName}'s cycle · Day {relationship.companion_cycle_summary.cycle_day}</h3><small>Last period began {relationship.companion_cycle_summary.last_period_start}</small>{relationship.companion_cycle_summary.last_period_end&&<small>Period ended {relationship.companion_cycle_summary.last_period_end}</small>}{relationship.companion_cycle_summary.period_is_active&&<p className="cosmic-checkin-period-confirmation"><span>✿</span><span>Period day {relationship.companion_cycle_summary.current_period_day??1} · confirmed</span></p>}{relationship.companion_cycle_summary.estimated_next_period&&<small className="cosmic-shared-date">Next period estimate · {relationship.companion_cycle_summary.estimated_next_period}</small>}{relationship.companion_cycle_summary.estimated_ovulation_date&&<small className="cosmic-shared-date">Estimated ovulation · {relationship.companion_cycle_summary.estimated_ovulation_date}</small>}{relationship.companion_cycle_summary.estimated_fertile_start&&relationship.companion_cycle_summary.estimated_fertile_end&&<small className="cosmic-shared-date">Estimated fertile window · {relationship.companion_cycle_summary.estimated_fertile_start} – {relationship.companion_cycle_summary.estimated_fertile_end}</small>}</article>}
   {role==='support'&&<article className="cosmic-shared-space-card cosmic-shared-space-card--daily"><span className="cosmic-shared-card-icon" aria-hidden="true">✿</span><p className="cosmic-eyebrow">CYCLE-AWARE RELATIONSHIP REFLECTION</p><h3>{insight?.daily.title??'Ask, do not assume'}</h3><p>{insight?.daily.tip??'Ask what kind of support would feel good today: listening, practical help, company or space.'}</p>{insight?.daily.cycle_context&&insight.daily.cycle_context.available!==false&&<small>Cycle-aware reflection · {insight.daily.cycle_context.phase.replace(/-/g,' ')}{insight.daily.cycle_context.cycle_day?' · estimated day '+insight.daily.cycle_context.cycle_day:''}</small>}</article>}
   <article className="cosmic-shared-space-card cosmic-shared-space-card--note cosmic-chat-card">
    <div className="cosmic-chat-head"><span className="cosmic-chat-avatar" aria-hidden="true">{partnerName.charAt(0).toUpperCase()||'♡'}</span><div><p className="cosmic-eyebrow">A NOTE FROM THE HEART</p><h3>{partnerName}</h3><small><i aria-hidden="true"/> {partnerName} ↔ {supportName} · private message board</small></div><span className="cosmic-chat-flower" aria-hidden="true">✿</span></div>
    <div className="cosmic-chat-thread" ref={threadRef} role="log" aria-live="polite" aria-label="Messages between you and your partner">
     {(notes?.notes??[]).length===0&&<div className="cosmic-chat-empty"><span aria-hidden="true">💌</span><p>{notes?.can_write?'No messages yet. Say something sweet — it will arrive here for '+partnerName+'.':'No messages yet. When '+partnerName+' leaves you a note it will appear here.'}</p></div>}
     {(notes?.notes??[]).map((note,index,all)=>{const showDay=index===0||all[index-1].note_date!==note.note_date;const time=note.created_at?new Date(note.created_at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'';return <div key={note.id} className="cosmic-chat-row">{showDay&&<div className="cosmic-chat-day"><span>✧ {new Date(note.note_date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})} ✧</span></div>}<div className={'cosmic-chat-msg '+(note.is_mine?'is-mine':'is-theirs')}><span className="cosmic-chat-msg__avatar" aria-hidden="true">{(note.is_mine?(role==='support'?supportName:partnerName):partnerName).charAt(0).toUpperCase()||'♡'}</span><div className={'cosmic-chat-bubble '+(note.is_mine?'is-mine':'is-theirs')}><span className="cosmic-chat-msg__name">{note.is_mine?'You':partnerName}</span><p>{note.body}</p><small>{time}{time&&' · '}{note.is_mine?(note.read_at?'Read ♡':'Delivered ✧'):(note.read_at?'Seen':'New')}</small></div></div></div>;})}
    </div>
    {notes?.can_write?<form className="cosmic-chat-composer" onSubmit={saveNote}><textarea aria-label={'Message to '+partnerName} value={draft} maxLength={1200} rows={2} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();event.currentTarget.form?.requestSubmit();}}} placeholder={'Write something for '+partnerName+'…'}/><button type="submit" disabled={busy||!draft.trim()} aria-label="Send message"><span aria-hidden="true">{busy?'…':'♡'}</span> Send</button></form>:<p className="cosmic-chat-readonly"><span aria-hidden="true">✿</span> Only {partnerName} can write on this board — you will see each message here, and they are told once you have read it.</p>}
    <small className="cosmic-chat-count">{draft.length>0?draft.length+'/1200 · ':''}Messages are only visible to the two of you.</small>
    {message&&<small role="status" className="cosmic-chat-error">{message}</small>}
   </article>
  </div>
  {(relationship.companion_journey === 'pregnancy' || relationship.companion_journey === 'postpartum') && <PregnancyJourneyExtras week={relationship.companion_pregnancy_summary?.gestational_week ?? 1} trimester={relationship.companion_pregnancy_summary?.trimester ?? 1} postpartum={relationship.companion_journey === 'postpartum'} partnerView baby={relationship.companion_pregnancy_summary ? {name:relationship.companion_pregnancy_summary.baby_name,birth_date:relationship.companion_pregnancy_summary.baby_birth_date,birth_time:relationship.companion_pregnancy_summary.baby_birth_time,birth_place:relationship.companion_pregnancy_summary.baby_birth_place} : null} />}
  <p className="cosmic-fineprint">Astrology and cycle reflections are estimates for conversation and care, not medical advice, consent, or a guarantee about fertility or mood.</p>
 </section>;
}

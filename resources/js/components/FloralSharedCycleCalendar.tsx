import { useMemo, useState } from 'react';
import '../styles/cosmic-dashboard.css';

type DailyCheckinSummary = {log_date:string;energy_level:string|null;mood:string[];symptoms:string[];notes:string|null};
type CycleCalendarSummary = {
  last_period_start:string; cycle_day:number; estimated_next_period:string|null;
  average_cycle_length:number|null; average_period_length:number|null;
  cycle_regularity:'regular'|'irregular'|'unknown'|string;
  fertility_estimate_available:boolean; estimated_ovulation_date:string|null;
  estimated_fertile_start:string|null; estimated_fertile_end:string|null;
  period_history:{start_date:string;end_date:string|null}[];
};
function keyOf(date:Date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function dateFromKey(value:string){return new Date(value+'T12:00:00');}
function label(value:string){return dateFromKey(value).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});}
function addDays(value:string,days:number){const d=dateFromKey(value);d.setDate(d.getDate()+days);return keyOf(d);}
function Flower({tone}:{tone:'period'|'fertile'|'ovulation'|'lower'}){return <span className={'cosmic-floral-marker cosmic-floral-marker--'+tone} aria-hidden="true">✿</span>;}
export default function FloralSharedCycleCalendar({cycle,ownerName='your partner',viewerName,editable=false,onEditDate,onSelectDate,selectedCheckin=null,historyLoading=false,onOpenSymptoms,initialSelectedDate}:{cycle:CycleCalendarSummary;ownerName?:string;viewerName?:string;editable?:boolean;onEditDate?:(date:string)=>void;onSelectDate?:(date:string)=>void;selectedCheckin?:DailyCheckinSummary|null;historyLoading?:boolean;onOpenSymptoms?:()=>void;initialSelectedDate?:string}){
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);});
 const [selected,setSelected]=useState(()=>initialSelectedDate??keyOf(new Date()));
 const days=useMemo(()=>{const first=new Date(month.getFullYear(),month.getMonth(),1);const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return [...Array((first.getDay()+6)%7).fill(null),...Array.from({length:count},(_,i)=>i+1)];},[month]);
 const periodDates=useMemo(()=>{const dates=new Set<string>();for(const p of cycle.period_history??[]){const end=p.end_date??addDays(p.start_date,Math.max(0,(cycle.average_period_length??5)-1));for(let d=p.start_date;d<=end;d=addDays(d,1))dates.add(d);}if(cycle.average_cycle_length&&cycle.estimated_next_period){for(let start=cycle.estimated_next_period;start<=addDays(cycle.estimated_next_period,cycle.average_cycle_length*2);start=addDays(start,cycle.average_cycle_length)){for(let i=0;i<(cycle.average_period_length??5);i++)dates.add(addDays(start,i));}}return dates;},[cycle]);
 const ovulation=cycle.estimated_ovulation_date;
 const fertileStart=cycle.estimated_fertile_start;
 const fertileEnd=cycle.estimated_fertile_end;
 function kind(date:string):'period'|'ovulation'|'fertile'|'lower'|'none'{if(periodDates.has(date))return 'period';if(cycle.fertility_estimate_available&&cycle.average_cycle_length&&cycle.last_period_start){const delta=Math.round((dateFromKey(date).getTime()-dateFromKey(cycle.last_period_start).getTime())/86400000);const length=cycle.average_cycle_length;const cycleOffset=Math.floor(delta/length);const projectedStart=addDays(cycle.last_period_start,cycleOffset*length);const projectedOvulation=addDays(projectedStart,length-15);const start=addDays(projectedOvulation,-5);const end=addDays(projectedOvulation,1);if(date===projectedOvulation)return 'ovulation';if(date>=start&&date<=end)return 'fertile';return 'lower';}if(cycle.fertility_estimate_available&&ovulation&&date===ovulation)return 'ovulation';if(cycle.fertility_estimate_available&&fertileStart&&fertileEnd&&date>=fertileStart&&date<=fertileEnd)return 'fertile';return cycle.fertility_estimate_available?'lower':'none';}
 const selectedKind=kind(selected);
 const detail=selectedKind==='period'?'Period day · recorded or estimated':selectedKind==='ovulation'?'Estimated ovulation day · often around day 14 in a typical 28-day cycle, but timing varies':selectedKind==='fertile'?'Estimated fertile window · pregnancy is more likely':selectedKind==='lower'?'Lower estimated fertility · not a guaranteed safe day':'Cycle estimate unavailable for this date';
 return <section className="cosmic-floral-calendar" aria-labelledby="floral-calendar-title">
  <div className="cosmic-floral-calendar__heading"><div><p className="cosmic-eyebrow">A SHARED RHYTHM, IN BLOOM</p><h3 id="floral-calendar-title">{ownerName}'s cycle calendar</h3><p>{editable?'Select a date to review your cycle, then add or update a period entry.':'View-only for '+(viewerName?.trim()||'you')+' · '+ownerName+' controls their own cycle entries'}</p></div><span aria-hidden="true">✿</span></div>
  <div className="cosmic-floral-calendar__month"><button type="button" aria-label="Previous month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><strong>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button type="button" aria-label="Next month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
  <div className="cosmic-floral-calendar__grid" role="group" aria-label="Read-only cycle calendar">
   {['M','T','W','T','F','S','S'].map((d,i)=><span className="cosmic-floral-calendar__weekday" key={d+i}>{d}</span>)}
   {days.map((day,i)=>{if(day===null)return <span className="cosmic-floral-calendar__blank" key={'blank'+i}/>;const date=keyOf(new Date(month.getFullYear(),month.getMonth(),day,12));const type=kind(date);return <button key={date} type="button" className={'cosmic-floral-calendar__day cosmic-floral-calendar__day--'+type+(selected===date?' is-selected':'')+(date===keyOf(new Date())?' is-today':'')} onClick={()=>{setSelected(date);onSelectDate?.(date);}} aria-pressed={selected===date} aria-label={label(date)+', '+(type==='period'?'period day':type==='fertile'?'estimated fertile day':type==='ovulation'?'estimated ovulation day':type==='lower'?'lower estimated fertility':'cycle estimate unavailable')}><span>{day}</span>{type!=='none'&&<Flower tone={type}/>}</button>;})}
  </div>
  <div className="cosmic-floral-calendar__legend"><span><Flower tone="period"/> Period days</span><span><Flower tone="fertile"/> Estimated fertile days</span><span><Flower tone="ovulation"/> Estimated ovulation</span><span><Flower tone="lower"/> Lower estimated fertility</span></div>
  <div className="cosmic-floral-calendar__selected">{selectedKind!=='none'&&<Flower tone={selectedKind}/>}<div><strong>{label(selected)}</strong><p>{detail}</p></div>{editable&&<button type="button" className="cosmic-floral-calendar__edit" onClick={()=>onEditDate?.(selected)}>＋ Log period</button>}</div>
  <section className="cosmic-floral-calendar__history" aria-live="polite" aria-label="Selected day wellbeing history">
   <div className="cosmic-floral-calendar__history-heading"><div><p className="cosmic-eyebrow">YOUR DAY, IN BLOOM</p><h4>{label(selected)}</h4></div><span aria-hidden="true">✧</span></div>
   {historyLoading?<p className="cosmic-floral-calendar__history-muted">Gathering this day's notes…</p>:selectedCheckin?.log_date===selected?<div className="cosmic-floral-calendar__history-content">
    {(selectedCheckin.energy_level||selectedCheckin.mood.length>0)&&<div className="cosmic-floral-calendar__history-meta">{selectedCheckin.energy_level&&<span><b>Energy</b> {({low:'Running low',balanced:'Balanced',high:'High',peak:'Glowing'} as Record<string,string>)[selectedCheckin.energy_level]??selectedCheckin.energy_level}</span>}{selectedCheckin.mood.length>0&&<span><b>Mood</b> {selectedCheckin.mood.map(m=>m.replaceAll('_',' ')).join(' · ')}</span>}</div>}
    {selectedCheckin.symptoms.length>0?<><p className="cosmic-floral-calendar__history-label">SYMPTOMS LOGGED</p><div className="cosmic-floral-calendar__history-tags">{selectedCheckin.symptoms.map(symptom=><span key={symptom}>{symptom.replaceAll('_',' ')}</span>)}</div></>:<p className="cosmic-floral-calendar__history-muted">No symptoms were recorded for this day.</p>}
    {selectedCheckin.notes&&<blockquote>{selectedCheckin.notes}</blockquote>}
   </div>:<p className="cosmic-floral-calendar__history-muted">Nothing logged for this day yet. You can still add symptoms or check in.</p>}
   {editable&&selected<=keyOf(new Date())&&<div className="cosmic-floral-calendar__history-actions"><button type="button" onClick={onOpenSymptoms}>✿ {selectedCheckin?.log_date===selected?'Edit / add symptoms':'Add symptoms'}</button><button type="button" onClick={()=>onEditDate?.(selected)}>＋ Log period</button></div>}
  </section>
  <p className="cosmic-floral-calendar__science">In a typical 28-day cycle, ovulation often happens around day 14, but it can shift even in regular cycles. An egg usually remains viable for about 12–24 hours after ovulation; sperm can survive for up to about 5 days. That's why the fertile window begins before ovulation. Blue flowers mean lower estimated fertility, not a safe day. A calendar cannot confirm ovulation or reliably prevent pregnancy.</p>
  {!cycle.fertility_estimate_available&&<p className="cosmic-floral-calendar__science">Fertility dates are not shown because the available cycle information does not support an estimate, or hormonal contraception may affect ovulation.</p>}
 </section>;
}

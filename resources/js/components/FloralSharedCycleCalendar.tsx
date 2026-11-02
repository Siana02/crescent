import { useEffect, useMemo, useState } from 'react';
import '../styles/cosmic-dashboard.css';

type DailyCheckinSummary = {log_date:string;energy_level:string|null;mood:string[];symptoms:string[];notes:string|null};
type SexLogSummary = {id:number;log_date:string;sex_drive:number|null;activities:string[];protection_methods:string[];orgasm:boolean|null;notes:string|null};
type CycleCalendarSummary = {
  last_period_start:string; cycle_day:number; estimated_next_period:string|null;
  average_cycle_length:number|null; estimated_cycle_length?:number|null; average_period_length:number|null;
  cycle_regularity:'regular'|'irregular'|'unknown'|string;
  fertility_estimate_available:boolean; estimated_ovulation_date:string|null;
  estimated_fertile_start:string|null; estimated_fertile_end:string|null;
  period_history:{start_date:string;end_date:string|null}[];
  cycle_phase?:{phase:'menstrual'|'follicular'|'ovulatory'|'luteal'|'unknown';is_estimated:boolean;presentation_status?:'pending'|'dismissed'|'acknowledged'|null}|null;
};
function keyOf(date:Date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function dateFromKey(value:string){return new Date(value+'T12:00:00');}
function label(value:string){return dateFromKey(value).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});}
function addDays(value:string,days:number){const d=dateFromKey(value);d.setDate(d.getDate()+days);return keyOf(d);}
function Flower({tone}:{tone:'period'|'estimated-period'|'fertile'|'ovulation'|'lower'}){return <span className={'cosmic-floral-marker cosmic-floral-marker--'+tone} aria-hidden="true">✿</span>;}
export default function FloralSharedCycleCalendar({cycle,ownerName='your partner',viewerName,editable=false,onEditDate,onSelectDate,selectedCheckin=null,selectedSexLogs=[],wellbeingHistory,sexLogHistory,historyLoading=false,historyError='',onRetryHistory,onOpenSymptoms,onOpenSex,initialSelectedDate,todayDate,activeDate,checkinDates=[]}:{cycle:CycleCalendarSummary;ownerName?:string;viewerName?:string;editable?:boolean;onEditDate?:(date:string)=>void;onSelectDate?:(date:string)=>void;selectedCheckin?:DailyCheckinSummary|null;selectedSexLogs?:SexLogSummary[];wellbeingHistory?:DailyCheckinSummary[];sexLogHistory?:SexLogSummary[];historyLoading?:boolean;historyError?:string;onRetryHistory?:()=>void;onOpenSymptoms?:()=>void;onOpenSex?:(date:string)=>void;initialSelectedDate?:string;todayDate?:string;activeDate?:string;checkinDates?:string[]}){
 const [month,setMonth]=useState(()=>{const d=dateFromKey(initialSelectedDate??keyOf(new Date()));return new Date(d.getFullYear(),d.getMonth(),1);});
 const [selected,setSelected]=useState(()=>initialSelectedDate??keyOf(new Date()));
 useEffect(()=>{if(activeDate&&activeDate!==selected){setSelected(activeDate);const d=dateFromKey(activeDate);setMonth(new Date(d.getFullYear(),d.getMonth(),1));}},[activeDate,selected]);
 const days=useMemo(()=>{const first=new Date(month.getFullYear(),month.getMonth(),1);const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return [...Array((first.getDay()+6)%7).fill(null),...Array.from({length:count},(_,i)=>i+1)];},[month]);
 const {confirmedPeriodDates,estimatedPeriodDates}=useMemo(()=>{
  const confirmed=new Set<string>();const estimated=new Set<string>();
  const today=todayDate??keyOf(new Date());const expectedDays=Math.max(1,cycle.average_period_length??5);
  const records=(cycle.period_history??[]).slice().sort((a,b)=>a.start_date.localeCompare(b.start_date));
  for(const period of records){
   if(period.end_date){for(let d=period.start_date;d<=period.end_date;d=addDays(d,1))confirmed.add(d);continue;}
   const isLatest=period.start_date===cycle.last_period_start;
   const estimateEnd=addDays(period.start_date,expectedDays-1);
   if(isLatest&&period.start_date<=today){
    for(let d=period.start_date;d<=today;d=addDays(d,1))confirmed.add(d);
    for(let d=addDays(today,1);d<=estimateEnd;d=addDays(d,1))estimated.add(d);
   }else{
    confirmed.add(period.start_date);
    for(let d=addDays(period.start_date,1);d<=estimateEnd;d=addDays(d,1))estimated.add(d);
   }
  }
  if(cycle.estimated_next_period){for(let d=cycle.estimated_next_period;d<=addDays(cycle.estimated_next_period,expectedDays-1);d=addDays(d,1))if(!confirmed.has(d))estimated.add(d);}
  return {confirmedPeriodDates:confirmed,estimatedPeriodDates:estimated};
 },[cycle.period_history,cycle.last_period_start,cycle.average_cycle_length,cycle.estimated_cycle_length,cycle.average_period_length,cycle.estimated_next_period,cycle.fertility_estimate_available,cycle.estimated_ovulation_date,cycle.estimated_fertile_start,cycle.estimated_fertile_end,todayDate]);
 const ovulation=cycle.estimated_ovulation_date;
 const fertileStart=cycle.estimated_fertile_start;
 const fertileEnd=cycle.estimated_fertile_end;
 function kind(date:string):'period'|'estimated-period'|'ovulation'|'fertile'|'lower'|'none'{if(confirmedPeriodDates.has(date))return 'period';if(estimatedPeriodDates.has(date))return 'estimated-period';const length=cycle.estimated_cycle_length??cycle.average_cycle_length;if(cycle.fertility_estimate_available&&typeof length==='number'&&length>0&&cycle.last_period_start){const delta=Math.round((dateFromKey(date).getTime()-dateFromKey(cycle.last_period_start).getTime())/86400000);const cycleOffset=Math.floor(delta/length);const projectedStart=addDays(cycle.last_period_start,cycleOffset*length);const projectedOvulation=addDays(projectedStart,length-15);const start=addDays(projectedOvulation,-5);const end=addDays(projectedOvulation,1);if(date===projectedOvulation)return 'ovulation';if(date>=start&&date<=end)return 'fertile';return 'lower';}if(cycle.fertility_estimate_available&&ovulation&&date===ovulation)return 'ovulation';if(cycle.fertility_estimate_available&&fertileStart&&fertileEnd&&date>=fertileStart&&date<=fertileEnd)return 'fertile';return cycle.fertility_estimate_available?'lower':'none';}
 const activeCheckin=wellbeingHistory?.find(entry=>entry.log_date===selected)??(selectedCheckin?.log_date===selected?selectedCheckin:null);
 const activeSexLogs=sexLogHistory?sexLogHistory.filter(log=>log.log_date===selected):selectedSexLogs;
 const selectedKind=kind(selected);
 const detail=selectedKind==='period'?'Confirmed period day · part of your logged cycle':selectedKind==='estimated-period'?'Estimated period day · not yet confirmed by a period log':selectedKind==='ovulation'?'Estimated ovulation day · often around day 14 in a typical 28-day cycle, but timing varies':selectedKind==='fertile'?'Estimated fertile window · pregnancy is more likely':selectedKind==='lower'?'Lower estimated fertility · not a guaranteed safe day':'Cycle estimate unavailable for this date';
 return <section id="floral-calendar" className={'cosmic-floral-calendar'+(cycle.cycle_phase?.phase&&cycle.cycle_phase.phase!=='unknown'?' cosmic-floral-calendar--phase-'+cycle.cycle_phase.phase+' cosmic-floral-calendar--phase-status-'+(cycle.cycle_phase.presentation_status==='acknowledged'?'acknowledged':cycle.cycle_phase.is_estimated?'estimated':'logged'):'')} aria-labelledby="floral-calendar-title">
  <div className="cosmic-floral-calendar__heading"><div><p className="cosmic-eyebrow">A SHARED RHYTHM, IN BLOOM</p><h3 id="floral-calendar-title">{ownerName}'s cycle calendar</h3><p>{editable?'Select a date to review your cycle, then add or update a period entry.':'View-only for '+(viewerName?.trim()||'you')+' · '+ownerName+' controls their own cycle entries'}</p></div><span aria-hidden="true">✿</span></div>
  <div className="cosmic-floral-calendar__month"><button type="button" aria-label="Previous month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><strong>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button type="button" aria-label="Next month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
  <div className="cosmic-floral-calendar__grid" role="group" aria-label="Read-only cycle calendar">
   {['M','T','W','T','F','S','S'].map((d,i)=><span className="cosmic-floral-calendar__weekday" key={d+i}>{d}</span>)}
   {days.map((day,i)=>{if(day===null)return <span className="cosmic-floral-calendar__blank" key={'blank'+i}/>;const date=keyOf(new Date(month.getFullYear(),month.getMonth(),day,12));const type=kind(date);const hasCheckin=checkinDates.includes(date)||confirmedPeriodDates.has(date);return <button key={date} type="button" className={'cosmic-floral-calendar__day cosmic-floral-calendar__day--'+type+(selected===date?' is-selected':'')+(date===(todayDate??keyOf(new Date()))?' is-today':'')+(hasCheckin?' has-checkin':'')} onClick={()=>{setSelected(date);onSelectDate?.(date);}} aria-pressed={selected===date} aria-label={label(date)+(hasCheckin?', check-in saved':'')+', '+(type==='period'?'confirmed period day':type==='estimated-period'?'estimated period day':type==='fertile'?'estimated fertile day':type==='ovulation'?'estimated ovulation day':type==='lower'?'lower estimated fertility':'cycle estimate unavailable')}><span>{day}</span>{type!=='none'&&<Flower tone={type} />}{hasCheckin&&<span className="cosmic-floral-calendar__checkin-dot" aria-hidden="true"/>}</button>;})}
  </div>
  <div className="cosmic-floral-calendar__legend"><span><Flower tone="period"/> Confirmed period days</span><span><Flower tone="estimated-period"/> Estimated period days</span><span><Flower tone="fertile"/> Estimated fertile days</span><span><Flower tone="ovulation"/> Estimated ovulation</span><span><Flower tone="lower"/> Lower estimated fertility</span></div>
  <div className="cosmic-floral-calendar__selected">{selectedKind!=='none'&&<Flower tone={selectedKind}/>}<div><strong>{label(selected)}</strong><p>{detail}</p></div>{editable&&<button type="button" className="cosmic-floral-calendar__edit" onClick={()=>onEditDate?.(selected)}>＋ Log period</button>}</div>
  {(editable||wellbeingHistory!==undefined||sexLogHistory!==undefined)&&<section className="cosmic-floral-calendar__history" aria-live="polite" aria-label="Selected day wellbeing history">
   <div className="cosmic-floral-calendar__history-heading"><div><p className="cosmic-eyebrow">{editable?'YOUR DAY, IN BLOOM':'SHARED CHECK-IN'}</p><h4>{label(selected)}</h4></div><span aria-hidden="true">✧</span></div>
   {selectedKind==='period'&&<p className="cosmic-floral-calendar__history-period">✿ Confirmed period date · this is a cycle check-in</p>}{selectedKind==='estimated-period'&&<p className="cosmic-floral-calendar__history-period cosmic-floral-calendar__history-period--estimate">✿ Estimated period day · not yet logged</p>}
   {historyLoading?<p className="cosmic-floral-calendar__history-muted">Gathering this day's notes…</p>:historyError?<p className="cosmic-floral-calendar__history-muted">{historyError} <button type="button" onClick={onRetryHistory}>Try again</button></p>:(activeCheckin?.log_date===selected||activeSexLogs.length>0||selectedKind==='period'||selectedKind==='estimated-period')?<div className="cosmic-floral-calendar__history-content">
    {(activeCheckin?.energy_level||(activeCheckin?.mood?.length??0)>0)&&<div className="cosmic-floral-calendar__history-meta">{activeCheckin?.energy_level&&<span><b>Energy</b> {({low:'Running low',balanced:'Balanced',high:'High',peak:'Glowing'} as Record<string,string>)[activeCheckin.energy_level]??activeCheckin.energy_level}</span>}{(activeCheckin?.mood?.length??0)>0&&<span><b>Mood</b> {activeCheckin?.mood?.map(m=>m.replaceAll('_',' ')).join(' · ')}</span>}</div>}
    {activeSexLogs.some(log=>log.sex_drive!==null)&&<div className="cosmic-floral-calendar__history-meta"><span><b>{editable?'Private desire':'Shared desire'}</b> {activeSexLogs.filter(log=>log.sex_drive!==null).map(log=>`${log.sex_drive}/5`).join(' · ')}</span></div>}{(activeCheckin?.symptoms?.length??0)>0?<><p className="cosmic-floral-calendar__history-label">SYMPTOMS LOGGED</p><div className="cosmic-floral-calendar__history-tags">{activeCheckin?.symptoms?.map(symptom=><span key={symptom}>{symptom.replaceAll('_',' ')}</span>)}</div></>:activeCheckin?.log_date===selected&&<p className="cosmic-floral-calendar__history-muted">No symptoms were recorded for this day.</p>}
    {activeCheckin?.notes&&<blockquote>{activeCheckin.notes}</blockquote>}{selectedKind==='period'&&activeCheckin?.log_date!==selected&&<p className="cosmic-floral-calendar__history-muted">{editable?'This date is covered by a confirmed period log. Period logging counts as a check-in; add symptoms or a separate wellbeing update whenever you wish.':'This date is covered by your partner’s confirmed period log.'}</p>}
   </div>:<p className="cosmic-floral-calendar__history-muted">{editable?'Nothing logged for this day yet. You can still add symptoms or check in.':'No shared wellbeing check-in was recorded for this date.'}</p>}
   {editable&&selected<=(todayDate??keyOf(new Date()))&&<div className="cosmic-floral-calendar__history-actions"><button type="button" disabled={historyLoading} onClick={onOpenSymptoms}>✿ {activeCheckin?.log_date===selected?'Edit / add symptoms':'Add symptoms'}</button><button type="button" onClick={()=>onEditDate?.(selected)}>＋ Log period</button>{onOpenSex&&<button type="button" className="cosmic-floral-calendar__sex-action" onClick={()=>onOpenSex(selected)}>♡ Sex &amp; desire</button>}</div>}
  </section>}
  <p className="cosmic-floral-calendar__science">In a typical 28-day cycle, ovulation often happens around day 14, but it can shift even in regular cycles. An egg usually remains viable for about 12–24 hours after ovulation; sperm can survive for up to about 5 days. That's why the fertile window begins before ovulation. Blue flowers mean lower estimated fertility, not a safe day. A calendar cannot confirm ovulation or reliably prevent pregnancy.</p>
  {!cycle.fertility_estimate_available&&<p className="cosmic-floral-calendar__science">Fertility dates are not shown because the available cycle information does not support an estimate, or hormonal contraception may affect ovulation.</p>}
 </section>;
}

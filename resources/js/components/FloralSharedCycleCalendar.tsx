import { useMemo, useState } from 'react';
import '../styles/cosmic-dashboard.css';

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
export default function FloralSharedCycleCalendar({cycle}:{cycle:CycleCalendarSummary}){
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);});
 const [selected,setSelected]=useState(()=>keyOf(new Date()));
 const days=useMemo(()=>{const first=new Date(month.getFullYear(),month.getMonth(),1);const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return [...Array((first.getDay()+6)%7).fill(null),...Array.from({length:count},(_,i)=>i+1)];},[month]);
 const periodDates=useMemo(()=>{const dates=new Set<string>();for(const p of cycle.period_history??[]){const end=p.end_date??addDays(p.start_date,Math.max(0,(cycle.average_period_length??5)-1));for(let d=p.start_date;d<=end;d=addDays(d,1))dates.add(d);}if(cycle.average_cycle_length&&cycle.estimated_next_period){for(let start=cycle.estimated_next_period;start<=addDays(cycle.estimated_next_period,cycle.average_cycle_length*2);start=addDays(start,cycle.average_cycle_length)){for(let i=0;i<(cycle.average_period_length??5);i++)dates.add(addDays(start,i));}}return dates;},[cycle]);
 const ovulation=cycle.estimated_ovulation_date;
 const fertileStart=cycle.estimated_fertile_start;
 const fertileEnd=cycle.estimated_fertile_end;
 function kind(date:string):'period'|'ovulation'|'fertile'|'lower'|'none'{if(periodDates.has(date))return 'period';if(cycle.fertility_estimate_available&&cycle.average_cycle_length&&cycle.last_period_start){const delta=Math.round((dateFromKey(date).getTime()-dateFromKey(cycle.last_period_start).getTime())/86400000);const length=cycle.average_cycle_length;const cycleOffset=Math.floor(delta/length);const projectedStart=addDays(cycle.last_period_start,cycleOffset*length);const projectedOvulation=addDays(projectedStart,length-15);const start=addDays(projectedOvulation,-5);const end=addDays(projectedOvulation,1);if(date===projectedOvulation)return 'ovulation';if(date>=start&&date<=end)return 'fertile';return 'lower';}if(cycle.fertility_estimate_available&&ovulation&&date===ovulation)return 'ovulation';if(cycle.fertility_estimate_available&&fertileStart&&fertileEnd&&date>=fertileStart&&date<=fertileEnd)return 'fertile';return cycle.fertility_estimate_available?'lower':'none';}
 const selectedKind=kind(selected);
 const detail=selectedKind==='period'?'Period day · recorded or estimated':selectedKind==='ovulation'?'Estimated ovulation day · not confirmed':selectedKind==='fertile'?'Estimated fertile window · pregnancy is more likely':selectedKind==='lower'?'Lower estimated fertility · not a guaranteed safe day':'Cycle estimate unavailable for this date';
 return <section className="cosmic-floral-calendar" aria-labelledby="floral-calendar-title">
  <div className="cosmic-floral-calendar__heading"><div><p className="cosmic-eyebrow">A SHARED RHYTHM, IN BLOOM</p><h3 id="floral-calendar-title">Their cycle calendar</h3><p>View-only · dates are shared by your partner</p></div><span aria-hidden="true">✿</span></div>
  <div className="cosmic-floral-calendar__month"><button type="button" aria-label="Previous month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><strong>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</strong><button type="button" aria-label="Next month" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div>
  <div className="cosmic-floral-calendar__grid" role="group" aria-label="Read-only cycle calendar">
   {['M','T','W','T','F','S','S'].map((d,i)=><span className="cosmic-floral-calendar__weekday" key={d+i}>{d}</span>)}
   {days.map((day,i)=>{if(day===null)return <span className="cosmic-floral-calendar__blank" key={'blank'+i}/>;const date=keyOf(new Date(month.getFullYear(),month.getMonth(),day,12));const type=kind(date);return <button key={date} type="button" className={'cosmic-floral-calendar__day cosmic-floral-calendar__day--'+type+(selected===date?' is-selected':'')+(date===keyOf(new Date())?' is-today':'')} onClick={()=>setSelected(date)} aria-pressed={selected===date} aria-label={label(date)+', '+(type==='period'?'period day':type==='fertile'?'estimated fertile day':type==='ovulation'?'estimated ovulation day':type==='lower'?'lower estimated fertility':'cycle estimate unavailable')}><span>{day}</span>{type!=='none'&&<Flower tone={type}/>}</button>;})}
  </div>
  <div className="cosmic-floral-calendar__legend"><span><Flower tone="period"/> Period days</span><span><Flower tone="fertile"/> Estimated fertile days</span><span><Flower tone="ovulation"/> Estimated ovulation</span><span><Flower tone="lower"/> Lower estimated fertility</span></div>
  <div className="cosmic-floral-calendar__selected">{selectedKind!=='none'&&<Flower tone={selectedKind}/>}<div><strong>{label(selected)}</strong><p>{detail}</p></div></div>
  <p className="cosmic-floral-calendar__science">An egg usually remains viable for about 12–24 hours after ovulation; sperm can survive for up to about 5 days. That's why the fertile window begins before ovulation. A calendar cannot confirm ovulation or guarantee pregnancy prevention.</p>
  {!cycle.fertility_estimate_available&&<p className="cosmic-floral-calendar__science">Fertility dates are not shown because the available cycle information does not support an estimate, or hormonal contraception may affect ovulation.</p>}
 </section>;
}

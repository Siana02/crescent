import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Flower2, Heart, Info, MoonStar, Sparkles } from 'lucide-react';
import '../styles/cycle-history.css';

type PeriodRecord = { start_date:string; end_date:string|null; flow_intensity?:string|null };
type DashboardPayload = { user:{name:string}; profile:{display_name:string|null;average_cycle_length:number|null;average_period_length:number|null;timezone:string}; latest_period:PeriodRecord|null; period_history:PeriodRecord[]; cycle_day:number|null; estimated_next_period:string|null };
type CycleRecord = {start:string;end:string;periodEnd:string|null;cycleDays:number|null;periodDays:number|null;current:boolean};
const dayMs=86400000;
const fromKey=(value:string)=>new Date(value+'T12:00:00');
const keyOf=(value:Date)=>value.getFullYear()+'-'+String(value.getMonth()+1).padStart(2,'0')+'-'+String(value.getDate()).padStart(2,'0');
const addDays=(value:string,days:number)=>{const d=fromKey(value);d.setDate(d.getDate()+days);return keyOf(d);};
const diffDays=(a:string,b:string)=>Math.round((fromKey(b).getTime()-fromKey(a).getTime())/dayMs);
const pretty=(value:string,withYear=false)=>fromKey(value).toLocaleDateString(undefined,{month:'short',day:'numeric',...(withYear?{year:'numeric'}:{})});
const todayIn=(timezone:string)=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';return get('year')+'-'+get('month')+'-'+get('day');};
const sources=[{label:'American College of Obstetricians and Gynecologists (ACOG) — Amenorrhea: Absence of Periods',url:'https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods'},{label:'ACOG — Abnormal Uterine Bleeding',url:'https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding'},{label:'NHS — Periods and fertility in the menstrual cycle',url:'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/'},{label:'NHS — Period problems',url:'https://www.nhs.uk/conditions/periods/period-problems/'},{label:'Office on Women’s Health — Your menstrual cycle',url:'https://womenshealth.gov/menstrual-cycle/your-menstrual-cycle'}];

function GuidePage({kind}:{kind:'cycle'|'period'}) {
 const isCycle=kind==='cycle';
 return <main className="ch-page ch-guide-page">
  <header className="ch-topbar"><a href="/dashboard" className="ch-brand"><span>✿</span> crescent</a><a href="/cycle-history" className="ch-back"><ArrowLeft size={16}/> Cycle history</a></header>
  <article className="ch-guide">
   <div className="ch-guide-art"><span>{isCycle?'☾':'✿'}</span><i>✧</i><b>♡</b></div>
   <p className="ch-eyebrow">YOUR BODY, EXPLAINED · A GENTLE GUIDE</p>
   <h1>{isCycle?'How Crescent calculates cycle length':'How Crescent calculates period length'}</h1>
   <p className="ch-dek">{isCycle?'A clear explanation of the days between period starts, what typical ranges mean, and when a change deserves attention.':'A simple guide to counting bleeding days, understanding typical duration, and knowing when to ask for support.'}</p>
   <section><h2>{isCycle?'How we calculate cycle length':'How we calculate period length'}</h2>
    <p>{isCycle?'Crescent counts from the first day of one recorded period to the first day of the next recorded period. For example, if one period begins on September 10 and the next begins on October 6, that cycle is 26 days long. The cycle ends on October 5—the day before the next period starts.':'Crescent counts the days from the first recorded bleeding day through the last recorded bleeding day, including both the start and end dates. For example, bleeding from September 10 through September 13 is a 4-day period. Add or update the end date to calculate the duration; if no end date is recorded, Crescent will leave the duration unconfirmed.'}</p>
    <p>We use the dates you record, not a hormone test. If a start date is missing or a period has not ended, the result may be unavailable or only an estimate. Correcting a date in your calendar can change the calculated result.</p>
   </section>
   <section><h2>What’s normal?</h2>
    <p>{isCycle?'For many adults, a cycle around 21–35 days is within a commonly used clinical range, although guidance can vary by age and individual circumstances. A 28-day cycle is an average reference point, not a rule that everyone should match. Cycles can also vary from month to month. [1, 3, 5]':'A period commonly lasts about 2–7 days. Bleeding patterns differ, and a single shorter or longer period does not by itself diagnose a problem. Age, the years since periods began, contraception and personal health can affect what is typical for you. [1, 2, 4]'}</p>
    <p>The “Normal range” label in Crescent is a simple comparison with the general adult range above. It is not a medical assessment and cannot tell whether your cycle is healthy in every other respect.</p>
   </section>
   <section><h2>{isCycle?'What can affect menstrual cycle length?':'What can affect period length?'}</h2>
    <ul>{(isCycle?['Puberty and the years after periods first begin, as cycles may take time to settle.','Approaching perimenopause, when cycle timing can change.','Pregnancy, breastfeeding and changes in hormonal contraception.','Stress, major weight changes, intense exercise, and some health conditions such as thyroid disorders or PCOS.']:['Hormonal contraception, emergency contraception, or changes in a contraceptive method.','Pregnancy-related bleeding and other reproductive health changes.','Conditions such as fibroids, adenomyosis, endometriosis or bleeding disorders.','Stress, illness, and hormonal changes during puberty or perimenopause.']).map(item=><li key={item}>{item}</li>)}</ul>
    <p>These are possible influences, not a way to diagnose the cause from a calendar. If your pattern changes persistently, a clinician can consider your symptoms, history and whether any tests are appropriate. [2, 4, 5]</p>
   </section>
   <section><h2>When to see a doctor or seek help</h2>
    <p>{isCycle?'Arrange medical advice if your periods repeatedly come more often than every 21 days or less often than every 35 days, your usual pattern changes for several cycles, you miss periods and pregnancy is possible, or you have other concerning symptoms. Guidance may use different cut-offs depending on age and context. [1, 2, 4]':'Seek medical advice if bleeding lasts longer than 7 days, is unusually heavy, occurs between periods or after sex, or your period pattern changes persistently. If bleeding is very heavy and you feel faint, dizzy, short of breath or acutely unwell, seek urgent care. [2, 4]'}</p>
    <p>Get urgent medical care for severe or sudden pelvic pain, fainting, or heavy bleeding with weakness or dizziness. If pregnancy is possible and you have pelvic pain or bleeding, seek urgent medical advice because an ectopic pregnancy must be ruled out.</p>
   </section>
   <aside className="ch-disclaimer"><Heart size={20}/><div><h3>An important note from Crescent</h3><p>Crescent is a tracking and educational tool, not a diagnostic tool. It cannot confirm ovulation, explain the cause of a change, rule out pregnancy or replace advice from a qualified healthcare professional. Fertility flowers and cycle estimates should not be used alone to prevent pregnancy.</p></div></aside>
   <section className="ch-references"><h2>References & further reading</h2><ol>{sources.map((source,i)=><li key={source.url} id={'source-'+(i+1)}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ol></section>
   <a className="ch-primary-link" href="/cycle-history">Back to your cycle history <ArrowRight size={17}/></a>
  </article>
 </main>;
}

function flowerTone(cycle:CycleRecord,index:number,average:number|null):string {
 if(index<(cycle.periodDays??0))return 'period';
 const length=cycle.cycleDays??average??28;
 const ovulation=Math.max(1,length-14);
 if(index+1===ovulation)return 'ovulation';
 if(index+1>=Math.max((cycle.periodDays??0)+1,ovulation-5)&&index+1<ovulation)return 'fertile';
 if(index+1>ovulation&&index+1<=ovulation+1)return 'fertile';
 return 'lower';
}

export default function CycleHistoryPage(){
 const path=window.location.pathname;
 if(path==='/read/cycle-length-guide')return <GuidePage kind="cycle"/>;
 if(path==='/read/period-length-guide')return <GuidePage kind="period"/>;
 return <CycleHistoryContent/>;
}

function CycleHistoryContent(){
 const [data,setData]=useState<DashboardPayload|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [yearIndex,setYearIndex]=useState(0);
 const [expandedYears,setExpandedYears]=useState<number[]>([]);
 const [touchStart,setTouchStart]=useState<number|null>(null);
 useEffect(()=>{fetch('/api/dashboard?timezone='+encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'),{credentials:'same-origin',headers:{Accept:'application/json'}}).then(async r=>{if(!r.ok)throw new Error('Your cycle history could not be loaded. Please try again.');return r.json();}).then((d:DashboardPayload)=>setData(d)).catch(e=>setError(e instanceof Error?e.message:'Something went wrong.')).finally(()=>setLoading(false));},[]);
 const timezone=data?.profile.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
 const today=todayIn(timezone);
 const cycles=useMemo(()=>{
  if(!data)return [] as CycleRecord[];
  const records=(data.period_history??(data.latest_period?[data.latest_period]:[])).slice().filter(p=>p.start_date).sort((a,b)=>a.start_date.localeCompare(b.start_date));
  return records.map((p,i)=>{
   const next=records[i+1];
   const cycleDays=next?diffDays(p.start_date,next.start_date):null;
   const periodDays=p.end_date?diffDays(p.start_date,p.end_date)+1:null;
   const end=next?addDays(next.start_date,-1):today;
   return {start:p.start_date,end,periodEnd:p.end_date,cycleDays,periodDays,current:!next};
  }).reverse();
 },[data,today]);
 const years=useMemo(()=>Array.from(new Set(cycles.map(c=>fromKey(c.start).getFullYear()))).sort((a,b)=>b-a),[cycles]);
 useEffect(()=>{if(years.length&&yearIndex>=years.length)setYearIndex(0);},[years,yearIndex]);
 const selectedYear=years[yearIndex]??new Date(today+'T12:00:00').getFullYear();
 const yearCycles=cycles.filter(c=>fromKey(c.start).getFullYear()===selectedYear);
 const visibleCycles=expandedYears.includes(selectedYear)?yearCycles:yearCycles.slice(0,4);
 const previousYear=()=>{setYearIndex(i=>Math.min(years.length-1,i+1));};
 const nextYear=()=>{setYearIndex(i=>Math.max(0,i-1));};
 if(loading)return <main className="ch-page ch-loading">Gathering your cycle petals… ✿</main>;
 if(error||!data)return <main className="ch-page ch-loading"><p>{error||'Cycle history is not available.'}</p><a href="/dashboard">Return to dashboard</a></main>;
 return <main className="ch-page">
  <header className="ch-topbar"><a href="/dashboard" className="ch-brand"><span>✿</span> crescent</a><a href="/dashboard" className="ch-back"><ArrowLeft size={16}/> Dashboard</a></header>
  <section className="ch-hero"><div><p className="ch-eyebrow"><MoonStar size={14}/> YOUR BODY, YOUR TIMELINE <Sparkles size={14}/></p><h1>{data.profile.display_name?.trim()||data.user.name.split(' ')[0]}'s <em>Cycles</em></h1><p>Every period logged, every cycle remembered. Your history, arranged gently by year and month.</p><div className="ch-hero-stats"><span><Flower2 size={16}/>{cycles.length} recorded starts</span><span><Heart size={16}/>{cycles.filter(c=>c.periodDays!==null).length} periods with end dates</span></div></div><div className="ch-hero-art"><span>✿</span><i>✧</i><b>☾</b><small>♡</small></div></section>
  <section className="ch-year-panel" onTouchStart={e=>setTouchStart(e.touches[0]?.clientX??null)} onTouchEnd={e=>{if(touchStart===null)return;const delta=(e.changedTouches[0]?.clientX??touchStart)-touchStart;if(delta < -45)previousYear();if(delta>45)nextYear();setTouchStart(null);}}>
   <div className="ch-year-heading"><div><p className="ch-eyebrow">A LITTLE LOOK BACK</p><h2>{selectedYear} <span>✧</span></h2><p>{yearCycles.length} cycle{yearCycles.length===1?'':'s'} starting this year</p></div><div className="ch-year-controls"><button type="button" onClick={previousYear} disabled={yearIndex>=years.length-1} aria-label="View previous year"><ChevronLeft/></button><button type="button" onClick={nextYear} disabled={yearIndex===0} aria-label="View newer year"><ChevronRight/></button></div></div>
   <label className="ch-year-select">Choose a year <span><select value={selectedYear} onChange={e=>{setYearIndex(years.indexOf(Number(e.target.value)));}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select><ChevronDown size={15}/></span></label>
   {yearCycles.length===0?<div className="ch-empty"><Flower2 size={28}/><h3>No cycles recorded for this year yet</h3><p>When you log a period, Crescent can start building your timeline.</p><a href="/dashboard">Log a period</a></div>:<div className="ch-month-groups">{Array.from(new Set(visibleCycles.map(c=>fromKey(c.start).getMonth()))).sort((a,b)=>b-a).map(month=>{const monthCycles=visibleCycles.filter(c=>fromKey(c.start).getMonth()===month);return <section className="ch-month-group" key={month}><h3>{new Date(selectedYear,month,1).toLocaleDateString(undefined,{month:'long'})}<span>{monthCycles.length}</span></h3>{monthCycles.map(cycle=><article className="ch-cycle-card" key={cycle.start}>
    <div className="ch-cycle-card__top"><div><p className="ch-cycle-length">{cycle.cycleDays!==null?<><strong>{cycle.cycleDays}</strong> days</>:cycle.current?<><strong>{Math.max(1,diffDays(cycle.start,today)+1)}</strong> days so far</>:<><strong>—</strong> days</>}</p><p className="ch-cycle-dates">{pretty(cycle.start)} – {pretty(cycle.end)}{cycle.current?' · current cycle':''}</p></div><a href={'/dashboard?date='+cycle.start} aria-label={'Open floral calendar at '+pretty(cycle.start)} title="Open this date in your floral calendar"><ArrowRight/></a></div>
    <div className="ch-flower-track" aria-label="Estimated cycle phases">{Array.from({length:Math.min(45,Math.max(1,cycle.cycleDays??data.profile.average_cycle_length??28))},(_,i)=><span key={i} className={'ch-flower ch-flower--'+flowerTone(cycle,i,data.profile.average_cycle_length??null)} title={flowerTone(cycle,i,data.profile.average_cycle_length??28)==='period'?'Recorded period day':flowerTone(cycle,i,data.profile.average_cycle_length??28)==='ovulation'?'Estimated ovulation':flowerTone(cycle,i,data.profile.average_cycle_length??28)==='fertile'?'Estimated fertile day':'Lower estimated fertility'}>✿</span>)}</div>
    <div className="ch-cycle-card__legend"><span><i className="ch-dot period"/>Period</span><span><i className="ch-dot lower"/>Lower estimated fertility</span><span><i className="ch-dot fertile"/>Fertile estimate</span><span><i className="ch-dot ovulation"/>Ovulation estimate</span></div>
    <div className="ch-cycle-facts"><span><b>Period length</b>{cycle.periodDays!==null?cycle.periodDays+' days':'Not recorded'}</span><span><b>Period dates</b>{cycle.periodEnd?pretty(cycle.start)+' – '+pretty(cycle.periodEnd):'End date not recorded'}</span></div>
   </article>)}</section>;})}</div>}
   {yearCycles.length>4&&<button type="button" className="ch-show-all" onClick={()=>setExpandedYears(v=>v.includes(selectedYear)?v.filter(y=>y!==selectedYear):[...v,selectedYear])>{expandedYears.includes(selectedYear)?'Show fewer cycles':'View all '+yearCycles.length+' cycles for '+selectedYear}<ChevronDown size={16}/></button>}
   <p className="ch-swipe-hint">♡ Swipe left or right to move between years</p>
  </section>
  <section className="ch-chart-panel"><div className="ch-year-heading"><div><p className="ch-eyebrow">YOUR PATTERNS AT A GLANCE</p><h2>Cycle length over time <span>✧</span></h2><p>Completed cycles with two recorded period start dates.</p></div><span className="ch-chart-flower">✿</span></div>
   {cycles.filter(c=>c.cycleDays!==null).length===0?<p className="ch-chart-empty">Log at least two period start dates to see your cycle-length graph.</p>:<div className="ch-chart" role="img" aria-label="Bar chart of recent cycle lengths">{cycles.filter(c=>c.cycleDays!==null).slice(0,8).reverse().map(c=><div className="ch-chart-column" key={c.start}><span>{c.cycleDays}d</span><div className="ch-chart-bar" style={{height:Math.max(12,Math.min(100,((c.cycleDays??0)/45)*100))+'%'}}/><small>{pretty(c.start)}</small></div>)}</div>}
   <p className="ch-chart-note"><Info size={15}/> Cycle lengths use the first day of one period to the first day of the next. Predictions and flower colours are estimates, not contraception or diagnosis.</p>
  </section>
  <footer className="ch-footer"><a href="/dashboard"><ArrowLeft size={16}/> Back to your dashboard</a><p>Made with care, for every version of your rhythm. ✿</p></footer>
 </main>;
}

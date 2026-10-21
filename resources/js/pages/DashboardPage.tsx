import { useCallback, useEffect, useState } from 'react';
import PregnancyDashboard from './PregnancyDashboard';
import PostpartumDashboard from './PostpartumDashboard';
import CycleDashboardHome from './CycleDashboardHome';

type PregnancyCheckin = { log_date:string; symptoms:string[]; mood:string|null; energy_level:string|null; notes:string|null };
type PregnancySummary = {
 due_date:string;last_period_date:string|null;conception_date:string|null;due_date_source:string;wants_baby_astrology:boolean;status:string;
 gestational_week:number;gestational_day_in_week:number;gestational_days:number;trimester:number;days_until_due:number;
 today_checkin:PregnancyCheckin|null;postpartum_logs_today:{id:number;log_date:string;category:string;notes:string}[];
};
type DashboardData = {
 user:{name:string;email:string};
 profile:{
  average_cycle_length:number|null;average_period_length:number|null;cycle_regularity:'regular'|'irregular'|'unknown';timezone:string;
  birth_date:string|null;contraception_type:string|null;primary_goal:string;birth_time:string|null;birth_place:string|null;
  sun_sign:string|null;moon_sign:string|null;rising_sign:string|null;onboarding_completed:boolean;display_name:string|null;
  wants_astrology:boolean;partner_preference:'solo'|'observer'|'co_tracker';active_journey:'cycle'|'fertility'|'pregnancy'|'postpartum';
 };
 latest_period:{start_date:string;end_date:string|null}|null;
 period_history?:{start_date:string;end_date:string|null}[];
 cycle_day:number|null;estimated_next_period:string|null;days_until_estimate:number|null;
 fertility_window:{ovulation_date:string;start_date:string;end_date:string}|null;
 relationships?:{id:number;relationship_type:'observer'|'co_tracker';status:'pending'|'accepted'|'revoked';invite_code:string|null;companion_name:string|null;sharing_enabled:boolean}[];
 today_checkin:{log_date:string;energy_level:string|null;mood:string|null;symptoms:string[];notes:string|null}|null;
 pregnancy:PregnancySummary|null;
};
function csrfToken(){return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'';}

export default function DashboardPage(){
 const [data,setData]=useState<DashboardData|null>(null);
 const [isLoading,setIsLoading]=useState(true);
 const [error,setError]=useState('');
 const loadDashboard=useCallback(async()=>{
  const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
  const response=await fetch('/api/dashboard?timezone='+encodeURIComponent(timezone),{credentials:'same-origin',headers:{Accept:'application/json'}});
  if(response.status===401){window.location.assign('/login');return;}
  if(!response.ok)throw new Error('We could not open your dashboard. Please refresh and try again.');
  setData(await response.json() as DashboardData);
 },[]);
 useEffect(()=>{loadDashboard().catch(e=>setError(e instanceof Error?e.message:'Something went wrong.')).finally(()=>setIsLoading(false));},[loadDashboard]);
 async function logout(){try{await fetch('/auth/logout',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','X-CSRF-TOKEN':csrfToken()}});}finally{window.location.assign('/');}}
 if(isLoading)return <main className="dashboard-loading" aria-live="polite">Opening your little universe…</main>;
 if(!data)return <main className="dashboard-loading" role="alert">{error||'We could not open your dashboard. Please refresh and try again.'}</main>;
 if(data.profile.active_journey==='pregnancy')return <PregnancyDashboard data={data} onLogout={logout} onRefresh={loadDashboard}/>;
 if(data.profile.active_journey==='postpartum')return <PostpartumDashboard data={data} onLogout={logout} onRefresh={loadDashboard}/>;
 return <CycleDashboardHome data={data} onLogout={logout} onRefresh={loadDashboard}/>;
}

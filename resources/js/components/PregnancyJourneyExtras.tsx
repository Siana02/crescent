import { useEffect, useMemo, useState, type FormEvent } from 'react';
import '../styles/pregnancy.css';

type Reminder = { id:number; title:string; category:string; remind_at:string; notes:string|null; share_with_partner:boolean; completed_at:string|null; created_by_name?:string|null };
type Baby = { name?:string|null; birth_date?:string|null; birth_time?:string|null; birth_place?:string|null };
type Props = { week:number; trimester:number; postpartum?:boolean; baby?:Baby|null; partnerView?:boolean };

const WEEKLY_NUTRITION = [
 'This week, keep water within reach and sip regularly. If nausea makes large meals difficult, small, frequent meals may feel easier.',
 'Try adding a protein source to a meal or snack—beans, lentils, eggs, yoghurt, fish low in mercury or another food that suits your diet.',
 'A colourful fruit or vegetable adds fibre and a range of nutrients. Frozen and seasonal produce count too.',
 'Iron matters during pregnancy. Beans, lentils, leafy greens, meat if you eat it, and fortified foods can contribute; ask your clinician about supplements and blood tests.',
 'Pair plant-based iron foods with vitamin-C-rich fruit or vegetables to help your body absorb the iron.',
 'Calcium-rich options such as pasteurised yoghurt, milk, fortified alternatives or calcium-set tofu can help meet changing needs.',
 'Fibre and fluids may help with constipation. Increase fibre gradually and ask your care team if symptoms persist.',
 'Food safety is part of nutrition: choose pasteurised dairy, wash produce, and cook meat, eggs and seafood thoroughly according to local guidance.',
 'If appetite is low, try a small snack with both carbohydrate and protein. You do not need to force large meals or “eat for two”.',
 'If you eat fish, choose varieties low in mercury and follow local pregnancy guidance on portions. Avoid high-mercury fish.',
 'Folate is especially important early in pregnancy. Ask a qualified clinician about the right supplement for your stage and personal history.',
 'Do not start herbs, high-dose vitamins or supplements without checking with a clinician or pharmacist; avoid supplements containing retinol (vitamin A) unless prescribed.',
 'Keep easy options available—fruit, nuts if safe for you, yoghurt, boiled eggs or hummus—so a busy day does not mean skipping food.',
 'If heartburn is bothering you, smaller meals and staying upright after eating may help. Ask your clinician before using medicines.',
 'Continue aiming for a varied pattern across the week rather than a perfect meal every day. Cultural foods and familiar staples can fit.',
 'If you are vegetarian or vegan, discuss reliable sources of iron, vitamin B12, iodine, calcium, vitamin D and protein with your care team.',
 'Food aversions are common for some people. Choose tolerated foods and ask for help if you cannot keep fluids down or are losing weight.',
 'Try a fibre-rich staple such as oats, whole grains, beans or fruit if it suits you; add water and increase portions gradually.',
 'Your need for some nutrients changes in pregnancy. Ask at your next visit whether your current supplement plan matches your needs.',
 'Food safety reminder: avoid unpasteurised dairy and raw or undercooked animal foods, and follow your local public-health advice.',
 'A snack can be simple: fruit with yoghurt, beans on toast, or another familiar combination that gives you energy and nourishment.',
 'If swelling or a sudden change in how you feel worries you, do not try to manage it with diet tips alone—contact your maternity team.',
 'Choose a safe drink you enjoy and keep sipping through the day. Ask your clinician for tailored fluid advice if you have a medical restriction.',
 'Iron-rich foods and vitamin-C-rich produce can work well together. Supplements should follow your maternity team’s advice.',
 'As baby grows, comfort and appetite can shift. Small meals may be easier than a large plate if you feel full quickly.',
 'If you have been told you have gestational diabetes or another condition, follow your own care plan rather than general app suggestions.',
 'A balanced plate can include a staple, protein, vegetables or fruit, and a source of healthy fat—adapt it to your culture, budget and appetite.',
 'If you are craving non-food items such as soil, clay or ice in unusual amounts, tell your clinician; this can need assessment.',
 'Keep taking only the supplements recommended for you. More is not automatically better, especially with high-dose vitamins.',
 'Plan one nourishing food you can prepare ahead or ask someone to bring. Practical help counts as pregnancy support.',
 'If you have trouble eating because of nausea, vomiting or pain, contact your maternity team for advice rather than relying on food swaps alone.',
 'Late pregnancy can make large meals uncomfortable. Smaller portions and snacks may feel more manageable.',
 'Ask your clinician about iron, calcium and any other supplements based on your local guidance, diet, tests and health history.',
 'Keep food safety in mind when eating out: choose freshly cooked hot foods and pasteurised drinks and dairy.',
 'If preparing meals feels exhausting, let a partner or friend take one meal off your hands. Rest is part of care too.',
 'Your body is preparing for birth, but there is no single “perfect” menu. Variety, safe food handling and your care team’s advice matter most.',
 'If you plan to breastfeed, ask your care team what nutrition and medication guidance may apply after birth; needs differ from person to person.',
 'Pack familiar snacks for appointments or travel if they help you feel comfortable, and follow any fasting instructions from your clinic.',
 'Keep the focus on enough nourishment and support, not weight-loss goals or restrictive diets during pregnancy.',
 'This week, choose one small food routine that feels sustainable. If you have concerns about growth, appetite or supplements, bring them to your maternity team.',
];

const WEEKLY_DEVELOPMENT = [
 'Pregnancy weeks are counted from the first day of the last menstrual period; in a typical cycle, fertilisation has not happened during week 1.',
 'The body is in the early part of the cycle used to date pregnancy. Ovulation and conception timing can vary, especially when cycles are irregular.',
 'Around this stage, fertilisation may occur in a typical cycle and the early cell cluster travels toward the uterus. Dating can vary.',
 'The developing blastocyst may implant in the uterus. Early pregnancy tests may begin to detect hCG, but timing differs.',
 'Early structures that will form the brain, spinal cord and heart are beginning to develop. A clinician can advise on dating and next steps.',
 'The neural tube is developing and early heart structures are forming. Take supplements only as advised by your maternity clinician.',
 'Early limb buds are developing and the heart is developing rapidly. Ultrasound visibility and heartbeat timing vary.',
 'The embryo is developing arms, legs, hands and feet; the head is still proportionally large. Size comparisons are approximate.',
 'Facial features and small limb structures continue to develop. Symptoms differ widely from person to person.',
 'The embryo is entering the fetal stage in medical terminology; fingers and toes are developing and organs continue to mature.',
 'The head and body continue changing proportions and early movements may occur, though they are usually not felt yet.',
 'Fingers, toes and facial features continue to develop. Screening and scan options depend on local services and personal choices.',
 'The second trimester is approaching in common dating systems; bones and movement continue developing.',
 'Facial muscles and limb movements develop further. You may not feel movement yet, especially in a first pregnancy.',
 'The skeleton continues to develop and the body grows. Individual measurements vary, so app comparisons are not growth checks.',
 'The baby can move arms and legs; some people begin to notice early movement in the coming weeks, but timing varies.',
 'Movement and body proportions continue developing. Ask your care team what to expect for your pregnancy.',
 'The ears and nervous system continue developing; some people begin noticing movements around this period, others later.',
 'Sensory development continues and the baby may respond to sounds, though this cannot be judged from an app.',
 'Around mid-pregnancy, an anatomy scan is commonly offered to assess structures. It does not detect every condition.',
 'Movement and swallowing continue, and the skin is developing. A scan may be offered around this time depending on local guidance.',
 'The lungs and brain continue developing, but they are not mature yet. The baby’s movement pattern can become more familiar.',
 'The baby continues growing and practicing movements; clinicians may discuss movement awareness appropriate to your stage.',
 'The lungs and nervous system continue maturing. Ask your care team when and how to monitor movements.',
 'The baby’s skin and body continue changing as fat begins to accumulate. Growth varies between pregnancies.',
 'Eyes and other sensory structures continue developing; many changes happen gradually rather than on a single day.',
 'The brain and lungs continue developing. If you have concerns about symptoms or movement, contact your maternity team.',
 'The baby continues gaining weight and practicing breathing movements, though the lungs still need further maturation.',
 'Brain growth and nervous-system development continue, alongside increasing body fat.',
 'The baby is gaining weight and may respond to familiar sounds; movement space can feel different as pregnancy advances.',
 'The lungs and brain continue maturing and the body is building reserves for after birth.',
 'The baby continues gaining fat and practicing movements; a due date is only an estimate.',
 'Bones are developed but remain relatively flexible, and the baby continues preparing for life outside the uterus.',
 'The baby is continuing to mature and gain weight; the head may move toward a birth-ready position, but timing varies.',
 'The lungs and other systems continue maturing. Your care team can explain the signs of labour and when to call.',
 'The baby is often getting ready for birth, but position and timing vary. Keep your birth and transport plan flexible.',
 'The baby continues to gain weight and mature. Follow your clinician’s guidance about appointments and fetal movement.',
 'The baby is considered early term from 37 weeks, but individual birth timing varies; seek advice if labour signs or concerns arise.',
 'The baby continues final maturation and may be born at any time. Your care team can explain what to do if your due date passes.',
 'Around 40 weeks is the estimated due date, not a deadline. Follow your maternity team’s advice about monitoring and next steps.',
];
\nconst PARTNER_CARE = [
 { title:'Ask before trying to fix it', text:'Try “Would comfort, practical help, company or quiet feel best today?” Listen to the answer and follow their lead.' },
 { title:'Take one task off their plate', text:'Offer to prepare a meal, refill water, handle an errand or arrange transport to an appointment. Be specific and make it easy to say no.' },
 { title:'Make appointments easier', text:'Ask whether they want company, help writing questions, transport or someone to remember the plan. They decide what support they want.' },
 { title:'Symptoms are real work', text:'Nausea, fatigue and discomfort can make ordinary tasks harder. Do not minimise symptoms because pregnancy is expected; help them contact their care team if concerned.' },
 { title:'Plan as a team', text:'Check what would reduce stress this week: food shopping, laundry, baby essentials, a quiet evening or time to talk.' },
 { title:'Protect rest without taking control', text:'Offer to make space for rest and help with chores, but let the pregnant person decide what they need and what choices feel right.' },
 { title:'Keep their wellbeing central', text:'Ask how they are feeling physically and emotionally. Pregnancy can be joyful, complicated, tiring or all of these; avoid assuming how they should feel.' },
 { title:'Share the preparation', text:'Choose one practical job together—reviewing the clinic plan, preparing a hospital bag, checking transport or organising baby essentials.' },
];

function localDateTimeDefault() {
 const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
 d.setMinutes(0,0,0);
 return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
}
function displayDate(value:string) {
 return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
}
function signForDate(value:string) {
 const d=new Date(value+'T12:00:00');const md=(d.getMonth()+1)*100+d.getDate();
 if(md>=321&&md<=419)return 'Aries';if(md>=420&&md<=520)return 'Taurus';if(md>=521&&md<=620)return 'Gemini';if(md>=621&&md<=722)return 'Cancer';if(md>=723&&md<=822)return 'Leo';if(md>=823&&md<=922)return 'Virgo';if(md>=923&&md<=1022)return 'Libra';if(md>=1023&&md<=1121)return 'Scorpio';if(md>=1122&&md<=1221)return 'Sagittarius';if(md>=1222||md<=119)return 'Capricorn';if(md>=120&&md<=218)return 'Aquarius';return 'Pisces';
}
function csrf() { return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''; }

export default function PregnancyJourneyExtras({week,trimester,postpartum=false,baby=null,partnerView=false}:Props) {
 const [reminders,setReminders]=useState<Reminder[]>([]);
 const [title,setTitle]=useState('');
 const [category,setCategory]=useState('appointment');
 const [remindAt,setRemindAt]=useState(localDateTimeDefault);
 const [notes,setNotes]=useState('');
 const [share,setShare]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const care=PARTNER_CARE[(Math.max(0,week)+new Date().getDate())%PARTNER_CARE.length];
 const development=WEEKLY_DEVELOPMENT[Math.min(39,Math.max(0,week-1))];
 const nutrition=useMemo(()=>WEEKLY_NUTRITION[Math.min(WEEKLY_NUTRITION.length-1,Math.max(0,week-1))],[week]);
 const upcomingReminders=reminders.filter(reminder=>!reminder.completed_at&&new Date(reminder.remind_at).getTime()>=Date.now()).sort((a,b)=>new Date(a.remind_at).getTime()-new Date(b.remind_at).getTime());
 useEffect(()=>{let live=true;fetch('/api/pregnancy/reminders',{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():{reminders:[]}).then(data=>{if(live)setReminders(data.reminders??[])}).catch(()=>{});return()=>{live=false}},[]);
 async function saveReminder(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/pregnancy/reminders',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/json','X-CSRF-TOKEN':csrf()},body:JSON.stringify({title:title.trim(),category,remind_at:new Date(remindAt).toISOString(),notes:notes.trim()||null,share_with_partner:share})});
   const data=await response.json();if(!response.ok)throw new Error(data.message??Object.values(data.errors??{}).flat()[0]??'Could not save this reminder.');
   setNotice(data.message??'Reminder saved.');setTitle('');setNotes('');
   const refreshed=await fetch('/api/pregnancy/reminders',{credentials:'same-origin',headers:{Accept:'application/json'}});if(refreshed.ok){const payload=await refreshed.json();setReminders(payload.reminders??[])}
  }catch(e){setError(e instanceof Error?e.message:'Could not save this reminder.')}finally{setBusy(false)}
 }
 const milestones=postpartum?[
  {range:'First 3 weeks',title:'Check in after birth',copy:'ACOG recommends contact with your maternity care provider within the first 3 weeks, with earlier review if you have concerns or specific risks.'},
  {range:'By 12 weeks',title:'Comprehensive postpartum review',copy:'Plan a full review of physical recovery, mood, sleep, feeding, contraception and any ongoing health needs.'},
  {range:'Any time',title:'You deserve support too',copy:'Persistent sadness, anxiety, frightening thoughts or feeling unable to cope deserve compassionate, timely help.'},
 ]:[
  {range:'As early as possible',title:'Start antenatal care',copy:'Arrange a visit with a qualified maternity provider and ask which checks, tests and supplements are recommended for your situation.'},
  {range:'Around weeks 11–14',title:'Ask about dating and screening',copy:'Some services offer a first-trimester scan and screening in this window. Availability and choices vary by location.'},
  {range:'Around weeks 18–22',title:'Anatomy scan conversation',copy:'A mid-pregnancy ultrasound is commonly offered to assess development. If you want to know fetal sex, ask your sonographer; it may not be visible or certain.'},
  {range:'Throughout',title:'Follow your own care schedule',copy:'Appointment timing varies by location, health history and pregnancy. Use your clinic’s plan instead of treating these windows as mandatory deadlines.'},
 ];
 return <div className="pregnancy-extras">
  {!postpartum&&trimester===1&&week>=4&&<section className="pregnancy-petal-card pregnancy-early-symptoms"><p className="pregnancy-eyebrow">A NOTE FOR THE PERSON CARRYING</p><h2>Early weeks can feel anything but quiet.</h2><p>Nausea, fatigue, food aversions, breast tenderness and mild cramping can happen in early pregnancy, and for some people the symptoms feel heavy. Others have few symptoms. Neither experience tells you on its own how the pregnancy is progressing. If pain is severe or persistent, bleeding is heavy, you cannot keep fluids down, or something worries you, contact your maternity team promptly.</p></section>}
  <section className="pregnancy-petal-card pregnancy-weekly-nourishment">
   <div className="pregnancy-floral-stamp" aria-hidden="true">❀</div><p className="pregnancy-eyebrow">{postpartum?'FOURTH-TRIMESTER CARE':'THIS WEEK’S NOURISHMENT'}</p>
   <h2>{postpartum?'You deserve tending, too.':`A little nourishment for week ${week}`}</h2>
   <p>{postpartum?'Keep meals simple, accept practical help, and follow your clinician’s advice on recovery, hydration and any feeding-related needs.':nutrition}</p>
   {!postpartum&&<small>General information, not an individual diet plan. Ask your midwife or clinician about supplements, food restrictions and any medical conditions.</small>}
   <p className="pregnancy-source-links">Sources: <a href="https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/" target="_blank" rel="noreferrer">NHS · week-by-week guide</a> · <a href="https://www.who.int/tools/elena/interventions/daily-iron-pregnancy" target="_blank" rel="noreferrer">WHO · iron and folic acid</a> · <a href="https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/" target="_blank" rel="noreferrer">NHS · healthy diet</a></p>
  </section>
  <section className="pregnancy-petal-card">
   <p className="pregnancy-eyebrow">{partnerView?'A NOTE FOR THE SUPPORT PERSON':'YOUR CARE CALENDAR'}</p><h2>{partnerView?'Care that follows their lead':postpartum?'Gentle postpartum checkpoints':'Helpful appointment windows'}</h2>
   <div className="pregnancy-milestones">{milestones.map(item=><article key={item.range+item.title}><span>{item.range}</span><div><h3>{item.title}</h3><p>{item.copy}</p></div></article>)}</div>
   <p className="pregnancy-source-links">Guidance: <a href="https://www.nhs.uk/pregnancy/your-pregnancy-care/ultrasound-scans/" target="_blank" rel="noreferrer">NHS · ultrasound scans</a> · <a href="https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2018/05/optimizing-postpartum-care" target="_blank" rel="noreferrer">ACOG · postpartum care</a></p>
  </section>
  <section className="pregnancy-petal-card pregnancy-partner-care">
   <p className="pregnancy-eyebrow">{partnerView?'TODAY’S PARTNER CARE':'A LITTLE REMINDER FOR YOUR PEOPLE'}</p><h2>{partnerView?care.title:'Support should feel like support'}</h2>
   <p>{partnerView?care.text:'Your partner can ask what would help, take practical tasks off your hands, accompany you if invited, and listen without assuming what you need. You get to set the pace.'}</p>
   {partnerView&&<p className="pregnancy-gentle-note">The pregnant person’s comfort, autonomy and care come first. Ask, listen and respect their choices.</p>}
  </section>
  {!postpartum&&<section className="pregnancy-petal-card pregnancy-baby-development"><p className="pregnancy-eyebrow">{partnerView?'GETTING TO KNOW THE BABY':'A LITTLE NOTE ON DEVELOPMENT'}</p><h2>Week {Math.min(40,Math.max(1,week))}: {week===1?'The dating clock begins':'A new stage of growth'}</h2><p>{development}</p><small>Milestones are approximate, not a check of your baby’s health or growth. Development and dating can vary. <a href="https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/" target="_blank" rel="noreferrer">Read the NHS week-by-week guide ↗</a></small></section>}
    {baby?.birth_date&&<section className="pregnancy-petal-card pregnancy-baby-atelier">
   <p className="pregnancy-eyebrow">A TINY COSMIC ATELIER</p><h2>{baby.name?.trim()?baby.name+'’s little universe':'Your little one’s first sky'}</h2>
   <div className="pregnancy-baby-chart"><span aria-hidden="true">✧</span><div><small>SUN SIGN</small><strong>{signForDate(baby.birth_date)}</strong><p>Born {new Intl.DateTimeFormat(undefined,{dateStyle:'long'}).format(new Date(baby.birth_date+'T12:00:00'))}</p></div></div>
   <p>{baby.birth_time&&baby.birth_place? `Birth details saved: ${baby.birth_time} · ${baby.birth_place}. `:'You can add a birth time and birthplace in Profile & settings to keep a fuller record. '}The Sun sign is date-based and approximate near sign boundaries; a complete natal chart needs accurate birth details and an astrology calculation.</p>
   <a href="/astrology?subject=baby">Open baby’s Cosmic Atelier ↗</a>
  </section>}
  <section className="pregnancy-petal-card pregnancy-reminder-planner">
   <p className="pregnancy-eyebrow">LET YOUR PEOPLE HELP</p><h2>Appointments, errands & little reminders</h2><p>Create a reminder for a clinic visit, baby shopping, transport, a birth class or a practical check-in. Shared reminders appear in the linked partner’s Crescent space.</p>
   <form onSubmit={saveReminder} className="pregnancy-reminder-form">
    <label>What needs remembering?<input required maxLength={140} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Anatomy scan appointment"/></label>
    <div className="pregnancy-reminder-fields"><label>Type<select value={category} onChange={e=>setCategory(e.target.value)}><option value="appointment">Medical appointment</option><option value="shopping">Baby shopping</option><option value="class">Birth / parenting class</option><option value="support">Support check-in</option><option value="medication">Medication / supplement prompt</option><option value="other">Other</option></select></label><label>When<input type="datetime-local" required value={remindAt} onChange={e=>setRemindAt(e.target.value)}/></label></div>
    <label>Details (optional)<textarea rows={2} maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Clinic address, questions to bring, shopping list…"/></label>
    <label className="pregnancy-reminder-share"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)}/> Share this reminder with my connected partner</label>
    {error&&<p className="pregnancy-alert" role="alert">{error}</p>}{notice&&<p className="pregnancy-notice" role="status">{notice}</p>}
    <button className="pregnancy-floral-button" type="submit" disabled={busy}>{busy?'Saving reminder…':'Save reminder ✿'}</button>
   </form>
   <div className="pregnancy-reminder-list"><h3>Upcoming reminders</h3>{upcomingReminders.length===0?<p>No upcoming reminders yet. Add one above when it would make life easier.</p>:upcomingReminders.map(reminder=><article key={reminder.id}><span aria-hidden="true">{reminder.category==='appointment'?'♡':reminder.category==='shopping'?'✿':'✧'}</span><div><strong>{reminder.title}</strong><small>{displayDate(reminder.remind_at)}{reminder.share_with_partner?' · Shared with partner':' · Private'}{reminder.created_by_name?' · Added by '+reminder.created_by_name:''}</small>{reminder.notes&&<p>{reminder.notes}</p>}</div></article>)}</div>
   <small className="pregnancy-reminder-disclaimer">These are in-app shared reminders, not emergency alerts or guaranteed push notifications. Keep using your clinic’s appointment system and your device calendar for time-critical reminders.</small>
  </section>
  {!postpartum&&<section className="pregnancy-petal-card"><p className="pregnancy-eyebrow">A GENTLE SAFETY NOTE</p><h2>When something feels wrong, ask for help</h2><p>Severe or persistent headache, vision changes, heavy bleeding, chest pain, trouble breathing, severe abdominal pain, or reduced fetal movement after you have an established movement pattern warrant urgent professional advice. Follow local emergency guidance; do not wait for an app response.</p><p className="pregnancy-source-links"><a href="https://www.acog.org/womens-health/faqs/urgent-maternal-warning-signs" target="_blank" rel="noreferrer">ACOG · urgent maternal warning signs</a></p></section>}
 </div>;
}

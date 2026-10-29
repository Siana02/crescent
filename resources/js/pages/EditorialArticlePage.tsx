import React from 'react';
import '../styles/editorial-articles.css';

type Section = { heading: string; paragraphs: string[]; points?: string[] };
function renderCitations(text: string) { return text.split(/(\[\d+(?:,\s*\d+)*\])/g).map((part, index) => { const match = part.match(/^\[(\d+(?:,\s*\d+)*)\]$/); return match ? <sup key={index} className="editorial-citation">{match[1].split(/,\s*/).map((number, i) => <React.Fragment key={number}>{i > 0 ? ', ' : ''}<a href={'#source-' + number} aria-label={'Jump to source ' + number}>[{number}]</a></React.Fragment>)}</sup> : part; }); }
type Story = { slug: string; category: string; title: string; dek: string; image: string; readTime: string; updated: string; intro: string[]; sections: Section[]; sources: { label: string; url: string; note: string }[]; takeaway: string };
const stories: Story[] = [
{
 slug:'painful-period-cramps', category:'THE BODY / PAIN & PERIODS', title:'Painful period cramps: Is it normal, or could it be something else?', dek:'A thoughtful guide to menstrual pain, what may help, and the signals that deserve more than being told to put up with it.', image:'/Painful-period-cramps-is-it-normal-or-could-it-be-something-else.jpg', readTime:'15 minute read', updated:'A considered guide to menstrual health',
 intro:[
 'Period pain is common. That does not mean every level of pain is inevitable, harmless, or something you should have to quietly endure. Cramping can be part of menstruation, but pain that repeatedly interrupts school, work, sleep, movement, relationships or ordinary life deserves attention.',
 'This guide is here to help you describe what you feel, understand a few possible explanations, and prepare for a useful conversation with a qualified clinician. It cannot diagnose the cause of your pain: similar symptoms can arise for different reasons, and an examination or further tests may be needed.'
 ],
 sections:[
 {heading:'What creates a period cramp?',paragraphs:[
 'During menstruation, the uterus contracts to help shed its lining. Chemical messengers called prostaglandins are involved in those contractions. For some people, higher prostaglandin activity is associated with stronger cramping, and pain may be accompanied by nausea, loose stools, headache or tiredness. Cramping is often strongest around the start of bleeding and may ease over the next few days.',
 'Pain is experienced differently from person to person. One person may feel a dull heaviness across the lower abdomen; another may experience waves of sharp cramps that spread into the back or thighs. Your own usual pattern is a helpful point of comparison, but it should never be used to dismiss severe or changing pain.'
 ]},
 {heading:'Primary cramps and pain with another cause',paragraphs:[
 'Clinicians often distinguish primary dysmenorrhoea—menstrual pain without an identified underlying pelvic condition—from pain associated with another cause. Primary cramps often begin around the time periods become established and follow a familiar pattern. They can still be intense, and there are treatment options worth discussing.',
 'Secondary dysmenorrhoea describes period pain linked to a condition such as endometriosis, adenomyosis, fibroids or pelvic inflammatory disease. These conditions are not the only explanations for pelvic pain, and symptoms overlap. Pain that begins later in life, gets progressively worse, occurs outside bleeding, or comes with pain during sex, bowel movements or urination is a good reason to seek assessment rather than trying to self-diagnose.'
 ]},
 {heading:'Endometriosis: when tissue like the uterine lining grows elsewhere',paragraphs:[
`Endometriosis is a long-term condition in which tissue similar to the lining inside the uterus grows elsewhere in the body, often around the ovaries, fallopian tubes or pelvic lining. This tissue can respond to hormonal changes and contribute to inflammation, scarring and pain. It is not simply a bad period, and the severity of pain does not reliably show how extensive the condition is. [3]`,
`Symptoms can include periods that are very painful, pelvic pain outside bleeding, pain during or after sex, pain when opening the bowels or urinating, fatigue, and difficulty becoming pregnant. Some people have few obvious symptoms. Symptoms can overlap with other conditions, so a symptom list alone cannot confirm endometriosis.`,
`A clinician may ask about the timing and impact of pain, examine you with your consent, and consider an ultrasound or other imaging. Imaging can identify some forms of endometriosis but a normal scan does not always rule it out. Depending on symptoms and local practice, management may include anti-inflammatory pain relief, hormonal treatments that reduce or stop periods, specialist care, or surgery in selected cases. The right approach depends on your health, plans for pregnancy, preferences and response to treatment. If pain repeatedly disrupts your life, it is reasonable to ask specifically whether endometriosis should be considered. [2, 3]`
]},
{heading:'PCOS: irregular cycles are a clue, not a diagnosis',paragraphs:[
`Polycystic ovary syndrome (PCOS) is a hormonal condition that can affect ovulation, menstrual regularity, skin and metabolism. Despite its name, having ovarian cysts is not required for a PCOS diagnosis, and the small follicles sometimes seen on an ultrasound are not the same thing as the larger ovarian cysts discussed below. PCOS itself is not usually the direct explanation for severe period cramps, but irregular or infrequent periods and related symptoms may be part of the wider picture. [4]`,
`Possible signs include periods that are infrequent, absent or unpredictable; acne; increased facial or body hair; scalp hair thinning; and sometimes changes associated with insulin resistance. People can have PCOS at different body sizes. No single symptom proves that you have it, and similar changes can have other causes. A clinician may review your cycle history, symptoms, examination and blood tests, and sometimes ultrasound findings, while excluding other explanations.`,
`There is no single cure, but treatment can help with the concerns that matter to you. Depending on your goals, care may include cycle-regulating hormonal contraception, medication for selected metabolic or skin symptoms, support with sustainable health habits, or fertility treatment if pregnancy is desired. Long gaps without periods can leave the uterine lining exposed to hormonal effects for longer, so ask a clinician how to protect your health if periods are very infrequent. PCOS deserves an individual plan rather than a promise that one diet, supplement or product will fix it. [4]`
]},
{heading:'Ovarian cysts: common, but not all alike',paragraphs:[
`An ovarian cyst is a fluid-filled sac in or on an ovary. Many cysts form as part of the menstrual cycle, cause no symptoms and go away without treatment over time. Other cysts have different causes or features and may need monitoring or treatment. Ovarian cysts are not the same as PCOS, and finding a cyst does not automatically mean surgery is needed. [5]`,
`When symptoms occur, they can include one-sided pelvic discomfort, a feeling of heaviness or pressure, pain during sex, bloating, or changes in urination or bowel movements if a cyst is large. Sudden intense pain can happen if a cyst ruptures or an ovary twists (torsion), and that needs urgent assessment. Symptoms are not specific to cysts, so a clinician may use a pelvic ultrasound and your medical history to work out what is most likely.`,
`Management depends on the cyst's appearance, size, symptoms, age and pregnancy status. A clinician may recommend watchful waiting with repeat scans when that is safe; pain relief may be considered for suitable people. Surgery can be discussed for cysts that are large, persistent, concerning on imaging or causing significant symptoms. Seek emergency care for sudden severe pelvic pain, especially with vomiting, faintness, fever or feeling very unwell. Do not assume that intense one-sided pain is simply ovulation pain. [5]`
]},
{heading:'Ectopic pregnancy: pelvic pain that must not wait',paragraphs:[
`An ectopic pregnancy happens when a fertilised egg implants outside the uterus, most often in a fallopian tube. It cannot develop into a normal pregnancy and can become life-threatening if the tube ruptures and causes internal bleeding. Early symptoms can resemble a period or other pelvic conditions, and some people do not initially realise they are pregnant. [6]`,
`Possible symptoms include a missed period or a positive pregnancy test, lower abdominal or pelvic pain that may be stronger on one side, vaginal bleeding or brown watery discharge, shoulder-tip pain, pressure or discomfort when opening the bowels. Symptoms can vary and bleeding may be mistaken for a period. An ectopic pregnancy can occur even when someone uses contraception or has no known risk factors.`,
`If pregnancy is possible and you have pelvic pain or unusual bleeding, seek urgent medical assessment rather than trying to distinguish it from cramps at home. Sudden severe pain, shoulder-tip pain, dizziness, fainting, collapse or marked weakness are emergency warning signs: call local emergency services or go to an emergency department immediately. Assessment may involve pregnancy testing, blood tests and ultrasound. Depending on how early it is and what the tests show, treatment may involve close monitoring in selected cases, medication, or surgery. The safest option depends on clinical findings, and urgent symptoms should never wait for an app estimate or a home test result. [6]`
]},
 {heading:'What you can try for comfort',paragraphs:[
 'Heat is a practical first step for many people: a warm pack or hot-water bottle wrapped in a towel can be placed on the lower abdomen or back. Gentle movement, stretching, rest, a warm shower, massage, hydration and a comfortable position may help some people. You do not need to push through exercise if movement worsens the pain.',
 'Anti-inflammatory medicines such as ibuprofen or naproxen can reduce prostaglandin activity and may help menstrual cramps. They are not suitable for everyone, including some people with stomach ulcers, kidney disease, certain asthma sensitivities, people taking particular medicines, or those who may be pregnant. Follow the package directions and ask a pharmacist or clinician if you are unsure. Do not combine medicines from the same class or exceed the recommended dose.',
 'Hormonal contraception can reduce menstrual pain for some people, but the right option depends on medical history, preferences, side effects and whether pregnancy is desired. A clinician can discuss options rather than assuming there is one universal solution. Supplements and online “hormone balancing” remedies vary in evidence and safety; check before starting them, especially if you take medication.'
 ]},
 {heading:'When pain deserves medical attention',paragraphs:[
 'Arrange a clinical appointment if pain is severe, worsening, newly different from your usual pattern, not helped by reasonable self-care, or regularly disrupts everyday activities. Also seek advice for heavy or prolonged bleeding, bleeding between periods, pain during sex, unusual discharge, fever, or pain when urinating or passing stool. Keep track of symptoms and their timing, but do not delay care while collecting data.',
 'Sudden severe pelvic or abdominal pain, fainting, difficulty breathing, very heavy bleeding, or severe pain with possible pregnancy needs urgent medical assessment. Seek emergency help if you feel acutely unwell. These symptoms can have causes that need prompt treatment and should not be attributed to a normal period without assessment.'
 ]},
 {heading:'How to make an appointment more useful',paragraphs:[
 'Before an appointment, jot down when the pain starts, how long it lasts, where it is felt, how intense it becomes, whether it appears outside menstruation, and what you have tried. Note missed work or school, sleep disruption, pain with sex or bowel movements, and any changes in bleeding. A symptom diary can help you communicate clearly; it is not a test you must pass before you are taken seriously.',
 'You might ask: What causes are you considering? What treatment options fit my health history and goals? What side effects should I know about? When should I come back if treatment does not help? Is further assessment appropriate? If your concerns are dismissed and the pain continues to affect your life, it is reasonable to seek a second opinion where available.'
 ]},
 {heading:'A note on tracking without blame',paragraphs:[
 'Crescent can help you record the day pain occurs, its intensity, related symptoms and what seemed to help. Over time, that record may make patterns easier to explain to a clinician. It cannot determine whether pain is caused by endometriosis or another condition, and a calendar estimate should never override what your body is telling you.',
 'You are not weak for needing rest, medication or medical care. Pain is information, not a character test. The goal is not to become better at tolerating distress indefinitely; it is to understand what is happening and find support that improves your quality of life.'
 ]}
 ,
 {heading:'Questions about pain relief, treatment and follow-up',paragraphs:[
 'A treatment plan should make sense for your body and your priorities. If you are offered medication, ask how and when to take it, whether it is safe with your other medicines, what side effects to look for, and how soon you should expect to notice a difference. If you have a history of stomach or kidney problems, asthma triggered by pain medicines, take blood thinners, or could be pregnant, mention that before using anti-inflammatory medication. A pharmacist can often help with medicine-safety questions.',
 'If first-line treatment does not help, that is useful information rather than a personal failure. A clinician may consider other approaches, review how and when symptoms occur, or investigate another cause. Depending on the history, assessment can include questions, an examination with consent, testing or imaging. You can ask what each step is intended to find out and what alternatives exist. You have the right to understand the plan and to pause an examination if you feel uncomfortable.',
 'Make a follow-up plan before you leave: what improvement should look like, how long to try a treatment, what side effects mean you should stop, and when to return. If pain continues to affect daily life, say so plainly. “I miss work because of this” or “I cannot sleep during the first two days” gives concrete context that can help guide care.'
 ]},
 {heading:'Pain, stress and the whole person',paragraphs:[
 'Stress can influence how pain is experienced, and persistent pain can itself create stress. That does not mean menstrual pain is imaginary or “all in your head.” Pain is a real physical experience shaped by many interacting systems. Gentle support for sleep, emotional wellbeing and daily routines may help you cope, but it should complement—not replace—appropriate assessment and treatment when symptoms are severe.',
 'You may find it useful to tell a trusted person what support looks like on difficult days: help with errands, a heating pad, quiet time, transport to an appointment, or simply not being expected to explain yourself repeatedly. If pain affects intimacy, you are allowed to pause sexual activity and talk with a partner about comfort and boundaries. Pain during sex is a symptom worth discussing, not something you must accept.',
 'A good care plan is one that respects your goals and improves your life, not one that expects you to prove how much discomfort you can tolerate. If you are not being heard, bring your notes, ask direct questions, or seek another clinician where possible.'
 ]}
 ,
 {heading:'A practical plan for the difficult days',paragraphs:[
 'If the first day or two of your period is difficult, it may help to prepare a small comfort plan in advance. Keep the pain relief that is safe for you, period products, water, a snack and a heat pack accessible. If possible, identify which tasks can be moved and who you could ask for practical help. These are not substitutes for treatment, but reducing the number of decisions you must make while in pain can make the day more manageable.',
 'Notice what actually helps instead of assuming you should follow every wellness tip you see. You might find heat useful but stretching uncomfortable; another person may prefer a short walk and quiet rest. There is no prize for exercising through severe pain, avoiding medication at all costs, or maintaining your usual schedule when you are unwell. If you regularly need to cancel important activities, that is a reason to seek better support, not evidence that your plan needs more willpower.'
 ]}
 ],
 sources:[
 {label:'NHS — Period pain',url:'https://www.nhs.uk/conditions/period-pain/',note:'Symptoms, self-care and when to seek medical advice.'},
 {label:'ACOG — Dysmenorrhea: Painful Periods',url:'https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods',note:'Patient guidance on painful periods and treatment options.'},
 {label:'NHS — Endometriosis',url:'https://www.nhs.uk/conditions/endometriosis/',note:'Symptoms, diagnosis and treatment options.'},
 {label:'NHS — Polycystic ovary syndrome (PCOS)',url:'https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/',note:'Symptoms, assessment and treatment options for PCOS.'},
 {label:'NHS — Ovarian cyst',url:'https://www.nhs.uk/conditions/ovarian-cyst/',note:'Types of ovarian cysts, symptoms, monitoring and treatment.'},
 {label:'NHS — Ectopic pregnancy',url:'https://www.nhs.uk/conditions/ectopic-pregnancy/',note:'Warning signs, diagnosis and urgent treatment.'}
 ], takeaway:'Pain that disrupts your life deserves care. Track your pattern if useful, try safe comfort measures, and seek clinical advice for severe, changing or persistent symptoms.'
},
{
 slug:'menstrual-cycle-stages', category:'THE BODY / CYCLE LITERACY', title:'The menstrual cycle, explained: stages, symptoms and what your body needs', dek:'A clear, compassionate tour of menstruation, the follicular phase, ovulation and the luteal phase—without turning a living body into a rigid calendar.', image:'/The-different-stages-of-the-menstrual-cycle-symptoms-and-tips.jpg', readTime:'12 minute read', updated:'A considered guide to cycle literacy',
 intro:[
 'The menstrual cycle is more than the days you bleed. It is a coordinated pattern of changes involving the brain, ovaries and uterus. Learning the broad phases can make cycle tracking more meaningful, as long as the phases are treated as a framework rather than a promise about how you will feel on a particular date.',
 'Not everyone has a 28-day cycle, ovulates on day 14, or notices obvious changes at every stage. Cycle length can vary between people and from one cycle to the next. Hormonal contraception, pregnancy, breastfeeding, perimenopause, stress, illness and some health conditions can change bleeding and ovulation patterns.'
 ],
 sections:[
 {heading:'Start with day one',paragraphs:[
 'Cycle day one is generally the first day of menstrual bleeding. The cycle is counted from that day through the day before the next period begins. A period is the shedding of the uterine lining when pregnancy has not occurred; bleeding length and flow vary. Spotting and bleeding patterns can be worth noting separately if they differ from your usual period.',
 'Averages are not rules. A 28-day cycle is often used in examples because it is easy to illustrate, not because every healthy body follows it. The length of a cycle can shift, and a cycle-tracking app can only estimate future dates from information entered and assumptions about regularity.'
 ]},
 {heading:'Menstruation: the reset that is not a failure',paragraphs:[
 'During menstruation, the uterine lining is shed. Bleeding may come with cramps, backache, fatigue, digestive changes or mood shifts, but symptoms differ widely. Some people feel relatively well; others need to adjust plans. Neither experience is more “normal” or more virtuous.',
 'Practical care can be simple: use the period product that feels comfortable and safe for you, change it according to its instructions, eat regularly, drink water, and rest when you need to. Heat or suitable pain relief may help cramps. Seek medical advice for very heavy bleeding, pain that interferes with life, or a major change in your usual pattern.'
 ]},
 {heading:'The follicular phase: more than a fixed number of days',paragraphs:[
 'The follicular phase begins on day one of the period and continues until ovulation. Signals from the brain stimulate ovarian follicles, and one may become dominant as an egg matures. Oestrogen generally rises during this phase and helps rebuild the uterine lining.',
 'Because ovulation timing varies, the follicular phase can be different lengths in different cycles. Some people notice changes in cervical fluid as ovulation approaches; others do not notice a clear pattern. Energy, appetite, skin and mood can also be influenced by sleep, stress, nutrition, medication and life events, so a single symptom should not be treated as proof of a hormonal phase.'
 ]},
 {heading:'Ovulation: an event, not a guaranteed calendar date',paragraphs:[
 'Ovulation is the release of an egg from an ovary. In cycles where ovulation occurs, the egg can be fertilised for a limited time after release, while sperm may survive for several days in favourable reproductive-tract conditions. That is why the fertile window includes days before ovulation, not only the day an app labels “ovulation day.”',
 'Calendar predictions are estimates. Even people with usually regular cycles may ovulate earlier or later than expected. Cervical fluid, urinary luteinising hormone tests and basal body temperature can provide different kinds of clues, but each has limitations. No one symptom or app prediction confirms ovulation with certainty, and cycle tracking alone is not reliable contraception.'
 ]},
 {heading:'The luteal phase: the time after ovulation',paragraphs:[
 'After ovulation, the follicle changes into a structure that produces progesterone. This hormone helps prepare the uterine lining. If pregnancy does not occur, hormone levels fall and menstruation eventually begins. The time between ovulation and the next period is often more consistent than the follicular phase, but individual variation still exists.',
 'Some people notice breast tenderness, bloating, appetite changes, acne, headaches, sleep changes or mood symptoms before a period. Premenstrual symptoms can be mild or significantly disruptive. Severe mood symptoms that affect daily life should not be brushed off as simply “being hormonal”; a clinician can help assess premenstrual syndrome or premenstrual dysphoric disorder and discuss support.'
 ]},
 {heading:'What cycle tracking can—and cannot—tell you',paragraphs:[
 'Tracking dates, bleeding, pain, discharge, mood, energy and sleep may help you identify personal patterns over several cycles. The value is in the record you build, not in matching every day to a generic phase chart. Add context when relevant: illness, travel, major stress, new medication or changes in contraception can all matter.',
 'Tracking cannot diagnose a hormone imbalance, prove that ovulation occurred, predict your exact mood, or determine whether you can become pregnant on a particular day. If periods are repeatedly absent, very irregular, unusually heavy, or accompanied by symptoms that concern you, seek a healthcare professional rather than relying on app explanations.'
 ]},
 {heading:'Care that follows your actual life',paragraphs:[
 'There is no need to schedule your entire life around a phase label. If you feel energetic, enjoy it; if you are tired, consider what else may be contributing and make room for rest. Regular meals, movement that feels good, adequate sleep and stress support can benefit general health across the cycle. Restrictive “cycle syncing” plans are not required to have a healthy cycle.',
 'Use the cycle as one source of context, not a rulebook. You are allowed to feel differently from one month to the next, to have no noticeable phase-related symptoms, and to change what care looks like as your circumstances change.'
 ]}
 ,
 {heading:'Why the same cycle can feel different month to month',paragraphs:[
 'A cycle is not a sealed system operating separately from the rest of your life. Travel, poor sleep, illness, emotional stress, changes in exercise or food access, breastfeeding, medication and hormonal contraception can all influence bleeding or the symptoms you notice. Sometimes a change is temporary; sometimes it deserves a conversation with a clinician. Tracking context alongside dates can stop a single late period from becoming a story about personal failure.',
 'The menstrual cycle also changes across the lifespan. Patterns in the first years after periods begin can be different from adult patterns, and cycles may shift again during perimenopause. Pregnancy and postpartum changes require a different frame from a typical cycling pattern. If you use hormonal contraception, bleeding may not reflect a natural ovulatory cycle at all. A tracker should make space for these realities instead of forcing every person into the same four-stage template.',
 'Look for trends over several cycles rather than drawing conclusions from one day. Ask whether the change is persistent, disruptive, new for you, or accompanied by symptoms such as severe pain, unusually heavy bleeding or repeated missed periods. That context is more useful than trying to match every feeling to a predicted phase.'
 ]},
 {heading:'When cycle changes merit a health check',paragraphs:[
 'Consider seeking advice if periods repeatedly stop without an expected reason, become very irregular, last much longer than usual, or involve heavy bleeding or significant pain. A clinician may ask about pregnancy possibility, medicines, contraception, stress, weight changes and other symptoms. There are many possible explanations, and an app cannot distinguish them. Avoid assuming that every change is caused by stress or a “hormone imbalance.”',
 'If you are trying to conceive, cycle records can help describe your pattern, but they cannot confirm fertility or diagnose an ovulation problem. If you are avoiding pregnancy, do not rely on a predicted fertile window as contraception. The right advice depends on your goals and medical context, so make those goals clear when you seek care.',
 'Above all, cycle literacy is meant to support self-understanding. It is not a demand to optimise every meal, workout, relationship or workday around a hormone chart. Let the information serve you: notice what repeats, be curious about what changes, and seek help when something feels wrong.'
 ]}
 ,
 {heading:'Build a useful record without turning it into a rulebook',paragraphs:[
 'A simple record can include the first day of bleeding, how long it lasts, whether flow feels light or heavy for you, symptoms, and any major context such as illness or a new medicine. You do not need to record every detail every day for tracking to be worthwhile. If recording makes you anxious or encourages you to monitor your body constantly, take a break or keep only the information that helps you.',
 'Try describing observations rather than conclusions: “clear, slippery fluid today” is more useful than “ovulation definitely happened”; “low energy after a poor night of sleep” leaves room for context instead of blaming a cycle phase. Over time, patterns may emerge, but a pattern is still not a diagnosis. Share the record with a clinician if it helps you explain a concern, and let the record be imperfect. The point is to support your understanding, not create another standard you must meet.'
 ]}
 ],
 sources:[
 {label:'ACOG — Your Menstrual Cycle',url:'https://www.acog.org/womens-health/faqs/your-menstrual-cycle',note:'How the cycle works and when a pattern may need evaluation.'},
 {label:'NHS — Periods',url:'https://www.nhs.uk/conditions/periods/',note:'Period basics and common concerns.'},
 {label:'ASRM — Optimizing natural fertility',url:'https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021/',note:'Evidence and limitations around fertile-window timing.'}
 ], takeaway:'Use cycle phases as a map, not a schedule. Your own patterns, context and wellbeing matter more than a predicted day.'
},
{
 slug:'contraception-and-period-products', category:'YOUR CHOICES / SEXUAL HEALTH', title:'Contraception and period products: Understanding your options', dek:'A practical, judgement-free overview of pregnancy prevention, bleeding changes and period care so you can ask better questions and choose what fits your life.', image:'/The-different-types-of-conteaceptives-and-different-methods-of-period-blood-collection-explained.jpg', readTime:'15 minute read', updated:'A considered guide to informed choices',
 intro:[
 'There is no single best contraceptive method or period product for everyone. The right choice depends on your health, preferences, access, comfort, plans around pregnancy, and what you can use consistently. It is also normal for your needs to change over time.',
 'This guide introduces common options and questions to discuss with a qualified healthcare professional. Availability, eligibility and costs vary by location. It is educational information, not a personal prescription, and it does not replace advice from a clinician or pharmacist.'
 ],
 sections:[
 {heading:'First, separate two different decisions',paragraphs:[
 'Contraception is about preventing pregnancy. Period products are about collecting or absorbing menstrual blood. Some contraceptives also change bleeding patterns or reduce cramps, but period products do not prevent pregnancy. Condoms are distinctive because external and internal condoms can reduce pregnancy risk and also help reduce transmission of many sexually transmitted infections when used correctly.',
 'If you need both pregnancy prevention and STI protection, consider what each method does rather than assuming one method covers everything. Many people choose a highly effective contraceptive method alongside condoms, depending on their circumstances and preferences.'
 ]},
 {heading:'Barrier methods and condoms',paragraphs:[
 'External condoms are worn over the penis; internal condoms sit inside the vagina. They create a physical barrier and can reduce the risk of pregnancy and many sexually transmitted infections. Effectiveness depends on correct and consistent use, correct fit, compatible lubricant and avoiding damage. Use a new condom each time and follow the instructions on the packet.',
 'Condoms do not require a hormonal prescription and can be used alongside other methods. They can break or slip, so it is useful to know where to get time-sensitive emergency contraception if a condom fails. Latex allergies may require a non-latex product; oil-based lubricants can damage latex condoms. A pharmacist or sexual-health clinic can help explain local options.'
 ]},
 {heading:'Hormonal methods and long-acting options',paragraphs:[
 'Hormonal contraception includes pills, patches, vaginal rings, injections, implants and hormonal intrauterine devices, depending on what is available locally. These methods work in different ways, such as preventing ovulation, thickening cervical mucus or changing the uterine lining. Bleeding may become lighter, irregular, less frequent or stop for some users; the pattern depends on the method and the person.',
 'Implants and intrauterine devices are often called long-acting reversible contraception because they provide ongoing protection without needing a daily action and can be removed by a trained provider. Pills and other user-managed methods can offer flexibility but rely on following their instructions. Some methods are unsuitable for certain health histories, so disclose migraines, smoking, blood-clot history, medicines and other relevant details during a consultation.'
 ]},
 {heading:'Copper IUDs, fertility awareness and emergency contraception',paragraphs:[
 'A copper intrauterine device is non-hormonal and can provide long-term contraception, though it may make bleeding or cramps heavier for some people. Fertility-awareness methods involve observing signs and avoiding unprotected sex or using a barrier during fertile days; they require careful, consistent learning and are harder to use when cycles are irregular. An app-only calendar estimate is not a reliable way to avoid pregnancy.',
 'Emergency contraception may be an option after unprotected sex or contraceptive failure. The options, time windows and suitability vary, and some methods work better the sooner they are used. Contact a pharmacist, clinician or sexual-health service promptly instead of waiting for symptoms. Emergency contraception is not the same as abortion medication.'
 ]},
 {heading:'Choosing period products',paragraphs:[
 'Disposable pads and liners absorb blood externally. Tampons collect blood internally and should be changed according to package instructions; use the lowest absorbency that manages your flow and never leave one in longer than recommended. Menstrual cups and discs collect blood and require clean hands, correct insertion and cleaning according to manufacturer instructions. Period underwear can absorb flow and should be washed and dried as directed.',
 'Comfort, cost, availability, disability, privacy, water access, flow and personal or cultural preferences all matter. You do not have to use an internal product, and you do not have to switch to a reusable one to be “better” at period care. If a product causes pain, irritation or persistent discomfort, stop using it and seek advice if symptoms continue.'
 ]},
 {heading:'Safety, hygiene and what is not a normal adjustment',paragraphs:[
 'Wash hands before and after inserting or removing internal products, follow product-specific cleaning instructions, and avoid using scented products inside the vagina. The vagina does not need internal cleansing. A sudden strong odour, itching, burning, fever, pelvic pain or unusual discharge deserves medical advice rather than being masked with fragranced products.',
 'With tampons, know the symptoms of toxic shock syndrome, a rare but serious illness. Sudden high fever, vomiting or diarrhoea, a rash, dizziness or feeling severely unwell while using a tampon requires urgent medical help. Remove the tampon if possible while seeking care. Follow the product instructions and do not ignore rapidly worsening symptoms.'
 ]},
 {heading:'Questions worth asking a provider',paragraphs:[
 'You can ask how effective a method is with typical use, what side effects are common, how bleeding may change, whether it interacts with medication, how quickly fertility returns after stopping, what it costs, and what to do if you miss a dose or a condom breaks. Ask how to access follow-up or removal if you choose an implant or IUD. You are entitled to understandable information and a choice that respects your goals.',
 'If privacy, partner pressure, safety or cost affects your choice, mention only what you feel safe sharing with the provider. A trusted clinic or pharmacist may be able to explain confidential services available in your area. Contraception should support your autonomy; you should not be coerced into starting, stopping or using a method.'
 ]}
 ,
 {heading:'A comparison checklist before you decide',paragraphs:[
 'Start with the outcome that matters most to you. Is preventing pregnancy the priority, do you also want STI protection, would lighter bleeding be helpful, or do you prefer to avoid hormones? Consider how much day-to-day maintenance you are comfortable with, how you feel about internal products or a procedure, how easy follow-up is to access, and what the method costs over time. A method that is theoretically very effective may not be a practical fit if you cannot obtain it reliably or use it comfortably.',
 'Ask about typical-use effectiveness, not only perfect-use figures. Ask what to do if you miss a pill, have vomiting or diarrhoea while using an oral method, start a new medicine, or experience condom breakage. If you choose a long-acting method, ask about insertion, removal, expected bleeding changes and how to get help if you have a problem. If you use a method that does not protect against STIs, discuss whether condoms or testing should be part of your plan.',
 'It is reasonable to take time to decide. You can ask a provider to explain options in plain language, write down the names of methods, and return with questions. If a method causes side effects that are difficult to live with, contact a clinician to discuss alternatives rather than feeling obliged to endure them.'
 ]},
 {heading:'Period care when access, privacy or comfort is difficult',paragraphs:[
 'The best period product is one that is safe, available and workable in your real circumstances. At school, work, travel or home, consider whether you have clean water, a private place to change, a way to dispose of used products, and a spare product if bleeding is unpredictable. If you use reusable products, follow the manufacturer’s cleaning and storage instructions and make sure they can dry appropriately between uses.',
 'If a product is painful, leaks persistently despite correct use, causes irritation, or is difficult to insert or remove, you can choose another option. Menstrual cups, tampons and discs are not compulsory upgrades; pads, period underwear and other products remain valid choices. People with disabilities, pelvic pain, sensory sensitivities or limited water access may need different solutions. Practical comfort matters more than a trend.',
 'If you do not have reliable access to period products, consider contacting a local clinic, community organisation or trusted school or workplace support service to ask what is available. Period care is a health and dignity issue, not a test of how resourceful you are.'
 ]}
 ,
 {heading:'Consent and control belong at the centre',paragraphs:[
 'Contraception should be a decision you can make freely, with accurate information and without pressure. A partner can share preferences, but should not control whether you start, stop or continue a method. If you want a method that is private, ask a qualified provider about realistic confidentiality, side effects, visibility, follow-up and safety in your circumstances. Some methods can be felt or noticed by a partner; others require a clinic visit or regular supplies. There is no need to disclose more than feels safe in a given setting.',
 'If you are experiencing reproductive coercion—such as pressure to become pregnant, interference with contraception, or being prevented from accessing care—consider speaking confidentially with a health professional or support service if it is safe. Ask what information is recorded, who can access it, and how communication will happen. Your preferences may change, and you can revisit a decision. A respectful provider should help you understand options, not shame you for choosing one method over another or for deciding that a particular method is not right for you.'
 ]}
 ],
 sources:[
 {label:'WHO — Family planning / contraception methods',url:'https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception',note:'Overview of contraceptive methods and informed choice.'},
 {label:'NHS — Contraception',url:'https://www.nhs.uk/contraception/',note:'Practical explanations of method types, use and side effects.'},
 {label:'NHS — Period products',url:'https://www.nhs.uk/conditions/periods/period-products/',note:'Product types and safe use.'}
 ], takeaway:'Choose based on your body, circumstances and preferences. For pregnancy prevention and STI protection, understand what each method does—and ask for individual guidance when you need it.'
},
{
 slug:'vaginal-discharge', category:'BODY LITERACY / VAGINAL HEALTH', title:'Vaginal discharge decoded: Colours, textures, infections and when to seek help', dek:'Learn what discharge can normally look and feel like, what patterns may be worth checking, and why colour alone cannot diagnose an infection.', image:'/Vaginal-discharge-the-different-types-and-colors-explained-how-to-spot-yeast-infection-when-to-seek-help.jpg', readTime:'12 minute read', updated:'A considered guide to vaginal health',
 intro:[
 'Vaginal discharge is one of the ways the vagina and cervix maintain their environment. It can change in amount, texture and appearance across the menstrual cycle, and noticing it can be part of ordinary body literacy. There is no single appearance that every healthy person must have.',
 'Discharge is not a diagnosis. Similar changes can have different causes, and infections may not always produce obvious symptoms. Use this guide to understand broad patterns and recognise when a clinician can help, rather than trying to identify an infection from a colour chart alone.'
 ],
 sections:[
 {heading:'What discharge does',paragraphs:[
 'Fluid from the vagina and cervix helps keep vaginal tissue moist and can carry away cells and secretions. Normal discharge may look clear or white and can be thin, slippery, sticky or creamy. It may dry slightly yellow on underwear. The amount can change with hormonal shifts, sexual arousal, pregnancy, contraception and individual variation.',
 'Your baseline is useful context, but it is not a reason to ignore symptoms. A new persistent change in smell, colour or texture, especially alongside itching, soreness, burning or pelvic pain, is worth discussing with a healthcare professional. You do not need to feel embarrassed; clinicians discuss vaginal symptoms routinely.'
 ]},
 {heading:'Cervical fluid across the cycle',paragraphs:[
 'As oestrogen changes, cervical fluid may shift from little or sticky fluid to a wetter, clearer or more slippery texture near ovulation. Some people notice a stretchy consistency; others see only subtle changes or none they can confidently interpret. Semen, lubricants, arousal fluid and some medicines can affect what you notice.',
 'Slippery cervical fluid can be one clue that the fertile window may be approaching, but it does not prove ovulation occurred and cannot reliably identify a “safe day” to avoid pregnancy. If you are trying to conceive, tracking may help you understand your pattern; if avoiding pregnancy, use reliable contraception rather than relying on discharge observations alone.'
 ]},
 {heading:'Common changes—and why context matters',paragraphs:[
 'A white or clear discharge without discomfort is often normal. A thicker or creamier texture may appear at different points in the cycle. Discharge can also look different after sex or while using hormonal contraception. What matters is the combination of your usual pattern, how long a change lasts, and whether other symptoms appear.',
 'A strong or fishy odour, greyish discharge, itching, soreness, pain during urination, or a marked change may be associated with conditions such as bacterial vaginosis or other causes that need assessment. Thick white discharge with itching can occur with a yeast infection, but appearance alone cannot confirm it. Some sexually transmitted infections cause discharge or bleeding changes; others cause few or no symptoms.'
 ]},
 {heading:'Why colour charts cannot diagnose you',paragraphs:[
 'Green, yellow, grey, bloody or otherwise unusual discharge may warrant medical assessment, especially when it is new or accompanied by pain, fever, itching, odour or bleeding outside your period. But colour alone is not enough to tell which condition is present. Self-treating for a presumed yeast infection can delay the correct care if the cause is different.',
 'A clinician may ask about symptoms, sexual health, pregnancy possibility, medications and recent treatment. Depending on the situation, they may recommend an examination or a swab or urine test. Testing is not a judgement about your behaviour; it is a way to find the right treatment and avoid unnecessary medicines.'
 ]},
 {heading:'Gentle care: what helps and what to avoid',paragraphs:[
 'Wash the external vulva gently with water and, if tolerated, a mild unscented cleanser. Avoid douching and scented washes, sprays or wipes inside the vagina; they can irritate tissue and disrupt the normal environment. Breathable underwear may feel more comfortable, but there is no need to buy special products to make the vagina smell like perfume.',
 'Do not use leftover antibiotics or someone else’s medication. Treatments differ depending on the cause, and some medicines are not suitable during pregnancy or alongside particular health conditions. If symptoms persist, recur, worsen or you are unsure what is causing them, seek professional advice rather than repeatedly treating yourself.'
 ]},
 {heading:'When to seek help promptly',paragraphs:[
 'Arrange medical advice for persistent or recurrent discharge changes, a strong unusual odour, itching, burning, pain when urinating, sores, bleeding between periods or after sex, or possible STI exposure. Seek prompt assessment if you may be pregnant and have concerning symptoms. If a partner has been diagnosed with an STI, follow clinical advice about testing and treatment even if you feel well.',
 'Fever, significant pelvic or lower-abdominal pain, vomiting, faintness or feeling very unwell alongside vaginal symptoms needs urgent care. These symptoms can indicate a condition that requires prompt treatment. If you experience sudden severe pain or heavy bleeding, seek emergency help.'
 ]},
 {heading:'A simple symptom note for an appointment',paragraphs:[
 'If you want to track a change, write down when it started, what changed compared with your usual pattern, whether there is odour or irritation, where you are in your cycle, and any new products or medicines. Note any pelvic pain, fever, bleeding or pregnancy possibility. Avoid using an app to label the cause; the useful information is the observation itself.',
 'Your body does not need to look exactly like a diagram. Discharge varies, and you deserve care that is calm, confidential where available, and grounded in evidence. Ask what a test is for, how results will be shared, and what treatment options make sense for you.'
 ]}
 ,
 {heading:'Sexual health, testing and partner conversations',paragraphs:[
 'When a new discharge change follows sex with a new partner or a possible exposure to a sexually transmitted infection, consider contacting a sexual-health service for advice and testing. Some infections have mild or no symptoms, so how you feel cannot reliably tell you whether testing is needed. Ask which tests are appropriate, when to take them, whether a repeat test is recommended, and how to protect yourself and partners while waiting for results.',
 'If an infection is diagnosed, follow the treatment instructions and advice about partners, avoiding sex or using condoms during treatment, and returning for testing if recommended. Do not share prescription medicines or use leftover antibiotics. The right treatment depends on the cause, and incorrect medication can delay recovery or contribute to resistance. If you feel unsafe discussing sexual health with a partner, prioritise your safety and ask the clinician about confidential support.',
 'A discharge change is not evidence of poor hygiene or wrongdoing. Vaginal health is affected by biology, infections, irritation, medicines and other factors. You deserve clear explanations and respectful care, without shame or assumptions about your relationships.'
 ]},
 {heading:'Pregnancy, postpartum changes and other contexts',paragraphs:[
 'Discharge can change during pregnancy, and pregnancy possibility matters when assessing symptoms or choosing medication. If you are pregnant or may be pregnant and notice a new concerning discharge, bleeding, pelvic pain, fever or a strong unusual odour, contact a qualified clinician for advice. Do not assume that a change is simply a normal pregnancy symptom.',
 'After birth, during breastfeeding, around menopause, or while using hormonal contraception, vaginal moisture and discharge patterns may change. Low oestrogen can contribute to dryness or discomfort for some people, while other conditions can produce similar symptoms. A clinician can help distinguish the possibilities and discuss suitable care. Avoid self-treating persistent symptoms with fragranced products or supplements that promise to reset vaginal pH.',
 'If symptoms recur, write down what you notice and what treatments you have used. Repeated episodes deserve a clear assessment of the cause rather than endless cycles of guessing. You can ask for an explanation of test results and a plan for what to do if symptoms return.'
 ]}
 ,
 {heading:'What to expect from a respectful consultation',paragraphs:[
 'It is okay to feel nervous about discussing discharge, odour, itching or sexual health. You can begin with the symptom that concerns you most and ask the clinician to explain what they need to know. Depending on your symptoms, an appointment may involve questions, a urine sample, a swab or an examination; not every person needs every step. You can ask why a test is recommended, what it involves, how results will be delivered and what happens if it is uncomfortable.',
 'If an examination is suggested, the clinician should explain it and seek your consent. You can ask for a pause, ask questions, or decline an examination while discussing other options. If you prefer a clinician of a particular gender or need an interpreter, ask whether the service can accommodate you. These requests may not always be available immediately, but it is reasonable to raise them. Good care should help you understand the choices and feel respected, not leave you embarrassed or blamed.'
 ]}
 ],
 sources:[
 {label:'NHS — Vaginal discharge',url:'https://www.nhs.uk/symptoms/vaginal-discharge/',note:'Normal variation and symptoms that should be assessed.'},
 {label:'ACOG — Vaginitis',url:'https://www.acog.org/womens-health/faqs/vaginitis',note:'Common causes of vaginal symptoms and evaluation.'},
 {label:'CDC — Sexually transmitted infections',url:'https://www.cdc.gov/sti/about/index.html',note:'STI symptoms, testing and prevention information.'}
 ], takeaway:'Notice change and accompanying symptoms, not colour alone. Avoid douching and self-diagnosis, and seek care for persistent symptoms, pain, fever or unusual bleeding.'
},
{
 slug:'pregnancy-or-pms', category:'CYCLE QUESTIONS / PREGNANCY', title:'Pregnancy or PMS? Understanding overlapping symptoms and what to do next', dek:'Tender breasts, fatigue, cramps and mood changes can mean many things. Here is how to move from guessing to a clearer next step.', image:'/pregnancy-or-pms-the-symptoms-explained.jpg', readTime:'15 minute read', updated:'A considered guide to early pregnancy questions',
 intro:[
 'The days before a period can be full of uncertainty. Breast tenderness, bloating, tiredness, mild cramps, appetite changes and mood shifts may happen before menstruation, and some can also occur in early pregnancy. Symptoms overlap so much that feelings alone cannot reliably distinguish one from the other.',
 'If pregnancy is possible, a test is more useful than trying to interpret each sensation. This guide explains what symptoms can and cannot tell you, when to test, what to do with a result, and which warning signs should not wait.'
 ],
 sections:[
 {heading:'Why PMS and early pregnancy can feel alike',paragraphs:[
 'Premenstrual symptoms occur in the days before a period and may include cramps, breast tenderness, bloating, headaches, changes in appetite, acne, fatigue or emotional changes. Early pregnancy can also involve breast changes, tiredness, nausea, more frequent urination or light spotting, but not everyone experiences these symptoms and they can have other explanations.',
 'Both experiences are influenced by changing hormones, and symptom intensity varies between people and cycles. Stress, illness, sleep changes, medication and digestive issues can also affect how you feel. A familiar PMS pattern may be informative for you, but it cannot confirm that a period is coming or rule out pregnancy.'
 ]},
 {heading:'A missed period is a clue, not a diagnosis',paragraphs:[
 'For someone with regular cycles, a missed period can be one of the earlier signs of pregnancy. However, periods can be late for reasons including stress, illness, travel, changes in weight or exercise, breastfeeding, hormonal contraception and health conditions. Some people have irregular cycles or bleeding that makes the expected date difficult to estimate.',
 'Cycle apps predict dates from past information; they do not observe fertilisation or confirm pregnancy. If your period is late and pregnancy is possible, use a home pregnancy test according to its instructions. If you do not know when your period is due, the product instructions or a pharmacist can help you determine when testing is likely to be useful.'
 ]},
 {heading:'When and how to take a pregnancy test',paragraphs:[
 'Home pregnancy tests detect human chorionic gonadotropin (hCG) in urine. Tests vary, so follow the package instructions, including how long to wait before reading the result and when the test can be used. Testing too early can produce a negative result even if pregnancy has begun.',
 'If a test is negative but your period still has not arrived or pregnancy remains possible, repeat the test after the interval recommended in the instructions or seek advice from a healthcare professional. If results are unclear or conflicting, a clinician can help determine whether another test is needed. Do not use symptom intensity as a substitute for testing.'
 ]},
 {heading:'What to do after a positive result',paragraphs:[
 'A positive home test usually means pregnancy is likely. Contact a qualified healthcare professional or reproductive-health service to discuss next steps, timing of care, medicines, health conditions and any questions you have. If you may continue the pregnancy, early prenatal guidance can help you understand recommended care and supplements. If you are unsure about what you want to do, a non-judgemental provider can explain the options and available local services.',
 'Review medicines and supplements with a clinician or pharmacist rather than stopping prescribed treatment abruptly or assuming every product is safe. Avoid alcohol while pregnancy is possible and you are waiting for advice. If you have a chronic health condition or take regular medication, seeking individual guidance early is especially important.'
 ]},
 {heading:'Bleeding, cramps and urgent warning signs',paragraphs:[
 'Light spotting or mild cramps can occur for different reasons and do not by themselves confirm or rule out pregnancy. Bleeding can also signal a problem, so contact a clinician if you are pregnant or may be pregnant and experience bleeding or persistent pain. A clinician can advise based on timing, symptoms and your medical history.',
 'Seek urgent medical care for severe or one-sided lower-abdominal pain, shoulder-tip pain, heavy bleeding, dizziness, fainting or feeling acutely unwell when pregnancy is possible. These can be warning signs of an ectopic pregnancy or another urgent condition. Do not wait for a home test to become positive if you have severe symptoms.'
 ]},
 {heading:'If the test is negative and your period is still absent',paragraphs:[
 'A negative test may mean you are not pregnant, but the result depends on timing and correct use. Repeat it as directed if pregnancy remains possible. If periods continue to be absent, become persistently irregular, or you have other symptoms that concern you, arrange a clinical appointment. A clinician can assess possible causes and discuss whether tests are appropriate.',
 'If you were trying to conceive, a negative result can feel disappointing; if you were avoiding pregnancy, it can bring relief mixed with anxiety. Both reactions are understandable. Give yourself space to respond, and seek support from someone safe if you need it. There is no single correct emotional response to uncertainty.'
 ]},
 {heading:'Use tracking as a record, not a verdict',paragraphs:[
 'Crescent can help you record period dates and symptoms, but a predicted period date is not a pregnancy test and a fertility window estimate is not contraception. If avoiding pregnancy is important, consider a reliable method and know how to access emergency contraception promptly after a failure or unprotected sex.',
 'If you are trying to conceive, tracking may help you notice patterns over time, but it cannot guarantee that ovulation happened on a predicted day. Ask a healthcare professional for personalised guidance if you have concerns about fertility, repeated pregnancy loss, or how long you have been trying. The right next step depends on your age, health history and circumstances.'
 ]}
 ,
 {heading:'If pregnancy was not planned',paragraphs:[
 'If a test is positive and the pregnancy was not planned, you may have many reactions at once—or you may not know what you feel yet. You do not need to decide everything in a single moment. A qualified, non-judgemental reproductive-health provider can explain the options available where you live, including continuing the pregnancy and parenting, continuing the pregnancy and exploring adoption where available, or abortion where legal and accessible. Ask about timing, confidentiality, costs and what services are genuine and medically qualified.',
 'If you are worried about how a partner, family member or another person might react, think about who is safe to tell and whether you want support at an appointment. If someone is pressuring or threatening you about a pregnancy decision, tell a trusted clinician or support service if it is safe to do so. Your health, privacy and safety matter.',
 'Be cautious with unverified online sellers, home remedies or advice that promises to end a pregnancy without clear medical information. A qualified local provider can explain evidence-based options, what to expect, and which symptoms need urgent care. If you have severe pain, heavy bleeding or fainting, seek urgent medical assessment regardless of what you have decided.'
 ]},
 {heading:'If you were hoping for a different result',paragraphs:[
 'A negative test can bring relief, sadness or a complicated mix of emotions. If you were trying to conceive, it is understandable to feel disappointed; one cycle does not tell the whole story about future fertility. If you were anxious about pregnancy, you may still want a reliable plan for contraception and a way to access emergency care if a method fails in future.',
 'If pregnancy remains possible, follow the test instructions about repeating it. If your period remains absent or your cycles are repeatedly irregular, arrange a clinical check rather than relying on repeated symptom searches. A provider can help you understand what is known, what is uncertain and whether any further tests are appropriate.',
 'Whatever the result, you deserve information that is accurate and care that does not shame you. You can take the next step one at a time: confirm what is happening, understand your options, and get support that respects your circumstances.'
 ]}
 ,
 {heading:'Questions to bring to your next appointment',paragraphs:[
 'If you speak with a clinician, you can ask when a test is most reliable in your circumstances, whether a repeat test is appropriate, and what symptoms should prompt urgent care. Tell them the first day of your last period if you know it, whether your cycles are regular, whether you use contraception, and whether you have had pain or bleeding. You do not need to remember every detail; a short note on your phone or paper can help you feel less rushed.',
 'If the result changes what you need next, ask where you can get timely follow-up and what the likely costs or waiting times are. If you are taking medication or managing a health condition, ask how pregnancy possibility affects your care plan. Do not stop a prescribed medicine without checking unless you have been specifically instructed to do so. A pharmacist or clinician can help review the risks and alternatives.',
 'It is also fine to ask for plain language: “What do we know from this result, and what remains uncertain?” A good answer should separate evidence from possibility and explain the next step without frightening you unnecessarily.'
 ]}
 ],
 sources:[
 {label:'NHS — Doing a pregnancy test',url:'https://www.nhs.uk/pregnancy/trying-for-a-baby/doing-a-pregnancy-test/',note:'When to test and what results mean.'},
 {label:'ACOG — Bleeding During Pregnancy',url:'https://www.acog.org/womens-health/faqs/bleeding-during-pregnancy',note:'Why bleeding should be discussed with a clinician.'},
 {label:'NHS — Ectopic pregnancy',url:'https://www.nhs.uk/conditions/ectopic-pregnancy/',note:'Symptoms requiring urgent medical assessment.'}
 ], takeaway:'Symptoms cannot reliably tell PMS from pregnancy. Test at the right time, repeat if needed, and seek urgent care for severe pain, fainting or heavy bleeding.'
}
];

function ReadingProgress() {
 const [progress, setProgress] = React.useState(0);
 React.useEffect(() => {
  const update = () => { const max = document.documentElement.scrollHeight - window.innerHeight; setProgress(max > 0 ? Math.min(100, Math.round(window.scrollY / max * 100)) : 0); };
  update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
  return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
 }, []);
 return <div className="editorial-progress" aria-hidden="true"><span style={{width: progress + '%'}} /></div>;
}
export default function EditorialArticlePage() {
 const slug = window.location.pathname.replace(/^\/read\//, '').replace(/\/$/, '');
 const story = stories.find(item => item.slug === slug);
 if (!story) return <main className="editorial-not-found"><a href="/dashboard">← Return to Crescent</a><p className="editorial-kicker">THE READING ROOM</p><h1>This article is not available yet.</h1><p>Explore the latest body-literacy articles from your dashboard.</p><a className="editorial-button" href="/dashboard#read-next">Explore articles</a></main>;
 const otherStories = stories.filter(item => item.slug !== story.slug).slice(0, 3);
 return <div className="editorial-shell">
  <ReadingProgress />
  <header className="editorial-nav"><a className="editorial-wordmark" href="/dashboard"><span>☾</span> crescent<span className="editorial-wordmark-dot">.</span></a><div className="editorial-nav-label">THE READING ROOM <i> / </i> BODY, BEAUTY & KNOWLEDGE</div><a className="editorial-nav-back" href="/dashboard#read-next">Back to your space ↗</a></header>
  <main>
   <section className="editorial-cover">
    <div className="editorial-cover-copy"><p className="editorial-kicker">{story.category}</p><h1>{story.title}</h1><p className="editorial-dek">{story.dek}</p><div className="editorial-byline"><span className="editorial-byline-mark">C.</span><span><strong>Crescent Editorial</strong><small>Evidence-informed body literacy · {story.readTime}</small></span></div><a className="editorial-start" href="#story">BEGIN READING <span>↓</span></a></div>
    <figure className="editorial-cover-image"><img src={story.image} alt="" /><figcaption>THE CRESCENT JOURNAL <span>VOL. 01</span></figcaption></figure>
    <div className="editorial-cover-index"><span>01</span><span>KNOWLEDGE, WITH CARE</span><span>✳</span></div>
   </section>
   <div className="editorial-meta-strip"><span>THE BODY, UNDERSTOOD</span><span>AN OPEN, GENTLE CONVERSATION</span><span>{story.readTime.toUpperCase()}</span></div>
   <article className="editorial-story" id="story">
    <aside className="editorial-story-aside"><span className="editorial-aside-number">C / JOURNAL</span><p>Read with curiosity. Keep what helps. Bring questions to a qualified health professional when you need individual advice.</p><a href="#sources">Sources & further reading ↓</a></aside>
    <div className="editorial-story-main"><div className="editorial-intro">{story.intro.map((p,i)=><p key={i}>{p}</p>)}</div>
     {story.sections.map((section,i)=><section className="editorial-chapter" id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')} key={section.heading}><div className="editorial-chapter-index">{String(i+1).padStart(2,'0')} <span>—</span> THE NOTES</div><h2>{section.heading}</h2>{section.paragraphs.map((p,j)=><p key={j}>{renderCitations(p)}</p>)}{section.points && <ul>{section.points.map(point=><li key={point}>{point}</li>)}</ul>}</section>)}
     <section className="editorial-takeaway"><p className="editorial-kicker">KEEP THIS CLOSE</p><p>{story.takeaway}</p></section>
     <section className="editorial-sources" id="sources"><p className="editorial-kicker">THE READING LIST</p><h2>Evidence worth keeping.</h2><p className="editorial-sources-intro">This article is educational, not a diagnosis or a substitute for individual medical advice. The links below provide additional guidance from recognised health organisations.</p><ol>{story.sources.map(source=><li id={'source-' + (story.sources.findIndex(item => item.url === source.url) + 1)} key={source.url}><div><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a><p>{source.note}</p></div></li>)}</ol><p className="editorial-review-note">Content is intended for general education. Guidance and services may vary by country; consult a qualified local health professional for personal care.</p></section>
    </div>
   </article>
   <section className="editorial-more"><div className="editorial-more-heading"><div><p className="editorial-kicker">KEEP EXPLORING</p><h2>Another article, another perspective.</h2></div><a href="/dashboard#read-next">All articles ↗</a></div><div className="editorial-more-grid">{otherStories.map((item,i)=><a className="editorial-more-card" href={'/read/'+item.slug} key={item.slug}><img src={item.image} alt="" /><div><span>0{i+1} / {item.category}</span><h3>{item.title}</h3><p>{item.readTime} <b>↗</b></p></div></a>)}</div></section>
  </main>
  <footer className="editorial-footer"><a className="editorial-wordmark" href="/dashboard"><span>☾</span> crescent<span className="editorial-wordmark-dot">.</span></a><p>Your body, your story, your space.</p><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Help &amp; support</a><a href="/dashboard">RETURN TO YOUR UNIVERSE ↑</a></footer>
 </div>;
}

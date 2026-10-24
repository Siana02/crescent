import React from 'react';
import '../styles/editorial-articles.css';

type Section = { heading: string; paragraphs: string[]; points?: string[] };
type Story = { slug: string; category: string; title: string; dek: string; image: string; readTime: string; updated: string; intro: string[]; sections: Section[]; sources: { label: string; url: string; note: string }[]; takeaway: string };
const stories: Story[] = [
{
 slug:'painful-period-cramps', category:'THE BODY / PAIN & PERIODS', title:'Painful period cramps: Is it normal, or could it be something else?', dek:'A thoughtful guide to menstrual pain, what may help, and the signals that deserve more than being told to put up with it.', image:'/Painful-period-cramps-is-it-normal-or-could-it-be-something-else.jpg', readTime:'10 minute read', updated:'A considered guide to menstrual health',
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
 ],
 sources:[
 {label:'NHS — Period pain',url:'https://www.nhs.uk/conditions/period-pain/',note:'Symptoms, self-care and when to seek medical advice.'},
 {label:'ACOG — Dysmenorrhea: Painful Periods',url:'https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods',note:'Patient guidance on painful periods and treatment options.'},
 {label:'NHS — Endometriosis',url:'https://www.nhs.uk/conditions/endometriosis/',note:'Symptoms and routes to assessment for a possible underlying condition.'}
 ], takeaway:'Pain that disrupts your life deserves care. Track your pattern if useful, try safe comfort measures, and seek clinical advice for severe, changing or persistent symptoms.'
},
{
 slug:'menstrual-cycle-stages', category:'THE BODY / CYCLE LITERACY', title:'The menstrual cycle, explained: stages, symptoms and what your body needs', dek:'A clear, compassionate tour of menstruation, the follicular phase, ovulation and the luteal phase—without turning a living body into a rigid calendar.', image:'/The-different-stages-of-the-menstrual-cycle-symptoms-and-tips.jpg', readTime:'10 minute read', updated:'A considered guide to cycle literacy',
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
 ],
 sources:[
 {label:'ACOG — Your Menstrual Cycle',url:'https://www.acog.org/womens-health/faqs/your-menstrual-cycle',note:'How the cycle works and when a pattern may need evaluation.'},
 {label:'NHS — Periods',url:'https://www.nhs.uk/conditions/periods/',note:'Period basics and common concerns.'},
 {label:'ASRM — Optimizing natural fertility',url:'https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021/',note:'Evidence and limitations around fertile-window timing.'}
 ], takeaway:'Use cycle phases as a map, not a schedule. Your own patterns, context and wellbeing matter more than a predicted day.'
},
{
 slug:'contraception-and-period-products', category:'YOUR CHOICES / SEXUAL HEALTH', title:'Contraception and period products: Understanding your options', dek:'A practical, judgement-free overview of pregnancy prevention, bleeding changes and period care so you can ask better questions and choose what fits your life.', image:'/The-different-types-of-conteaceptives-and-different-methods-of-period-blood-collection-explained.jpg', readTime:'10 minute read', updated:'A considered guide to informed choices',
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
 ],
 sources:[
 {label:'WHO — Family planning / contraception methods',url:'https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception',note:'Overview of contraceptive methods and informed choice.'},
 {label:'NHS — Contraception',url:'https://www.nhs.uk/contraception/',note:'Practical explanations of method types, use and side effects.'},
 {label:'NHS — Period products',url:'https://www.nhs.uk/conditions/periods/period-products/',note:'Product types and safe use.'}
 ], takeaway:'Choose based on your body, circumstances and preferences. For pregnancy prevention and STI protection, understand what each method does—and ask for individual guidance when you need it.'
},
{
 slug:'vaginal-discharge', category:'BODY LITERACY / VAGINAL HEALTH', title:'Vaginal discharge decoded: Colours, textures, infections and when to seek help', dek:'Learn what discharge can normally look and feel like, what patterns may be worth checking, and why colour alone cannot diagnose an infection.', image:'/Vaginal-discharge-the-different-types-and-colors-explained-how-to-spot-yeast-infection-when-to-seek-help.jpg', readTime:'10 minute read', updated:'A considered guide to vaginal health',
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
 ],
 sources:[
 {label:'NHS — Vaginal discharge',url:'https://www.nhs.uk/symptoms/vaginal-discharge/',note:'Normal variation and symptoms that should be assessed.'},
 {label:'ACOG — Vaginitis',url:'https://www.acog.org/womens-health/faqs/vaginitis',note:'Common causes of vaginal symptoms and evaluation.'},
 {label:'CDC — Sexually transmitted infections',url:'https://www.cdc.gov/sti/about/index.html',note:'STI symptoms, testing and prevention information.'}
 ], takeaway:'Notice change and accompanying symptoms, not colour alone. Avoid douching and self-diagnosis, and seek care for persistent symptoms, pain, fever or unusual bleeding.'
},
{
 slug:'pregnancy-or-pms', category:'CYCLE QUESTIONS / PREGNANCY', title:'Pregnancy or PMS? Understanding overlapping symptoms and what to do next', dek:'Tender breasts, fatigue, cramps and mood changes can mean many things. Here is how to move from guessing to a clearer next step.', image:'/pregnancy-or-pms-the-symptoms-explained.jpg', readTime:'10 minute read', updated:'A considered guide to early pregnancy questions',
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
 const slug = window.location.pathname.replace(/^\\/read\\//, '').replace(/\\/$/, '');
 const story = stories.find(item => item.slug === slug);
 if (!story) return <main className="editorial-not-found"><a href="/dashboard">← Return to Crescent</a><p className="editorial-kicker">THE READING ROOM</p><h1>This story is still finding its way.</h1><p>Explore the latest body-literacy guides from your dashboard.</p><a className="editorial-button" href="/dashboard#read-next">Explore the journal</a></main>;
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
     {story.sections.map((section,i)=><section className="editorial-chapter" key={section.heading}><div className="editorial-chapter-index">{String(i+1).padStart(2,'0')} <span>—</span> THE NOTES</div><h2>{section.heading}</h2>{section.paragraphs.map((p,j)=><p key={j}>{p}</p>)}{section.points && <ul>{section.points.map(point=><li key={point}>{point}</li>)}</ul>}</section>)}
     <section className="editorial-takeaway"><p className="editorial-kicker">KEEP THIS CLOSE</p><p>{story.takeaway}</p></section>
     <section className="editorial-sources" id="sources"><p className="editorial-kicker">THE READING LIST</p><h2>Evidence worth keeping.</h2><p className="editorial-sources-intro">This article is educational, not a diagnosis or a substitute for individual medical advice. The links below provide additional guidance from recognised health organisations.</p><ol>{story.sources.map(source=><li key={source.url}><div><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a><p>{source.note}</p></div></li>)}</ol><p className="editorial-review-note">Content is intended for general education. Guidance and services may vary by country; consult a qualified local health professional for personal care.</p></section>
    </div>
   </article>
   <section className="editorial-more"><div className="editorial-more-heading"><div><p className="editorial-kicker">CONTINUE YOUR CURIOSITY</p><h2>Another page, another perspective.</h2></div><a href="/dashboard#read-next">All stories ↗</a></div><div className="editorial-more-grid">{otherStories.map((item,i)=><a className="editorial-more-card" href={'/read/'+item.slug} key={item.slug}><img src={item.image} alt="" /><div><span>0{i+1} / {item.category}</span><h3>{item.title}</h3><p>{item.readTime} <b>↗</b></p></div></a>)}</div></section>
  </main>
  <footer className="editorial-footer"><a className="editorial-wordmark" href="/dashboard"><span>☾</span> crescent<span className="editorial-wordmark-dot">.</span></a><p>Your body, your story, your space.</p><a href="/dashboard">RETURN TO YOUR UNIVERSE ↑</a></footer>
 </div>;
}

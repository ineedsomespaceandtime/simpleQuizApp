function ss(){try{localStorage.setItem('_x','1');localStorage.removeItem('_x');return localStorage}catch{const m={};return{getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=String(v)}}}}
const store=ss();
let questions=JSON.parse(store.getItem('qlQuestions'))||[];
let qz=[],qi=0,sc=0;

const titles={create:['Create a question','Add questions to your bank'],bank:['Question bank','All your saved questions'],quiz:['Quiz session','Test your knowledge']};

function showView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('show'));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('show');
  event.currentTarget.classList.add('active');
  document.getElementById('topbar-title').textContent=titles[v][0];
  document.getElementById('topbar-sub').textContent=titles[v][1];
  if(v==='bank')renderBank();
  if(v==='quiz'){document.getElementById('start-count').textContent=questions.length;document.getElementById('quiz-start').style.display='';document.getElementById('quiz-active').style.display='none';document.getElementById('quiz-results').style.display='none';}
}

function toggleType(){
  const t=document.getElementById('q-type').value;
  document.getElementById('mc-fields').style.display=t==='multiple-choice'?'':'none';
  document.getElementById('id-fields').style.display=t==='identification'?'':'none';
}

function esc(s){const d=document.createElement('div');d.appendChild(document.createTextNode(s||''));return d.innerHTML}

function saveQ(){
  const type=document.getElementById('q-type').value;
  const text=document.getElementById('q-text').value.trim();
  if(!text){alert('Enter a question.');return;}
  const q={id:Date.now(),type,question:text};
  if(type==='multiple-choice'){
    const inps=document.querySelectorAll('.option-input');
    const imgs=document.querySelectorAll('.option-image');
    const ltr=document.getElementById('correct-option').value.trim().toUpperCase();
    const idx=ltr.charCodeAt(0)-65;
    if(isNaN(idx)||idx<0||idx>3){alert('Enter A, B, C, or D.');return;}
    for(let i=0;i<inps.length;i++){if(!inps[i].value.trim()&&!imgs[i].files[0]){alert(`Option ${String.fromCharCode(65+i)} is empty.`);return;}}
    const ps=Array.from(inps).map((inp,i)=>{const f=imgs[i].files[0];if(f)return new Promise(r=>{const rd=new FileReader();rd.onload=e=>r({text:inp.value.trim(),image:e.target.result});rd.readAsDataURL(f);});return Promise.resolve({text:inp.value.trim(),image:null});});
    Promise.all(ps).then(opts=>{q.options=opts;q.answerIndex=idx;q.answer=opts[idx];persist(q);});
  } else {
    const ans=document.getElementById('correct-answer').value.trim();
    const f=document.getElementById('answer-image').files[0];
    if(!ans&&!f){alert('Enter an answer.');return;}
    if(f){const rd=new FileReader();rd.onload=e=>{q.answer={text:ans,image:e.target.result};persist(q);};rd.readAsDataURL(f);}
    else{q.answer={text:ans,image:null};persist(q);}
  }
}

function persist(q){
  questions.push(q);
  store.setItem('qlQuestions',JSON.stringify(questions));
  document.getElementById('sidebar-count').textContent=questions.length;
  clearForm();
  showToast('Question saved');
}

function clearForm(){
  document.getElementById('q-text').value='';
  document.querySelectorAll('.option-input').forEach(i=>i.value='');
  document.querySelectorAll('.option-image').forEach(i=>{const c=i.cloneNode(true);i.parentNode.replaceChild(c,i);});
  document.getElementById('correct-option').value='';
  document.getElementById('correct-answer').value='';
  const ai=document.getElementById('answer-image');
  if(ai){const c=ai.cloneNode(true);ai.parentNode.replaceChild(c,ai);}
}

function showToast(msg){
  const t=document.createElement('div');
  t.textContent=msg;
  Object.assign(t.style,{position:'fixed',bottom:'20px',right:'20px',background:'#7c3aed',color:'#fff',padding:'10px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:'500',zIndex:'999',transition:'opacity .3s'});
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300);},2000);
}

function deleteQ(id){questions=questions.filter(q=>q.id!==id);store.setItem('qlQuestions',JSON.stringify(questions));document.getElementById('sidebar-count').textContent=questions.length;renderBank();}

function renderBank(){
  const el=document.getElementById('bank-body');
  if(!questions.length){el.innerHTML='<div class="empty-state"><i class="ti ti-notes" aria-hidden="true"></i><div>No questions yet.</div></div>';return;}
  el.innerHTML=`<table class="q-table"><thead><tr><th>#</th><th>Question</th><th>Type</th><th>Answer</th><th></th></tr></thead><tbody>${questions.map((q,i)=>`<tr><td style="color:#52525b;font-size:12px">${i+1}</td><td style="color:#e8e8ec;max-width:200px">${esc(q.question)}</td><td><span class="pill ${q.type==='multiple-choice'?'pill-mc':'pill-id'}">${q.type==='multiple-choice'?'MC':'ID'}</span></td><td style="color:#71717a;font-size:12px">${esc(q.answer?.text||'(image)')}</td><td><button class="btn btn-red" onclick="deleteQ(${q.id})"><i class="ti ti-trash" aria-hidden="true">Delete</i></button></td></tr>`).join('')}</tbody></table>`;
}

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function startQuiz(){
  if(!questions.length){alert('Add questions first.');return;}
  qz=shuffle([...questions]);qi=0;sc=0;
  document.getElementById('quiz-start').style.display='none';
  document.getElementById('quiz-results').style.display='none';
  document.getElementById('quiz-active').style.display='';
  showQ();
}

function showQ(){
  const q=qz[qi];
  const pct=Math.round((qi/qz.length)*100);
  document.getElementById('prog-fill').style.width=pct+'%';
  document.getElementById('prog-label').textContent=`${qi+1} / ${qz.length}`;
  document.getElementById('score-badge').textContent=`${sc} pts`;
  document.getElementById('quiz-q').textContent=q.question;
  document.getElementById('feedback').style.display='none';
  document.getElementById('hint-box').style.display='none';
  document.getElementById('next-btn').style.display='none';
  document.getElementById('submit-btn').style.display='';
  document.getElementById('hint-btn').disabled=false;
  const oldSee=document.getElementById('see-results-btn');
  if(oldSee)oldSee.remove();
  const opts=document.getElementById('quiz-opts');
  if(q.type==='multiple-choice'){
    opts.innerHTML=q.options.map((o,i)=>`<button class="opt-btn" data-index="${i}" onclick="selOpt(this)"><span class="opt-letter">${String.fromCharCode(65+i)}</span><span>${esc(o.text||'')}${o.image?`<br><img src="${o.image}" style="max-width:100px;margin-top:6px;border-radius:6px">`:''}</span></button>`).join('');
  } else {
    opts.innerHTML=`<input class="id-inp" type="text" placeholder="Type your answer…" autocomplete="off">`;
  }
}

function selOpt(el){document.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('sel'));el.classList.add('sel');}

function submitAnswer(){
  const q=qz[qi];let ok=false;
  if(q.type==='multiple-choice'){
    const sel=document.querySelector('.opt-btn.sel');
    if(!sel){alert('Select an answer.');return;}
    ok=parseInt(sel.dataset.index,10)===q.answerIndex;
    document.querySelectorAll('.opt-btn').forEach(b=>{b.disabled=true;const i=parseInt(b.dataset.index,10);if(i===q.answerIndex)b.classList.add('correct-a');else if(b.classList.contains('sel'))b.classList.add('wrong-a');});
  } else {
    const inp=document.querySelector('.id-inp');
    if(!inp||!inp.value.trim()){alert('Type an answer.');return;}
    ok=inp.value.trim().toLowerCase()===(q.answer.text||'').trim().toLowerCase();
    inp.disabled=true;
  }
  if(ok)sc++;
  document.getElementById('score-badge').textContent=`${sc} pts`;
  const fb=document.getElementById('feedback');
  fb.className='feedback '+(ok?'ok':'no');
  fb.innerHTML=ok?'<i class="ti ti-circle-check" aria-hidden="true"></i> Correct!':'<i class="ti ti-circle-x" aria-hidden="true"></i> '+(q.answer.text?`Incorrect — ${esc(q.answer.text)}`:'Incorrect.');
  fb.style.display='flex';
  document.getElementById('submit-btn').style.display='none';
  document.getElementById('hint-btn').disabled=true;
  if(qi<qz.length-1){
    document.getElementById('next-btn').style.display='';
  } else {
    const sb=document.createElement('button');
    sb.id='see-results-btn';sb.className='btn btn-purple';
    sb.innerHTML='<i class="ti ti-chart-bar" aria-hidden="true"></i> See results';
    sb.onclick=showResults;
    document.querySelector('.action-row').appendChild(sb);
  }
}

function nextQ(){qi++;showQ();}

function showResults(){
  document.getElementById('quiz-active').style.display='none';
  document.getElementById('quiz-results').style.display='';
  const pct=Math.round((sc/qz.length)*100);
  document.getElementById('res-num').childNodes[0].textContent=sc;
  document.getElementById('res-den').textContent='/'+qz.length;
  document.getElementById('res-pct').textContent=pct+'% correct';
  const msgs=['Keep practicing!','Getting there.','Solid effort.','Well done!','Perfect score!'];
  document.getElementById('res-msg').textContent=msgs[Math.min(4,Math.floor(pct/20))];
}

function restartQuiz(){document.getElementById('quiz-results').style.display='none';document.getElementById('quiz-start').style.display='';}
function goCreate(){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('show'));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-create').classList.add('show');
  document.querySelector('.nav-item').classList.add('active');
  document.getElementById('topbar-title').textContent=titles.create[0];
  document.getElementById('topbar-sub').textContent=titles.create[1];
}

const GEMINI_API_KEY='PUT-YOUR-API-KEY-HERE';
const GEMINI_URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
async function getHint(){
  const q=qz[qi];
  document.getElementById('hint-btn').disabled=true;
  const hb=document.getElementById('hint-box');
  hb.style.display='block';hb.textContent='Thinking…';
  try{
    const res=await fetch(GEMINI_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:`Give a short hint. Question: ${q.question}`}]}]})});
    const data=await res.json();
    hb.textContent=data.candidates[0].content.parts[0].text;
  }catch{hb.textContent='Could not fetch a hint.';}
}

document.getElementById('sidebar-count').textContent=questions.length;
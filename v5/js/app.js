
import {SudokuBoard,ALL,name} from './core.js';
import {SudokuSolver} from './solver.js';
import {SudokuScanner} from './scanner.js';
import {TRAINING} from './trainer.js';
import {PuzzleLibrary} from './storage.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const board=new SudokuBoard();const solver=new SudokuSolver(board);const library=new PuzzleLibrary();
let selected=0,mode='value',currentStep=null,activePuzzleId=null;
let sessionStats={usedHints:0,fullHints:0,techniques:[]};
const boardEl=$('#board');
function resetSession(){sessionStats={usedHints:0,fullHints:0,techniques:[]}}
function saveActive(lastTechnique=null){if(!activePuzzleId)return;library.save(activePuzzleId,board,{lastTechnique});renderLibrary()}
function fmtTime(iso){if(!iso)return'';const d=new Date(iso),n=new Date();return d.toDateString()===n.toDateString()?`今天 ${d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`:`${d.getMonth()+1}月${d.getDate()}日 ${d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`}
function renderLibrary(){
 const el=$('#libraryList');if(!el)return;const items=library.list();
 if(!items.length){el.innerHTML='<div class="library-empty">还没有保存的题目。<br>扫描并导入一道题后，会自动出现在这里。</div>';return}
 el.innerHTML='';
 for(const item of items){
   const filled=item.current?.values?.filter(Boolean).length||0,done=item.completed||filled===81;
   const card=document.createElement('div');card.className='library-item';
   card.innerHTML=`<div class="library-top"><div><div class="library-title">${item.title||'数独题目'}</div><div class="library-meta">${fmtTime(item.updatedAt)} · ${item.source==='scan'?'扫描导入':'手工录入'}</div></div><span class="library-status ${done?'done':''}">${done?'已完成':'未完成'}</span></div>
   <div class="library-progress"><i style="width:${Math.round(filled/81*100)}%"></i></div>
   <div class="library-tech">${filled}/81${item.lastTechnique?' · 最近技巧：'+item.lastTechnique:''}</div>
   <div class="library-actions"><button class="btn continue">${done?'查看完成盘':'继续练习'}</button><button class="btn restart">重新练习</button><button class="btn library-delete del">删</button></div>`;
   card.querySelector('.continue').onclick=()=>openSaved(item.id,false);
   card.querySelector('.restart').onclick=()=>openSaved(item.id,true);
   card.querySelector('.del').onclick=()=>{if(confirm('删除这道题的记录？')){library.remove(item.id);if(activePuzzleId===item.id)activePuzzleId=null;renderLibrary()}};
   el.appendChild(card)
 }
}
function openSaved(id,fresh){
 if(!library.restore(id,board,{fresh}))return;
 activePuzzleId=id;resetSession();currentStep=null;coachStep=null;renderBoard();
 $$('.tab').find(x=>x.dataset.page==='solve')?.click()
}
function renderBoard(){
 boardEl.innerHTML='';
 for(let i=0;i<81;i++){const b=document.createElement('button');b.className='cell'+(board.givens.has(i)?' given':'')+(i===selected?' selected':'');const v=board.values[i];if(v)b.innerHTML=`<span class="value">${v}</span>`;else{const c=board.candidates(i),show=board.notes[i].size?[...board.notes[i]]:c;b.innerHTML='<span class="cands">'+ALL.map(n=>`<span class="cand ${currentStep?.elim?.some(e=>e.i===i&&e.n===n)?'elim':''}">${show.includes(n)?n:''}</span>`).join('')+'</span>'}if(currentStep?.cells?.includes(i))b.classList.add('hint-cell');b.onclick=()=>{selected=i;renderBoard()};boardEl.appendChild(b)}
}
for(const n of ALL){const k=document.createElement('button');k.className='key';k.textContent=n;k.onclick=()=>{if(board.givens.has(selected))return;if(mode==='note')board.toggleNote(selected,n);else board.set(selected,n);currentStep=null;coachStep=null;$('#solveCoach').classList.add('hidden');renderBoard();saveActive()};$('#keypad').appendChild(k)}
$('#valueMode').onclick=()=>{mode='value';$('#valueMode').classList.add('active');$('#noteMode').classList.remove('active')};
$('#noteMode').onclick=()=>{mode='note';$('#noteMode').classList.add('active');$('#valueMode').classList.remove('active')};
$('#eraseBtn').onclick=()=>{board.erase(selected);currentStep=null;renderBoard();saveActive()};
$('#undoBtn').onclick=()=>{board.undo();currentStep=null;renderBoard();saveActive()};
$('#sampleBtn').onclick=()=>{board.load('380000000067080053509300008978001346050763009603008570795632000842000635136800297');activePuzzleId=null;resetSession();currentStep=null;renderBoard()};
$('#clearBtn').onclick=()=>{board.load('0'.repeat(81));activePuzzleId=null;resetSession();renderBoard()};
$('#checkBtn').onclick=()=>{const v=board.validate();alert(v.ok?'当前盘面没有直接冲突。':`发现 ${v.conflicts.length} 个冲突格、${v.dead.length} 个零候选格。`)};
$('#exportBtn').onclick=()=>prompt('81位题目字符串',board.string());


const TECH_LEARNING={
 '裸单':{idea:'一个格只剩1个候选。',scan:'卡住时先扫候选最少的格。',transfer:'以后看到某格只剩一个候选，就可以立即确定。'},
 '隐藏单数':{idea:'某个数字在一行、列或宫中只剩一个可放位置。',scan:'不要只盯格子，要换成“这个数字还能放哪里？”',transfer:'候选很多的格也可能是隐藏单。'},
 '锁定候选（指向）':{idea:'一个宫里的某候选全部落在同一行或列。',scan:'先按宫观察某个数字是否被压成一条直线。',transfer:'一旦锁定，同一行/列在宫外的位置就能删除。'},
 '裸对':{idea:'两个格只包含同样两个候选，因此这两个数字被锁住。',scan:'寻找同一单位里的相同双候选。',transfer:'锁住后，同单位其他格可删除这两个数字。'},
 '裸三数组':{idea:'三个格的候选并集刚好只有三个数字。',scan:'不必三个格完全相同，重点看候选并集。',transfer:'这三个数字只能占据这三格。'},
 '裸四数组':{idea:'四个格的候选并集刚好只有四个数字。',scan:'从候选较少的格开始组合观察。',transfer:'四个数字被锁在四格中。'},
 'XY-Wing':{idea:'一个双候选枢轴连接两个双候选翼。',scan:'先找双候选枢轴，再找分别与它共享不同候选的两翼。',transfer:'两翼共享的第三候选，可从同时看见两翼的位置删除。'},
 'W-Wing':{idea:'两个相同双候选格，通过其中一个候选的强链连接。',scan:'先找相同双候选，再检查两个数字哪一个能通过强链接两翼。',transfer:'另一个候选必至少在一翼成立，因此共同可见位置可删除。'},
 'X-Wing':{idea:'同一候选在两行中都只落在相同两列（或反之）。',scan:'按单一数字扫描两行/两列的候选分布。',transfer:'矩形外同列/同行的该候选可以删除。'},
 '矛盾链':{idea:'假设一个候选成立后会导致盘面无解。',scan:'这是较高阶兜底，不应优先于可见图形技巧。',transfer:'理解“假设→传递→矛盾→排除”的逻辑，而不是猜测。'}
};
let coachStep=null, coachLevel=1;

function keyPositions(s){return (s?.cells||[]).map(name).join('、')||'—'}
function eliminationText(s){return (s?.elim||[]).map(e=>`${name(e.i)} 的 ${e.n}`).join('、')}
function directionText(s){
  const t=TECH_LEARNING[s.tech];
  if(t)return t.scan;
  return s.short||'先观察候选关系，不急着看答案。'
}
function structureText(s){
  if(s.tech==='W-Wing') return `先不要找删除数。请在盘面中找两个相同的双候选翼；关键区域在 ${keyPositions(s)}。`;
  if(s.tech==='XY-Wing') return `先找一个枢轴和两个翼。关键格位于 ${keyPositions(s)}，先判断它们各自扮演什么角色。`;
  if(s.tech==='X-Wing') return `只观察同一个候选在行/列中的位置。关键四格为 ${keyPositions(s)}。`;
  if(s.fill) return `把注意力缩小到 ${keyPositions(s)}。先自己判断为什么这里能确定一个数字。`;
  return `把注意力缩小到 ${keyPositions(s)}。先自己判断这些格形成了什么候选结构。`
}
function reasoningText(s){
  const result=s.fill?`${name(s.fill.i)} = ${s.fill.n}`:`可以删除：${eliminationText(s)}`;
  return `${s.text}<div class="coach-detail"><b>先自己完成最后一步：</b><br>${result}</div>`
}
function renderCoach(){
  const box=$('#solveCoachBox');
  if(!coachStep){box.innerHTML='<div class="coach-question">当前没有可用的引导步骤。</div>';return}
  const t=TECH_LEARNING[coachStep.tech]||{};
  let body='';
  if(coachLevel===1) body=`<div class="coach-kicker">第1层 · 只给方向</div><div class="coach-tech">${coachStep.tech}</div><div class="coach-question">${directionText(coachStep)}</div>`;
  if(coachLevel===2) body=`<div class="coach-kicker">第2层 · 缩小范围</div><div class="coach-tech">${coachStep.tech}</div><div class="coach-question">${structureText(coachStep)}</div>`;
  if(coachLevel===3) body=`<div class="coach-kicker">第3层 · 推理关系</div><div class="coach-tech">${coachStep.tech}</div><div class="coach-question">${reasoningText(coachStep)}</div>`;
  if(coachLevel===4) body=`<div class="coach-kicker">第4层 · 完整逻辑</div><div class="coach-tech">${coachStep.tech}</div><div class="coach-question">${coachStep.text}</div><div class="coach-detail"><b>结论：</b><br>${coachStep.fill?`${name(coachStep.fill.i)} = ${coachStep.fill.n}`:eliminationText(coachStep)}</div>`;
  if(t.idea && coachLevel>=3) body+=`<div class="coach-detail"><b>这个技巧的核心：</b>${t.idea}</div>`;
  box.innerHTML=body;
  $$('.coach-dot').forEach((d,i)=>{d.classList.toggle('active',i===coachLevel-1);d.classList.toggle('done',i<coachLevel-1)});
  $('#coachPrev').disabled=coachLevel===1;
  $('#coachNext').textContent=coachLevel===4?'已到完整逻辑':'继续提示';
  $('#coachNext').disabled=coachLevel===4;
  $('#coachFinalActions').classList.toggle('hidden',coachLevel<4);
  currentStep=coachStep;renderBoard()
}
function startCoach(){
  coachStep=solver.find();coachLevel=1;
  if(coachStep){sessionStats.usedHints++;sessionStats.techniques.push(coachStep.tech)}
  $('#solveCoach').classList.remove('hidden');$('#learningCard').classList.add('hidden');
  if(!coachStep){
    $('#solveCoachBox').innerHTML=board.values.every(Boolean)?'<b>题目已经完成。</b>':'<b>当前引擎没有找到可推进步骤。</b><br>如果盘面是正确的，可能需要尚未实现的更高阶技巧。';
    $('#coachNext').disabled=true;$('#coachPrev').disabled=true;$('#coachFinalActions').classList.add('hidden');
    currentStep=null;renderBoard();return
  }
  renderCoach()
}
function showLearningCard(step){
  const t=TECH_LEARNING[step.tech]||{idea:step.text,scan:'回看刚才的关键格。',transfer:'下次遇到相似候选结构时先尝试识别它。'};
  $('#learningContent').innerHTML=`<div class="learning-tech">${step.tech}</div>
  <div class="learning-row"><span class="learning-label">刚才发生了什么</span>${step.text}</div>
  <div class="learning-row"><span class="learning-label">识别要点</span>${t.scan}</div>
  <div class="learning-row"><span class="learning-label">以后怎么迁移</span>${t.transfer}</div>`;
  $('#learningCard').classList.remove('hidden')
}
$('#stuckBtn').onclick=startCoach;
$('#coachPrev').onclick=()=>{if(coachLevel>1){coachLevel--;renderCoach()}};
$('#coachNext').onclick=()=>{if(coachLevel<4){coachLevel++;if(coachLevel===4)sessionStats.fullHints++;renderCoach()}};
$('#coachApply').onclick=()=>{
  if(!coachStep)return;const done=coachStep;board.apply(done);coachStep=null;currentStep=null;renderBoard();saveActive(done.tech);
  if(activePuzzleId&&board.values.every(Boolean)&&board.validate().ok)library.addAttempt(activePuzzleId,{...sessionStats,completed:true});
  $('#solveCoach').classList.add('hidden');showLearningCard(done)
};
$('#coachDidIt').onclick=()=>{
  const done=coachStep;coachStep=null;currentStep=null;$('#solveCoach').classList.add('hidden');renderBoard();
  if(done)showLearningCard(done)
};
$('#nextCoachBtn').onclick=startCoach;

const scanner=new SudokuScanner($('#photoCanvas'),$('#rectifiedCanvas'));const cornerEls=$$('.corner');
function placeCorners(){const r=$('#photoCanvas').getBoundingClientRect(),sx=r.width/$('#photoCanvas').width,sy=r.height/$('#photoCanvas').height;cornerEls.forEach((e,i)=>{e.style.left=scanner.corners[i][0]*sx+'px';e.style.top=scanner.corners[i][1]*sy+'px'})}
function setupDrag(){cornerEls.forEach((el,i)=>{let drag=false;el.onpointerdown=e=>{drag=true;el.setPointerCapture?.(e.pointerId)};el.onpointermove=e=>{if(!drag)return;const r=$('#photoCanvas').getBoundingClientRect(),sx=$('#photoCanvas').width/r.width,sy=$('#photoCanvas').height/r.height;scanner.corners[i]=[(e.clientX-r.left)*sx,(e.clientY-r.top)*sy];placeCorners()};el.onpointerup=()=>drag=false;el.onpointercancel=()=>drag=false})}
setupDrag();window.addEventListener('resize',()=>scanner.image&&placeCorners());
$('#pickPhoto').onclick=()=>$('#photoInput').click();
$('#photoInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;const res=await scanner.load(f);$('#cropCard').classList.remove('hidden');$('#gridStatus').textContent=res.ok?'已找到候选棋盘。请先确认四个蓝点是否准确，再继续。':'自动定位置信度不足。请手工把四个蓝点拖到棋盘外框。';requestAnimationFrame(placeCorners)};
$('#autoGridBtn').onclick=()=>{const r=scanner.autoDetect();$('#gridStatus').textContent=r.ok?'已重新找到棋盘候选，请确认。':'仍未可靠找到，请手工调整。';placeCorners()};
$('#rotateBtn').onclick=()=>{const r=scanner.rotate();$('#gridStatus').textContent=r.ok?'旋转后已重新定位，请确认。':'旋转完成，请手工调整。';requestAnimationFrame(placeCorners)};
$('#confirmGridBtn').onclick=()=>{scanner.rectify();$('#rectifiedCard').classList.remove('hidden');$('#rectifiedCard').scrollIntoView({behavior:'smooth'})};
$('#backCropBtn').onclick=()=>$('#cropCard').scrollIntoView({behavior:'smooth'});
$('#ocrBtn').onclick=async()=>{const rc=$('#reviewCard');rc.classList.remove('hidden');$('#ocrStatus').textContent='开始OCR…';const res=await scanner.recognize((p,s)=>{$('#ocrBar').style.width=Math.round(p*100)+'%';$('#ocrStatus').textContent=s});window._ocr=res;renderReview(res);$('#ocrStatus').textContent=`检测到 ${res.mainCount} 个主数字格，请人工快速复核。`;rc.scrollIntoView({behavior:'smooth'})};
function conflicts(vals){const bad=new Set();for(let r=0;r<9;r++)for(const n of ALL){const p=[];for(let c=0;c<9;c++)if(vals[r*9+c]===n)p.push(r*9+c);if(p.length>1)p.forEach(i=>bad.add(i))}for(let c=0;c<9;c++)for(const n of ALL){const p=[];for(let r=0;r<9;r++)if(vals[r*9+c]===n)p.push(r*9+c);if(p.length>1)p.forEach(i=>bad.add(i))}return bad}
function renderReview(res){const g=$('#reviewGrid');g.innerHTML='';const bad=conflicts(res.values);for(let i=0;i<81;i++){const b=document.createElement('button');b.className='review-cell'+(res.values[i]&&res.conf[i]<55?' low':'')+(bad.has(i)?' conflict':'');b.textContent=res.values[i]||'';b.onclick=()=>{const v=prompt(`${name(i)}：输入1-9；留空=空格`,res.values[i]||'');if(v===null)return;res.values[i]=/^[1-9]$/.test(v)?+v:0;res.conf[i]=100;renderReview(res)};g.appendChild(b)}}
$('#importBtn').onclick=()=>{const r=window._ocr;if(!r)return;if(conflicts(r.values).size){alert('仍有冲突，请先修正红色格。');return}
 board.load(r.values);resetSession();const item=library.create(board,{source:'scan',title:'扫描题目'});activePuzzleId=item.id;
 renderBoard();renderLibrary();$$('.tab').find(x=>x.dataset.page==='solve').click()
};

let trainType='w',trainStep=0,trainPicked=new Set();
function renderTrain(){const t=TRAINING[trainType],st=t.stages[trainStep];$('#trainStage').innerHTML=`<b>${t.title} · ${st.title}</b>${st.text}<br><span class="muted">当前要点：${trainStep===0?'先识别结构，不急着删除候选。':trainStep===1?'确认连接关系。':'最后才判断删除目标。'}</span>`;const g=$('#trainBoard');g.innerHTML='';for(let i=0;i<81;i++){const b=document.createElement('button');b.className='mini-cell';const c=t.cells[i]||[];b.innerHTML='<span class="mini-cands">'+ALL.map(n=>`<span class="n">${c.includes(n)?n:''}</span>`).join('')+'</span>';if(trainPicked.has(i))b.classList.add('target');b.onclick=()=>pickTrain(i);g.appendChild(b)}}
function pickTrain(i){const exp=TRAINING[trainType].stages[trainStep].expect;if(trainPicked.has(i))trainPicked.delete(i);else trainPicked.add(i);const chosen=[...trainPicked].sort((a,b)=>a-b),target=[...exp].sort((a,b)=>a-b);if(chosen.length===target.length){if(chosen.every((x,k)=>x===target[k])){trainStep++;trainPicked.clear();if(trainStep>=TRAINING[trainType].stages.length){$('#trainStage').innerHTML=`<b>${TRAINING[trainType].title} 完成</b>你已经按“结构 → 连接 → 删除”的顺序走完一遍。`;trainStep=0;setTimeout(renderTrain,1300)}else renderTrain()}else{$('#trainStage').innerHTML='<b>还不对</b>先确认当前步骤要求的是哪一种角色，不要直接找删除数。'}}renderTrain()}
$$('[data-train]').forEach(b=>b.onclick=()=>{$$('[data-train]').forEach(x=>x.classList.remove('active'));b.classList.add('active');trainType=b.dataset.train;trainStep=0;trainPicked.clear();renderTrain()});
$('#trainHint').onclick=()=>{$('#trainStage').innerHTML+=`<br><b>提示：</b>${TRAINING[trainType].stages[trainStep].hint}`};
$('#trainReset').onclick=()=>{trainStep=0;trainPicked.clear();renderTrain()};

$$('.tab').forEach(t=>t.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$$('.page').forEach(x=>x.classList.remove('active'));$('#page-'+t.dataset.page).classList.add('active');$('#pageTitle').textContent={solve:'做题',scan:'扫描',library:'题库',train:'专练',settings:'设置'}[t.dataset.page]});
renderBoard();renderTrain();renderLibrary();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

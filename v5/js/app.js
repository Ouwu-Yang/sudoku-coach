
import {SudokuBoard,ALL,name} from './core.js';
import {SudokuSolver} from './solver.js';
import {SudokuScanner} from './scanner.js';
import {TRAINING} from './trainer.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const board=new SudokuBoard();const solver=new SudokuSolver(board);let selected=0,mode='value',currentStep=null;
const boardEl=$('#board');
function renderBoard(){
 boardEl.innerHTML='';
 for(let i=0;i<81;i++){const b=document.createElement('button');b.className='cell'+(board.givens.has(i)?' given':'')+(i===selected?' selected':'');const v=board.values[i];if(v)b.innerHTML=`<span class="value">${v}</span>`;else{const c=board.candidates(i),show=board.notes[i].size?[...board.notes[i]]:c;b.innerHTML='<span class="cands">'+ALL.map(n=>`<span class="cand ${currentStep?.elim?.some(e=>e.i===i&&e.n===n)?'elim':''}">${show.includes(n)?n:''}</span>`).join('')+'</span>'}if(currentStep?.cells?.includes(i))b.classList.add('hint-cell');b.onclick=()=>{selected=i;renderBoard()};boardEl.appendChild(b)}
}
for(const n of ALL){const k=document.createElement('button');k.className='key';k.textContent=n;k.onclick=()=>{if(board.givens.has(selected))return;if(mode==='note')board.toggleNote(selected,n);else board.set(selected,n);currentStep=null;renderBoard()};$('#keypad').appendChild(k)}
$('#valueMode').onclick=()=>{mode='value';$('#valueMode').classList.add('active');$('#noteMode').classList.remove('active')};
$('#noteMode').onclick=()=>{mode='note';$('#noteMode').classList.add('active');$('#valueMode').classList.remove('active')};
$('#eraseBtn').onclick=()=>{board.erase(selected);currentStep=null;renderBoard()};
$('#undoBtn').onclick=()=>{board.undo();currentStep=null;renderBoard()};
$('#sampleBtn').onclick=()=>{board.load('380000000067080053509300008978001346050763009603008570795632000842000635136800297');currentStep=null;renderBoard()};
$('#clearBtn').onclick=()=>{board.load('0'.repeat(81));renderBoard()};
$('#checkBtn').onclick=()=>{const v=board.validate();alert(v.ok?'当前盘面没有直接冲突。':`发现 ${v.conflicts.length} 个冲突格、${v.dead.length} 个零候选格。`)};
$('#exportBtn').onclick=()=>prompt('81位题目字符串',board.string());

$$('[data-hint]').forEach(btn=>btn.onclick=()=>{currentStep=solver.find();const lv=+btn.dataset.hint;if(!currentStep){$('#hintBox').textContent=board.values.every(Boolean)?'题目已完成。':'当前未找到可推进步骤。';renderBoard();return}renderBoard();const s=currentStep,pos=(s.cells||[]).map(name).join('、'),del=(s.elim||[]).map(e=>`${name(e.i)} 的 ${e.n}`).join('、');$('#hintBox').innerHTML=lv===1?`<b>${s.tech}</b><br>${s.short}`:lv===2?`<b>${s.tech}</b><br>关键位置：${pos}${s.fill?'<br>可确定：'+name(s.fill.i)+'='+s.fill.n:''}${del?'<br>可删除：'+del:''}`:`<b>${s.tech}</b><br>${s.text}`});
$('#applyHint').onclick=()=>{const s=currentStep||solver.find();if(!s)return;board.apply(s);currentStep=null;renderBoard();$('#hintBox').innerHTML=`<b>已执行：${s.tech}</b>`};

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
$('#importBtn').onclick=()=>{const r=window._ocr;if(!r)return;if(conflicts(r.values).size){alert('仍有冲突，请先修正红色格。');return}board.load(r.values);renderBoard();$$('.tab').find(x=>x.dataset.page==='solve').click()};

let trainType='w',trainStep=0,trainPicked=new Set();
function renderTrain(){const t=TRAINING[trainType],st=t.stages[trainStep];$('#trainStage').innerHTML=`<b>${t.title} · ${st.title}</b>${st.text}<br><span class="muted">当前要点：${trainStep===0?'先识别结构，不急着删除候选。':trainStep===1?'确认连接关系。':'最后才判断删除目标。'}</span>`;const g=$('#trainBoard');g.innerHTML='';for(let i=0;i<81;i++){const b=document.createElement('button');b.className='mini-cell';const c=t.cells[i]||[];b.innerHTML='<span class="mini-cands">'+ALL.map(n=>`<span class="n">${c.includes(n)?n:''}</span>`).join('')+'</span>';if(trainPicked.has(i))b.classList.add('target');b.onclick=()=>pickTrain(i);g.appendChild(b)}}
function pickTrain(i){const exp=TRAINING[trainType].stages[trainStep].expect;if(trainPicked.has(i))trainPicked.delete(i);else trainPicked.add(i);const chosen=[...trainPicked].sort((a,b)=>a-b),target=[...exp].sort((a,b)=>a-b);if(chosen.length===target.length){if(chosen.every((x,k)=>x===target[k])){trainStep++;trainPicked.clear();if(trainStep>=TRAINING[trainType].stages.length){$('#trainStage').innerHTML=`<b>${TRAINING[trainType].title} 完成</b>你已经按“结构 → 连接 → 删除”的顺序走完一遍。`;trainStep=0;setTimeout(renderTrain,1300)}else renderTrain()}else{$('#trainStage').innerHTML='<b>还不对</b>先确认当前步骤要求的是哪一种角色，不要直接找删除数。'}}renderTrain()}
$$('[data-train]').forEach(b=>b.onclick=()=>{$$('[data-train]').forEach(x=>x.classList.remove('active'));b.classList.add('active');trainType=b.dataset.train;trainStep=0;trainPicked.clear();renderTrain()});
$('#trainHint').onclick=()=>{$('#trainStage').innerHTML+=`<br><b>提示：</b>${TRAINING[trainType].stages[trainStep].hint}`};
$('#trainReset').onclick=()=>{trainStep=0;trainPicked.clear();renderTrain()};

$$('.tab').forEach(t=>t.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$$('.page').forEach(x=>x.classList.remove('active'));$('#page-'+t.dataset.page).classList.add('active');$('#pageTitle').textContent={solve:'做题',scan:'扫描',hint:'提示',train:'专练',settings:'设置'}[t.dataset.page]});
renderBoard();renderTrain();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

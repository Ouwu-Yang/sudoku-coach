
import {ALL,idx,rc,name,peers} from './core.js';
const comb=(arr,k)=>{const out=[];const f=(s,c)=>{if(c.length===k){out.push([...c]);return}for(let i=s;i<arr.length;i++){c.push(arr[i]);f(i+1,c);c.pop()}};f(0,[]);return out};
const sees=(a,b)=>peers(a).has(b);
const rows=()=>Array.from({length:9},(_,r)=>ALL.map((_,c)=>idx(r,c)));
const cols=()=>Array.from({length:9},(_,c)=>ALL.map((_,r)=>idx(r,c)));
const boxes=()=>{const o=[];for(let br=0;br<3;br++)for(let bc=0;bc<3;bc++){const a=[];for(let r=br*3;r<br*3+3;r++)for(let c=bc*3;c<bc*3+3;c++)a.push(idx(r,c));o.push(a)}return o};
const units=()=>[...rows().map((cells,i)=>({type:'行',no:i+1,cells})),...cols().map((cells,i)=>({type:'列',no:i+1,cells})),...boxes().map((cells,i)=>({type:'宫',no:i+1,cells}))];
const fill=(tech,i,n,short,text,cells=[i])=>({tech,cells,fill:{i,n},elim:[],short,text});
const elim=(tech,cells,elims,short,text)=>({tech,cells,elim:elims,short,text});

export class SudokuSolver{
 constructor(board){this.b=board}
 C(){return Array.from({length:81},(_,i)=>new Set(this.b.candidates(i)))}
 strongLinks(n,C){const out=[],seen=new Set();for(const u of units()){const p=u.cells.filter(i=>!this.b.values[i]&&C[i].has(n));if(p.length===2){let[a,b]=p;if(a>b)[a,b]=[b,a];const k=a+'-'+b;if(!seen.has(k)){seen.add(k);out.push([a,b])}}}return out}
 exactPossible(forceI=-1,forceN=0){
  const vals=[...this.b.values],removed=this.b.removed.map(s=>new Set(s));
  if(forceI>=0){if(vals[forceI]&&vals[forceI]!==forceN)return false;vals[forceI]=forceN}
  const rU=Array.from({length:9},()=>new Set()),cU=Array.from({length:9},()=>new Set()),bU=Array.from({length:9},()=>new Set());
  for(let i=0;i<81;i++)if(vals[i]){const[r,c]=rc(i),bb=Math.floor(r/3)*3+Math.floor(c/3),v=vals[i];if(rU[r].has(v)||cU[c].has(v)||bU[bb].has(v))return false;rU[r].add(v);cU[c].add(v);bU[bb].add(v)}
  const rec=()=>{let bi=-1,bo=null;for(let i=0;i<81;i++)if(!vals[i]){const[r,c]=rc(i),bb=Math.floor(r/3)*3+Math.floor(c/3),o=ALL.filter(n=>!rU[r].has(n)&&!cU[c].has(n)&&!bU[bb].has(n)&&!removed[i].has(n));if(!o.length)return false;if(bo===null||o.length<bo.length){bi=i;bo=o;if(o.length===1)break}}if(bi<0)return true;const[r,c]=rc(bi),bb=Math.floor(r/3)*3+Math.floor(c/3);for(const n of bo){vals[bi]=n;rU[r].add(n);cU[c].add(n);bU[bb].add(n);if(rec())return true;vals[bi]=0;rU[r].delete(n);cU[c].delete(n);bU[bb].delete(n)}return false};return rec()
 }
 validateStep(s){if(!s)return null;if(s.fill)return this.exactPossible(s.fill.i,s.fill.n)?s:null;if(s.elim?.length){s.elim=s.elim.filter(e=>!this.exactPossible(e.i,e.n));return s.elim.length?s:null}return s}
 findPattern(){
  const C=this.C();if(!this.b.validate().ok)return{tech:'盘面冲突',cells:[],elim:[],short:'先修正盘面冲突。',text:'当前存在重复数字或零候选空格。'};
  for(let i=0;i<81;i++)if(!this.b.values[i]&&C[i].size===1){const n=[...C[i]][0];return fill('裸单',i,n,'找候选只剩1个的格。',`${name(i)} 只剩候选 ${n}。`)}
  for(const u of units())for(const n of ALL){const p=u.cells.filter(i=>!this.b.values[i]&&C[i].has(n));if(p.length===1)return fill('隐藏单数',p[0],n,`检查${u.type}${u.no}中数字 ${n}。`,`${u.type}${u.no} 的 ${n} 只有 ${name(p[0])} 可以放。`)}
  const bs=boxes(),rs=rows(),cs=cols();
  for(let b=0;b<9;b++)for(const n of ALL){const p=bs[b].filter(i=>!this.b.values[i]&&C[i].has(n));if(p.length>=2){const rr=[...new Set(p.map(i=>rc(i)[0]))],cc=[...new Set(p.map(i=>rc(i)[1]))];if(rr.length===1){const r=rr[0],e=rs[r].filter(i=>!bs[b].includes(i)&&!this.b.values[i]&&C[i].has(n)).map(i=>({i,n}));if(e.length)return elim('锁定候选（指向）',p,e,`第${b+1}宫的 ${n} 被锁在第${r+1}行。`,`第${r+1}行宫外的 ${n} 可以删除。`)}if(cc.length===1){const c=cc[0],e=cs[c].filter(i=>!bs[b].includes(i)&&!this.b.values[i]&&C[i].has(n)).map(i=>({i,n}));if(e.length)return elim('锁定候选（指向）',p,e,`第${b+1}宫的 ${n} 被锁在第${c+1}列。`,`第${c+1}列宫外的 ${n} 可以删除。`)}}}
  for(const u of units()){const cells=u.cells.filter(i=>!this.b.values[i]&&C[i].size>=2&&C[i].size<=4);for(const k of [2,3,4])for(const g of comb(cells,k)){const un=new Set(g.flatMap(i=>[...C[i]]));if(un.size===k){const e=[];for(const j of u.cells)if(!g.includes(j)&&!this.b.values[j])for(const n of un)if(C[j].has(n))e.push({i:j,n});if(e.length)return elim(k===2?'裸对':k===3?'裸三数组':'裸四数组',g,e,`${u.type}${u.no} 中出现 ${k} 格/${k}数结构。`,`这些候选被锁定在 ${g.map(name).join('、')}，同单位其他格可删除。`)}}}
  const biv=[...Array(81).keys()].filter(i=>!this.b.values[i]&&C[i].size===2);
  for(const p of biv){const ws=biv.filter(i=>i!==p&&sees(p,i));for(const a of ws)for(const b of ws)if(a<b&&!sees(a,b)){const ca=[...C[a]].filter(n=>C[p].has(n)),cb=[...C[b]].filter(n=>C[p].has(n));if(ca.length!==1||cb.length!==1||ca[0]===cb[0])continue;const za=[...C[a]].find(n=>!C[p].has(n)),zb=[...C[b]].find(n=>!C[p].has(n));if(za&&za===zb){const e=[...Array(81).keys()].filter(i=>!this.b.values[i]&&![p,a,b].includes(i)&&C[i].has(za)&&sees(i,a)&&sees(i,b)).map(i=>({i,n:za}));if(e.length)return elim('XY-Wing',[p,a,b],e,`${name(p)} 是枢轴，寻找两个翼。`,`两翼共同包含 ${za}，同时看见两翼的位置可删除 ${za}。`)}}}
  const same=(a,b)=>a.size===b.size&&[...a].every(x=>b.has(x));
  for(const[a,b]of comb(biv,2)){if(!same(C[a],C[b]))continue;for(const bridge of C[a]){const other=[...C[a]].find(n=>n!==bridge);for(const[u,v]of this.strongLinks(bridge,C)){if((sees(a,u)&&sees(b,v))||(sees(a,v)&&sees(b,u))){const e=[...Array(81).keys()].filter(i=>!this.b.values[i]&&![a,b].includes(i)&&C[i].has(other)&&sees(i,a)&&sees(i,b)).map(i=>({i,n:other}));if(e.length)return elim('W-Wing',[a,b,u,v],e,`先找两个相同双候选格，再找候选 ${bridge} 的强链。`,`强链把两翼连接起来，因此同时看见两翼的位置可删除 ${other}。`)}}}}
  // X-Wing
  for(const n of ALL){const rr=[...Array(9).keys()].filter(r=>rs[r].filter(i=>!this.b.values[i]&&C[i].has(n)).length===2);for(const [r1,r2] of comb(rr,2)){const a=rs[r1].filter(i=>!this.b.values[i]&&C[i].has(n)).map(i=>rc(i)[1]),b=rs[r2].filter(i=>!this.b.values[i]&&C[i].has(n)).map(i=>rc(i)[1]);if(a[0]===b[0]&&a[1]===b[1]){const e=[];for(let r=0;r<9;r++)if(r!==r1&&r!==r2)for(const c of a){const i=idx(r,c);if(!this.b.values[i]&&C[i].has(n))e.push({i,n})}if(e.length)return elim('X-Wing',[idx(r1,a[0]),idx(r1,a[1]),idx(r2,a[0]),idx(r2,a[1])],e,`数字 ${n} 在两行中被限制到同两列。`,`形成 X-Wing，其他行这两列中的 ${n} 可以删除。`)}}}
  return null
 }
 forcing(){const cells=[...Array(81).keys()].filter(i=>!this.b.values[i]&&this.b.candidates(i).length>=2).sort((a,b)=>this.b.candidates(a).length-this.b.candidates(b).length);for(const i of cells.slice(0,24)){const cs=this.b.candidates(i),bad=[];for(const n of cs)if(!this.exactPossible(i,n))bad.push(n);if(bad.length===cs.length-1){const good=cs.find(n=>!bad.includes(n));return fill('矛盾链',i,good,`对 ${name(i)} 的候选逐一验证。`,`其余候选都会导致盘面无解，所以 ${name(i)}=${good}。`)}if(bad.length)return elim('矛盾链',[i],[{i,n:bad[0]}],`假设 ${name(i)}=${bad[0]} 并向后验证。`,`该假设会导致盘面无解，因此删除 ${bad[0]}。`)}return null}
 find(){const p=this.findPattern();const v=this.validateStep(p);return v||this.forcing()}
}

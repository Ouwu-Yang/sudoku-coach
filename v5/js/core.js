
export const ALL=[1,2,3,4,5,6,7,8,9];
export const idx=(r,c)=>r*9+c;
export const rc=i=>[Math.floor(i/9),i%9];
export const name=i=>`R${Math.floor(i/9)+1}C${i%9+1}`;
export function peers(i){
  const [r,c]=rc(i),s=new Set();
  for(let k=0;k<9;k++){s.add(idx(r,k));s.add(idx(k,c))}
  const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
  for(let rr=br;rr<br+3;rr++)for(let cc=bc;cc<bc+3;cc++)s.add(idx(rr,cc));
  s.delete(i);return s
}
export class SudokuBoard{
  constructor(){this.values=Array(81).fill(0);this.givens=new Set();this.notes=Array.from({length:81},()=>new Set());this.removed=Array.from({length:81},()=>new Set());this.history=[]}
  load(s){const vals=Array.isArray(s)?s:[...s.replace(/0/g,'.')].map(ch=>ch==='.'?0:+ch);this.values=[...vals];this.givens=new Set(vals.map((v,i)=>v?i:-1).filter(i=>i>=0));this.notes=Array.from({length:81},()=>new Set());this.removed=Array.from({length:81},()=>new Set());this.history=[]}
  snapshot(){this.history.push({values:[...this.values],givens:[...this.givens],notes:this.notes.map(s=>[...s]),removed:this.removed.map(s=>[...s])});if(this.history.length>80)this.history.shift()}
  undo(){const x=this.history.pop();if(!x)return false;this.values=[...x.values];this.givens=new Set(x.givens);this.notes=x.notes.map(a=>new Set(a));this.removed=x.removed.map(a=>new Set(a));return true}
  candidates(i){if(this.values[i])return[];const used=new Set([...peers(i)].map(j=>this.values[j]).filter(Boolean));return ALL.filter(n=>!used.has(n)&&!this.removed[i].has(n))}
  conflict(i){const v=this.values[i];return !!v&&[...peers(i)].some(j=>this.values[j]===v)}
  set(i,n,asGiven=false){this.snapshot();this.values[i]=n;this.notes[i].clear();this.removed=Array.from({length:81},()=>new Set());if(asGiven)this.givens.add(i)}
  erase(i){if(this.givens.has(i))return;this.snapshot();this.values[i]=0;this.notes[i].clear();this.removed=Array.from({length:81},()=>new Set())}
  toggleNote(i,n){if(this.values[i])return;this.snapshot();this.notes[i].has(n)?this.notes[i].delete(n):this.notes[i].add(n)}
  apply(step){this.snapshot();if(step.fill){this.values[step.fill.i]=step.fill.n;this.notes[step.fill.i].clear();this.removed[step.fill.i].clear()}for(const e of step.elim||[])if(!this.values[e.i])this.removed[e.i].add(e.n)}
  validate(){const conflicts=this.values.map((v,i)=>v&&this.conflict(i)?i:-1).filter(i=>i>=0);const dead=this.values.map((v,i)=>!v&&this.candidates(i).length===0?i:-1).filter(i=>i>=0);return{ok:!conflicts.length&&!dead.length,conflicts,dead}}
  string(){return this.values.map(v=>v||0).join('')}
}

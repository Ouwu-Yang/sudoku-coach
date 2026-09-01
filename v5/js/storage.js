
const KEY='sudoku-coach-v5-library';
const MAX_ITEMS=30;
const iso=()=>new Date().toISOString();
const uid=()=>crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class PuzzleLibrary{
  constructor(){this.items=this._read()}
  _read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  _write(){this.items.sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));this.items=this.items.slice(0,MAX_ITEMS);localStorage.setItem(KEY,JSON.stringify(this.items))}
  list(){return [...this.items].sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''))}
  get(id){return this.items.find(x=>x.id===id)||null}
  state(board){return{values:[...board.values],givens:[...board.givens],notes:board.notes.map(s=>[...s]),removed:board.removed.map(s=>[...s])}}
  create(board,{source='scan',title='扫描题目'}={}){
    const original=[...board.values],signature=original.join('');
    let item=this.items.find(x=>x.signature===signature);
    if(item){item.current=this.state(board);item.updatedAt=iso();this._write();return item}
    item={id:uid(),signature,title,source,createdAt:iso(),updatedAt:iso(),original,current:this.state(board),completed:false,lastTechnique:null,attempts:[]};
    this.items.unshift(item);this._write();return item
  }
  save(id,board,{lastTechnique=null}={}){
    const item=this.get(id);if(!item)return;
    item.current=this.state(board);item.updatedAt=iso();
    item.completed=board.values.every(Boolean)&&board.validate().ok;
    if(lastTechnique)item.lastTechnique=lastTechnique;
    this._write()
  }
  addAttempt(id,data){
    const item=this.get(id);if(!item)return;
    item.attempts.push({at:iso(),...data});item.updatedAt=iso();this._write()
  }
  restore(id,board,{fresh=false}={}){
    const item=this.get(id);if(!item)return false;
    const s=fresh?{values:[...item.original],givens:item.original.map((v,i)=>v?i:-1).filter(i=>i>=0),notes:Array.from({length:81},()=>[]),removed:Array.from({length:81},()=>[])}:item.current;
    board.values=[...s.values];board.givens=new Set(s.givens);
    board.notes=(s.notes||Array.from({length:81},()=>[])).map(a=>new Set(a));
    board.removed=(s.removed||Array.from({length:81},()=>[])).map(a=>new Set(a));
    board.history=[];item.updatedAt=iso();this._write();return true
  }
  remove(id){this.items=this.items.filter(x=>x.id!==id);this._write()}
}

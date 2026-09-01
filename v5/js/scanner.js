
export class SudokuScanner{
 constructor(photoCanvas,rectCanvas){this.photoCanvas=photoCanvas;this.ctx=photoCanvas.getContext('2d',{willReadFrequently:true});this.rectCanvas=rectCanvas;this.image=null;this.rotation=0;this.corners=[]}
 async load(file){const img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=URL.createObjectURL(file)});this.image=img;this.rotation=0;this.draw();return this.autoDetect()}
 draw(){const img=this.image;if(!img)return;const rot=this.rotation%180===0,[rw,rh]=rot?[img.naturalWidth,img.naturalHeight]:[img.naturalHeight,img.naturalWidth];const sc=Math.min(1,1200/rw);this.photoCanvas.width=Math.round(rw*sc);this.photoCanvas.height=Math.round(rh*sc);const c=this.ctx;c.save();c.clearRect(0,0,this.photoCanvas.width,this.photoCanvas.height);c.scale(sc,sc);if(this.rotation===0)c.drawImage(img,0,0);else if(this.rotation===90){c.translate(rw,0);c.rotate(Math.PI/2);c.drawImage(img,0,0)}else if(this.rotation===180){c.translate(rw,rh);c.rotate(Math.PI);c.drawImage(img,0,0)}else{c.translate(0,rh);c.rotate(-Math.PI/2);c.drawImage(img,0,0)}c.restore();if(!this.corners.length)this.defaultCorners()}
 defaultCorners(){const w=this.photoCanvas.width,h=this.photoCanvas.height,m=Math.min(w,h)*.08;this.corners=[[m,m],[w-m,m],[w-m,h-m],[m,h-m]]}
 rotate(){this.rotation=(this.rotation+90)%360;this.corners=[];this.draw();return this.autoDetect()}
 _cluster(v){const a=[];for(const x of v){if(!a.length||x>a.at(-1).at(-1)+2)a.push([x]);else a.at(-1).push(x)}return a.map(g=>Math.round(g.reduce((s,x)=>s+x,0)/g.length))}
 _quad(lines,dim){if(lines.length<4)return null;let best=null,score=99;for(let a=0;a<lines.length-3;a++)for(let b=a+1;b<lines.length-2;b++)for(let c=b+1;c<lines.length-1;c++)for(let d=c+1;d<lines.length;d++){const q=[lines[a],lines[b],lines[c],lines[d]],g=[q[1]-q[0],q[2]-q[1],q[3]-q[2]],m=g.reduce((s,x)=>s+x,0)/3;if(m<dim*.05)continue;const sd=Math.sqrt(g.reduce((s,x)=>s+(x-m)**2,0)/3),s=sd/(m+1e-6);if(s<score){score=s;best=q}}return score<.16?best:null}
 autoDetect(){
  const W=this.photoCanvas.width,H=this.photoCanvas.height,d=this.ctx.getImageData(0,0,W,H).data,gray=new Uint8Array(W*H);
  for(let p=0,k=0;p<gray.length;p++,k+=4)gray[p]=.299*d[k]+.587*d[k+1]+.114*d[k+2];
  const hs=[],vs=[];
  for(let y=1;y<H-1;y++){let edge=0;for(let x=0;x<W;x++)edge+=Math.abs(gray[(y+1)*W+x]-gray[(y-1)*W+x]);if(edge/W>24)hs.push(y)}
  for(let x=1;x<W-1;x++){let edge=0;for(let y=0;y<H;y++)edge+=Math.abs(gray[y*W+x+1]-gray[y*W+x-1]);if(edge/H>24)vs.push(x)}
  const hy=this._quad(this._cluster(hs),H),vx=this._quad(this._cluster(vs),W);
  if(hy&&vx){const ratio=(hy[3]-hy[0])/(vx[3]-vx[0]);if(ratio>.75&&ratio<1.28){this.corners=[[vx[0],hy[0]],[vx[3],hy[0]],[vx[3],hy[3]],[vx[0],hy[3]]];return{ok:true,confidence:'medium'}}}
  this.defaultCorners();return{ok:false,confidence:'low'}
 }
 _solve(A,b){const n=8,M=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];const q=M[c][c];if(Math.abs(q)<1e-10)throw Error('四角无效');for(let j=c;j<=n;j++)M[c][j]/=q;for(let r=0;r<n;r++)if(r!==c){const f=M[r][c];for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j]}}return M.map(r=>r[n])}
 _H(dst,src){const A=[],b=[];for(let k=0;k<4;k++){const[x,y]=dst[k],[u,v]=src[k];A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}return[...this._solve(A,b),1]}
 rectify(size=720){
  const out=this.rectCanvas;out.width=out.height=size;const oc=out.getContext('2d',{willReadFrequently:true}),src=this.ctx.getImageData(0,0,this.photoCanvas.width,this.photoCanvas.height),dst=oc.createImageData(size,size),H=this._H([[0,0],[size-1,0],[size-1,size-1],[0,size-1]],this.corners);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const den=H[6]*x+H[7]*y+1,u=(H[0]*x+H[1]*y+H[2])/den,v=(H[3]*x+H[4]*y+H[5])/den,xi=Math.round(u),yi=Math.round(v),di=(y*size+x)*4;if(xi>=0&&xi<src.width&&yi>=0&&yi<src.height){const si=(yi*src.width+xi)*4;dst.data[di]=src.data[si];dst.data[di+1]=src.data[si+1];dst.data[di+2]=src.data[si+2];dst.data[di+3]=255}else{dst.data[di]=dst.data[di+1]=dst.data[di+2]=255;dst.data[di+3]=255}}
  oc.putImageData(dst,0,0);return out
 }
 analyzeCell(r,c){
  const board=this.rectCanvas,S=board.width,cell=S/9,pad=cell*.12,N=100,cv=document.createElement('canvas');cv.width=cv.height=N;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(board,c*cell+pad,r*cell+pad,cell-2*pad,cell-2*pad,0,0,N,N);const im=cx.getImageData(0,0,N,N),d=im.data;let mean=0;for(let k=0;k<d.length;k+=4)mean+=.299*d[k]+.587*d[k+1]+.114*d[k+2];mean/=N*N;const bin=new Uint8Array(N*N);for(let p=0,k=0;p<bin.length;p++,k+=4){const g=.299*d[k]+.587*d[k+1]+.114*d[k+2];bin[p]=g<mean-35?1:0}
  let seen=new Uint8Array(N*N),best=null;for(let y=2;y<N-2;y++)for(let x=2;x<N-2;x++){let st=y*N+x;if(!bin[st]||seen[st])continue;let q=[st],pix=[],minx=x,maxx=x,miny=y,maxy=y;seen[st]=1;while(q.length){const z=q.pop(),yy=Math.floor(z/N),xx=z-yy*N;pix.push(z);minx=Math.min(minx,xx);maxx=Math.max(maxx,xx);miny=Math.min(miny,yy);maxy=Math.max(maxy,yy);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=xx+dx,ny=yy+dy,ni=ny*N+nx;if(nx>1&&nx<N-2&&ny>1&&ny<N-2&&bin[ni]&&!seen[ni]){seen[ni]=1;q.push(ni)}}}const bw=maxx-minx+1,bh=maxy-miny+1,area=pix.length,cx0=(minx+maxx)/2,cy0=(miny+maxy)/2;if(bh>N*.34&&bh<N*.84&&bw>N*.05&&bw<N*.65&&area>N*N*.009&&cx0>N*.18&&cx0<N*.82&&cy0>N*.14&&cy0<N*.86){const score=bh+area/80;if(!best||score>best.score)best={pix,minx,maxx,miny,maxy,bw,bh,score}}}
  if(!best)return null;const out=document.createElement('canvas');out.width=out.height=100;const ox=out.getContext('2d');ox.fillStyle='#fff';ox.fillRect(0,0,100,100);const tmp=document.createElement('canvas');tmp.width=best.bw;tmp.height=best.bh;const tx=tmp.getContext('2d');tx.fillStyle='#fff';tx.fillRect(0,0,tmp.width,tmp.height);tx.fillStyle='#000';for(const z of best.pix){const yy=Math.floor(z/N),xx=z-yy*N;tx.fillRect(xx-best.minx,yy-best.miny,1,1)}const sc=Math.min(62/tmp.width,62/tmp.height),dw=tmp.width*sc,dh=tmp.height*sc;ox.drawImage(tmp,0,0,tmp.width,tmp.height,(100-dw)/2,(100-dh)/2,dw,dh);return out
 }
 async ensureOCR(){if(window.Tesseract)return;await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
 async recognize(progress=()=>{}){
  const items=[];for(let r=0;r<9;r++)for(let c=0;c<9;c++){const cv=this.analyzeCell(r,c);if(cv)items.push({i:r*9+c,cv})}
  const values=Array(81).fill(0),conf=Array(81).fill(0);if(!items.length)return{values,conf,mainCount:0};
  await this.ensureOCR();const worker=await Tesseract.createWorker('eng');for(let k=0;k<items.length;k++){const reads=[];for(const psm of ['10','8','13']){await worker.setParameters({tessedit_char_whitelist:'123456789',tessedit_pageseg_mode:psm});const{data}=await worker.recognize(items[k].cv),t=(data.text||'').replace(/[^1-9]/g,'');if(t)reads.push({n:+t[0],c:data.confidence||0})}if(reads.length){const sc={};for(const x of reads)sc[x.n]=(sc[x.n]||0)+1+x.c/200;const n=Object.keys(sc).map(Number).sort((a,b)=>sc[b]-sc[a])[0];values[items[k].i]=n;conf[items[k].i]=Math.min(100,Math.round(sc[n]*30))}progress((k+1)/items.length,`识别 ${k+1}/${items.length}`)}await worker.terminate();return{values,conf,mainCount:items.length}
 }
}

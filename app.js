import {Engine,V,M,material,box,ring,tube} from './engine.js';

const $=s=>document.querySelector(s),TAU=Math.PI*2,FLOOR=4.8,START=.65;
const rooms=[
 {name:'栖木书房',english:'THE STUDY',angle:-2.2,color:'#896347',description:'木头、书页和暖光。留一把椅子，给那些想慢慢说的话。',theme:'study'},
 {name:'留光展厅',english:'THE GALLERY',angle:2.55,color:'#d2c5a6',description:'把走过的地方，和偶然遇见的光，安静地挂在墙上。',theme:'gallery'},
 {name:'深夜实验室',english:'THE LAB',angle:-2.8,color:'#4a5664',description:'灯还亮着。这里装着小作品、实验，以及尚未完成的念头。',theme:'lab'}
];
const canvas=$('#world');let engine;
try{engine=new Engine(canvas)}catch(e){$('#error').hidden=false;$('#error-message').textContent=e.message;throw e}
const mat={stone:material('#c8c5b5'),edge:material('#e5dfca'),rail:material('#807b65'),metal:material('#5b6255'),brass:material('#b39458'),wood:material('#99714d'),darkwood:material('#604c39'),white:material('#eae8df'),black:material('#263432'),leaf:material('#536d4b'),leaf2:material('#748460'),pot:material('#b38868'),soil:material('#443d31'),glow:material('#f6d58d',{emissive:1}),blue:material('#63bfcd',{emissive:1}),pink:material('#ce7fb4',{emissive:1}),ground:material('#d8d7c9')};
const identity=M.identity(),pose=M.pose,mul=M.multiply;
function add(g,m,x=0,y=0,z=0,a=0,parent=identity,action=null){return engine.add(g,m,mul(parent,pose(x,y,z,a)),action)}
function block(w,h,d,m,x,y,z,a=0,parent=identity,action=null){return add(box(w,h,d),m,x,y,z,a,parent,action)}
function world(r,a,y){return[Math.sin(a)*r,y,Math.cos(a)*r]}
function cylinder(r,h,m,x,y,z,parent=identity){return add(ring(0,r,h,0,TAU,20),m,x,y,z,0,parent)}
function line(points,r,m,parent=identity){return engine.add(tube(points,r),m,parent)}
function texture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return{texture:engine.texture(c),canvas:c}}
function textMat(text,bg='#e9e2cd',fg='#4b5144',size=40){const {texture:t}=texture((c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`${size}px "Microsoft YaHei",sans-serif`;c.fillText(text,w/2,h/2)},512,128);return material('#ffffff',{texture:t,emissive:.7})}
function plant(x,y,z,parent=identity,scale=1){cylinder(.25*scale,.42*scale,mat.pot,x,y+.21*scale,z,parent);cylinder(.22*scale,.025,mat.soil,x,y+.43*scale,z,parent);for(let i=0;i<7;i++){const a=i*2.4,r=(.18+(i%3)*.09)*scale,h=(.55+(i%4)*.18)*scale,p=[x+Math.sin(a)*r,y+h,z+Math.cos(a)*r];line([[x,y+.4*scale,z],p],.018*scale,mat.leaf,parent);const leaf=box(.17*scale,.38*scale,.05*scale);add(leaf,i%2?mat.leaf:mat.leaf2,...p,a,parent)}}
function artwork(seed,theme){return texture((c,w,h)=>{const grad=c.createLinearGradient(0,0,0,h);const colors=theme==='lab'?['#172c48','#43516b','#b86693']:theme==='study'?['#e8d9bd','#9fa587','#5f7566']:['#b4c7ce','#f0d4b5','#747f76'];grad.addColorStop(0,colors[0]);grad.addColorStop(.6,colors[1]);grad.addColorStop(1,colors[2]);c.fillStyle=grad;c.fillRect(0,0,w,h);c.fillStyle=theme==='lab'?'#f1a9b9':'#f2e6c8';c.beginPath();c.arc(w*(.28+seed*.09),h*.28,w*.095,0,TAU);c.fill();for(let j=0;j<4;j++){c.beginPath();c.moveTo(0,h);for(let i=0;i<=12;i++){const x=i*w/12,y=h*(.42+j*.11)+Math.sin(i*.8+j*1.2+seed)*h*.07+Math.cos(i*1.6+seed)*h*.025;c.lineTo(x,y)}c.lineTo(w,h);c.closePath();c.fillStyle=(theme==='lab'?['#566181','#3a4668','#233850','#182b40']:['#b6b79c','#8d9f91','#6d887c','#45675e'])[j];c.fill()}c.fillStyle='#fff9';c.font='12px sans-serif';c.fillText(`STUDY ${String(seed+1).padStart(2,'0')} · PLACEHOLDER`,28,h-24)},512,640)}
// A shared atrium: every room exists here before its door opens.
add(ring(0,10.6,.32,0,TAU,120),mat.ground,0,-.3,0);
add(ring(9.9,10.3,.04,0,TAU,120),mat.edge,0,-.115,0);
cylinder(.31,10.65,mat.stone,0,5.25,0);
cylinder(.39,.16,mat.brass,0,10.62,0);
for(let i=0;i<3;i++){
 const y=i*FLOOR;
 add(ring(4.05,7.45,.26),mat.stone,0,y-.13,0);
 add(ring(7.4,7.5,.1),mat.edge,0,y-.06,0);
 // Four slender structural posts instead of an opaque exterior wall.
 for(const a of[-1.2,-.1,1.5,3.7]){const p=world(7.1,a,y+2.2);cylinder(.105,4.4,mat.stone,...p);cylinder(.17,.12,mat.brass,p[0],y+.08,p[2]);}
 // The landing bridge is left open at the staircase connection.
 block(1.2,.18,2.4,mat.stone,...world(3.6,START,y-.09),START);
 const hand=[];
 for(let j=0;j<=64;j++){const a=START+.24+(TAU-.48)*j/64;hand.push(world(4.06,a,y+1.02));if(j%2===0){const p=world(4.06,a,y+.5);cylinder(.025,1,mat.rail,...p)}}
 line(hand,.045,mat.brass);
 for(let j=0;j<84;j++){const a=j*TAU/84,doorAngle=rooms[i].angle,diff=Math.atan2(Math.sin(a-doorAngle),Math.cos(a-doorAngle));if(Math.abs(diff)<.43)continue;const p=world(7.4,a,y+.5);if(j%2===0)cylinder(.028,1,mat.rail,...p);if(j<83){const b=(j+1)*TAU/84;line([world(7.4,a,y+1.02),world(7.4,b,y+1.02)],.037,mat.rail)}}
 plant(...world(6.5,rooms[i].angle+.58,y),identity,.9);
}
// 64 individual radial treads, two complete turns, one landing per revolution.
const steps=64;
for(let i=0;i<steps;i++){const a=START+i*TAU/32,y=(i+1)*FLOOR/32;add(ring(.4,3.1,.13,a,TAU/32+.008,3),i%2?mat.wood:mat.darkwood,0,y-.065,0);const p=world(3.02,a+.06,y+.53);cylinder(.022,1.02,mat.rail,...p)}
const helix=[];for(let i=0;i<=256;i++)helix.push(world(3.04,START+i*TAU/128,1.04+i*FLOOR/128));line(helix,.047,mat.brass);
// An open skylight ring, suspended pendants and a small ground-floor garden.
add(ring(4.05,7.5,.14),mat.edge,0,13.8,0);
for(const a of[-1.2,-.1,1.5,3.7]){const p=world(7.1,a,11.7);cylinder(.105,4.2,mat.stone,...p)}
for(let i=0;i<5;i++){const a=i*2.4,p=world(.9,a,11.8-i*.7);line([[p[0],13.7,p[2]],p],.012,mat.brass);cylinder(.14,.2,mat.glow,...p)}
plant(-1,0,6.2,identity,1.4);plant(-1.6,0,5.7,identity,.8);

const art=[];
function frame(x,y,z,w,h,a,parent,theme,seed){const item=artwork(seed,theme),id=art.length;art.push({canvas:item.canvas,title:['窗边的山','落日以后','沿途的风','远山来信','海边停留','夜航'][seed]||'风景'});const backing=mul(parent,pose(x,y,z,a));engine.add(box(w+.14,h+.14,.12),theme==='gallery'?mat.white:mat.darkwood,backing);engine.add(box(w,h,.025),material('#ffffff',{texture:item.texture,emissive:.65}),mul(backing,pose(0,0,.08)),{type:'art',id});}
rooms.forEach((room,i)=>{
 room.y=i*FLOOR;room.door=0;room.parent=pose(...world(7.28,room.angle,room.y),room.angle);
 const p=room.parent,wall=material(room.theme==='study'?'#9da18b':room.theme==='gallery'?'#e2e0d6':'#303e50'),floor=material(room.theme==='study'?'#887052':room.theme==='gallery'?'#c9c7bd':'#39414b'),doorMat=material(room.color);
 block(6,.2,5.8,floor,0,-.1,2.8,0,p);
 block(.16,3.65,5.8,wall,-3,1.825,2.8,0,p);block(.16,3.65,5.8,wall,3,1.825,2.8,0,p);block(6,3.65,.16,wall,0,1.825,5.65,0,p);
 // Real door opening: two jambs plus a lintel; no wall fills the aperture.
 block(2.12,3.65,.2,wall,-1.94,1.825,0,0,p);block(2.12,3.65,.2,wall,1.94,1.825,0,0,p);block(1.76,.88,.2,wall,0,3.21,0,0,p);
 for(const x of[-.93,.93])block(.12,2.9,.28,mat.brass,x,1.45,-.02,0,p);block(1.98,.12,.28,mat.brass,0,2.86,-.02,0,p);
 // Both a mesh and all of its fittings pivot around the left hinge.
 const doorTransform=(x,y,z)=>()=>mul(p,mul(pose(-.86,0,0,-room.door),pose(x,y,z)));
 engine.add(box(1.72,2.76,.13),doorMat,doorTransform(.86,1.38,0),{type:'door',id:i});
 for(const h of[.8,2.05])engine.add(box(1.35,.88,.045),material(room.theme==='study'?'#795539':room.theme==='gallery'?'#bfb49b':'#3a4657'),doorTransform(.86,h,-.085),{type:'door',id:i});
 engine.add(box(.055,.23,.09),mat.brass,doorTransform(1.51,1.25,-.13),{type:'door',id:i});
 block(1.7,.36,.04,textMat(`${String(i+1).padStart(2,'0')}  ${room.name}`),0,3.22,-.14,0,p);
 block(1.7,.018,.025,room.theme==='lab'?mat.blue:mat.glow,0,.02,-.15,0,p);
 // Interior edge details and a small uplight strip.
 for(const x of[-2.9,2.9])block(.06,.1,5.55,mat.brass,x,.07,2.8,0,p);
 block(5.6,.05,.06,room.theme==='lab'?mat.pink:mat.glow,0,3.4,5.5,0,p);
 if(room.theme==='study'){
  // Plank floor, bookcase, desk, chair, rug, and a standing lamp.
  for(let j=0;j<17;j++)block(.015,.012,5.6,mat.darkwood,-2.8+j*.35,.008,2.8,0,p);
  const rug=material('#b8aa89');block(2.8,.022,2.2,rug,.1,.024,2.8,0,p);
  for(const x of[-2.65,-.9])block(.12,2.6,.46,mat.darkwood,x,1.3,5.28,0,p);
  for(let j=0;j<5;j++){block(1.85,.09,.5,mat.wood,-1.77,.2+j*.56,5.28,0,p);for(let k=0;k<9;k++){const cm=[mat.leaf,mat.brass,mat.white,mat.darkwood][(j+k)%4];block(.11,.3+(k%3)*.07,.28,cm,-2.52+k*.17,.4+j*.56,5.26,0,p)}}
  block(2,.12,.85,mat.wood,.9,.82,4,0,p);for(const x of[.05,1.75])for(const z of[3.7,4.3])block(.08,.76,.08,mat.darkwood,x,.38,z,0,p);
  block(.7,.09,.66,mat.leaf,.85,.47,2.9,0,p);block(.7,.6,.09,mat.leaf,.85,.82,2.6,0,p);for(const x of[.56,1.14])for(const z of[2.66,3.14])block(.045,.42,.045,mat.darkwood,x,.21,z,0,p);
  block(.5,.045,.36,mat.white,.7,.91,4,0,p);cylinder(.08,.17,mat.pot,1.45,.98,3.9,p);
  cylinder(.22,.07,mat.darkwood,2.4,.035,4.9,p);cylinder(.027,1.9,mat.brass,2.4,.95,4.9,p);add(ring(.12,.37,.3,0,TAU,24),mat.glow,2.4,1.98,4.9,0,p);
  frame(-2.88,1.9,2.45,1.25,1.65,Math.PI/2,p,'study',0);plant(2.3,0,1,p,1.1);
 }else if(room.theme==='gallery'){
  for(let j=0;j<7;j++)block(6,.008,.015,mat.white,0,.008,j*.8,0,p);
  frame(-1.4,1.95,5.48,1.45,1.8,Math.PI,p,'gallery',1);frame(1.35,1.95,5.48,1.45,1.8,Math.PI,p,'gallery',2);
  frame(-2.88,1.95,2.5,1.45,1.8,Math.PI/2,p,'gallery',3);frame(2.88,1.95,2.5,1.45,1.8,-Math.PI/2,p,'gallery',4);
  block(1.8,.12,.6,mat.wood,.1,.52,3.2,0,p);for(const x of[-.6,.8])block(.1,.48,.4,mat.black,x,.24,3.2,0,p);
  for(const x of[-1.5,1.5]){block(.05,.06,4.9,mat.black,x,3.4,2.8,0,p);for(const z of[1.3,3,4.7])block(.2,.12,.28,mat.white,x,3.28,z,0,p)}
  plant(2.3,0,4.85,p,1.3);
 }else{
  for(let j=0;j<11;j++){block(5.8,.012,.015,material('#50576a'),0,.008,j*.55,0,p);block(.015,.012,5.6,material('#50576a'),-2.75+j*.55,.008,2.8,0,p)}
  for(const x of[-2.88,2.88])block(.04,2.7,.045,mat.blue,x,1.7,4.9,0,p);
  block(3,.12,1,mat.black,0,.85,4.7,0,p);for(const x of[-1.35,1.35])block(.1,.8,.65,mat.metal,x,.4,4.7,0,p);
  for(const x of[-.8,.8]){block(1.26,.85,.1,mat.black,x,1.49,5.05,0,p);block(1.12,.7,.025,textMat(x<0?'> hello, world':'夜里也有光','#142a3a','#8bdac8',36),x,1.49,4.98,0,p);block(.08,.28,.08,mat.metal,x,1,5.05,0,p)}
  block(.7,.04,.22,mat.metal,0,.94,4.45,0,p);block(.72,.1,.7,mat.black,.1,.5,3.1,0,p);block(.72,.7,.15,mat.black,.1,.95,2.8,0,p);cylinder(.05,.45,mat.metal,.1,.23,3.1,p);
  frame(-2.88,1.95,2.6,1.6,1.9,Math.PI/2,p,'lab',5);
  for(let j=0;j<3;j++){block(.58,.58,.58,material(['#497a82','#a47599','#b8a274'][j]),2.3,.32+j*.58,4.8,j*.2,p)}
  block(2.4,.45,.05,textMat('MAKE SOMETHING.','#303e50','#a3d7d2',36),0,2.8,5.53,Math.PI,p);
 }
 const pin=document.createElement('button');pin.className='door-pin';pin.innerHTML=`<span>0${i+1}</span>${room.name} ↗`;pin.setAttribute('aria-label',`进入${room.name}`);pin.onclick=()=>enter(i);$('#pins').appendChild(pin);room.pin=pin;
});
engine.compile();

// Camera journeys are continuous paths. The doorway is crossed only after opening.
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const camera={eye:[23,16,28],target:[0,5.1,0],fov:.72};
const state={mode:'atrium',room:null,busy:false,angle:.72,height:6,radius:35,yaw:0,pitch:0,depth:2.3,drag:null,pointers:new Map(),token:0,queue:null};
const overview=()=>({eye:world(state.radius,state.angle,state.height+10),target:[0,state.height-.9,0]});
function cameraSet(c){camera.eye=[...c.eye];camera.target=[...c.target];camera.fov=c.fov??camera.fov}
function local(room,x,y,z){return M.transform(room.parent,[x,y,z])}
function status(s){$('#status').textContent=s}
function hud(){document.body.classList.toggle('inside',state.mode==='room');document.body.classList.toggle('travelling',state.busy);$('#back').hidden=state.mode!=='room'&&!state.busy;$('#room-info').hidden=state.mode!=='room';$('#movement-hint').innerHTML=state.mode==='room'?'<span class="drag-icon">↔</span><span>拖动环顾 / 滚轮前后</span>':'<span class="drag-icon">↔</span><span>拖动旋转<span class="hint-divider">/</span>滚轮上下</span>';document.querySelectorAll('[data-room]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.room)===state.room);b.disabled=state.busy||state.mode==='room'});$('#location-number').textContent=state.room===null?'00':`0${state.room+1}`;$('#location-label').textContent=state.room===null?'中庭 / ATRIUM':rooms[state.room].english;}
const ease=t=>t*t*(3-2*t);
let tween=null;
function animate(duration,update,token){return new Promise(resolve=>{tween={start:performance.now(),duration:duration*(reduced?.5:1),update,resolve,token}})}
async function moveTo(next,ms,token){const from={eye:[...camera.eye],target:[...camera.target],fov:camera.fov};return animate(ms,t=>{camera.eye=from.eye.map((v,i)=>v+(next.eye[i]-v)*t);camera.target=from.target.map((v,i)=>v+(next.target[i]-v)*t);camera.fov=from.fov+((next.fov??.72)-from.fov)*t},token)}
async function arc(radius,from,to,y0,y1,ms,token){return animate(ms,t=>{const a=from+(to-from)*t,y=y0+(y1-y0)*t;camera.eye=world(radius,a,y);camera.target=world(radius+1.8,a+.13,y-.18)},token)}
const cancelled=token=>token!==state.token;
async function enter(index){
 if(state.busy||state.mode==='room')return;
 const room=rooms[index],token=++state.token;state.busy=true;state.room=index;hud();status(`沿旋转楼梯前往 ${room.name}`);
 // Approach the open front of the ground floor, then step onto the spiral.
 await moveTo({eye:world(10.3,START,1.68),target:world(1.8,START,1.55)},1300,token);if(cancelled(token))return;
 await moveTo({eye:world(2.25,START,1.68),target:world(3.2,START+.14,1.55)},1250,token);if(cancelled(token))return;
 if(index>0){await arc(2.25,START,START+index*TAU,1.68,room.y+1.68,1600+index*700,token);if(cancelled(token))return;}
 await moveTo({eye:world(5.5,START,room.y+1.68),target:world(6.8,START+.12,room.y+1.6)},700,token);if(cancelled(token))return;
 const doorAngle=START+Math.atan2(Math.sin(room.angle-START),Math.cos(room.angle-START));
 await arc(5.5,START,doorAngle,room.y+1.68,room.y+1.68,1100,token);if(cancelled(token))return;
 await moveTo({eye:local(room,0,1.65,-1.4),target:local(room,0,1.5,3.8),fov:.85},650,token);if(cancelled(token))return;
 status('门正在打开…');await animate(1000,t=>{room.door=t*Math.PI*.53},token);if(cancelled(token))return;
 status('走进房间…');await moveTo({eye:local(room,0,1.65,2.3),target:local(room,0,1.5,5.5),fov:1.04},1400,token);if(cancelled(token))return;
 state.mode='room';state.busy=false;state.yaw=0;state.pitch=-.04;state.depth=2.3;
 $('#room-kicker').textContent=`0${index+1} / ${room.english}`;$('#room-title').textContent=room.name;$('#room-description').textContent=room.description;status('拖动环顾 · 点击画作查看 · ESC 返回');hud();
}
async function leave(){
 if(state.busy){state.token++;if(tween){tween.resolve();tween=null;}state.busy=false;for(const r of rooms)r.door=0;state.mode='atrium';state.room=null;const token=++state.token;state.busy=true;hud();status('正在返回中庭…');await moveTo(overview(),1200,token);state.busy=false;hud();status('选一扇门，开始探索');return;}
 if(state.mode!=='room')return;
 const room=rooms[state.room],token=++state.token;state.busy=true;hud();status('沿原路返回回廊…');
 await moveTo({eye:local(room,0,1.65,.9),target:local(room,0,1.5,4.8),fov:.85},700,token);if(cancelled(token))return;
 await moveTo({eye:local(room,0,1.65,-1.4),target:local(room,0,1.5,3.8),fov:.85},1100,token);if(cancelled(token))return;
 const d=room.door;await animate(950,t=>{room.door=d*(1-t)},token);if(cancelled(token))return;
 // Remain on the landing, then fly out above its handrail into the overview.
 await moveTo({eye:world(5.4,room.angle,room.y+2.4),target:[0,room.y+1,0],fov:.72},1000,token);if(cancelled(token))return;
 await moveTo({eye:world(5.4,START,14.8),target:[0,7,0]},1000,token);if(cancelled(token))return;
 state.mode='atrium';state.room=null;await moveTo(overview(),1300,token);if(cancelled(token))return;state.busy=false;hud();status('选一扇门，开始探索');
}
function showArt(id){const item=art[id];$('#art-image').src=item.canvas.toDataURL('image/png');$('#art-image').alt=`${item.title}，程序绘制的示意画`;$('#art-title').textContent=item.title;$('#art-dialog').showModal()}
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>enter(Number(b.dataset.room)));
$('#back').onclick=leave;$('#home').onclick=async()=>{if(state.busy||state.mode==='room'){await leave();return}state.angle=.72;state.height=6;state.radius=innerWidth<650?44:35;state.busy=true;hud();await moveTo(overview(),1100,state.token);state.busy=false;hud()};
$('#help').onclick=()=>$('#help-dialog').showModal();document.querySelectorAll('.dialog-close').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
canvas.addEventListener('pointerdown',e=>{if(state.busy)return;canvas.setPointerCapture(e.pointerId);state.pointers.set(e.pointerId,[e.clientX,e.clientY]);state.drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,distance:0,multi:state.pointers.size>1};canvas.classList.add('dragging')});
canvas.addEventListener('pointermove',e=>{if(!state.drag||state.busy)return;const d=state.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;d.distance+=Math.hypot(dx,dy);d.x=e.clientX;d.y=e.clientY;state.pointers.set(e.pointerId,[e.clientX,e.clientY]);if(state.pointers.size>1){d.multi=true;if(state.mode==='atrium')state.height=Math.max(.5,Math.min(10.5,state.height+dy*.022));else state.depth=Math.max(1.1,Math.min(3.55,state.depth+dy*.012));return;}if(state.mode==='atrium'){state.angle-=dx*.006;state.height=Math.max(.5,Math.min(10.5,state.height+dy*.018))}else{state.yaw=Math.max(-1.5,Math.min(1.5,state.yaw-dx*.005));state.pitch=Math.max(-.65,Math.min(.55,state.pitch+dy*.004))}});
function pointerEnd(e){state.pointers.delete(e.pointerId);if(!state.drag)return;const d=state.drag;if(state.pointers.size>0){d.multi=true;return}state.drag=null;canvas.classList.remove('dragging');if(d.distance<7&&!d.multi&&!state.busy){const hit=engine.pick(e.clientX,e.clientY);if(hit?.action?.type==='door')enter(hit.action.id);if(hit?.action?.type==='art')showArt(hit.action.id)}}
canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',()=>{state.drag=null;state.pointers.clear();canvas.classList.remove('dragging')});canvas.addEventListener('wheel',e=>{e.preventDefault();if(state.busy)return;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);if(state.mode==='atrium')state.height=Math.max(.5,Math.min(10.5,state.height+delta*.008));else state.depth=Math.max(1.1,Math.min(3.55,state.depth-delta*.0025))},{passive:false});
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(e.key==='Escape'){leave();return}if(state.busy||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(state.mode==='atrium'){state.angle+=e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0;state.height=Math.max(.5,Math.min(10.5,state.height+(e.key==='ArrowUp'?.4:e.key==='ArrowDown'?-.4:0)))}else{state.yaw=Math.max(-1.5,Math.min(1.5,state.yaw+(e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0)));state.depth=Math.max(1.1,Math.min(3.55,state.depth+(e.key==='ArrowUp'?.15:e.key==='ArrowDown'?-.15:0)))}});
if(innerWidth<650){state.radius=44;state.height=5;}
cameraSet(overview());hud();
let previous=0,lastPin=0;
function tick(now){const dt=Math.min(.05,(now-previous)/1000||.016);previous=now;
 if(tween){const a=tween,t=Math.min(1,(now-a.start)/a.duration);if(a.token!==state.token){tween=null;a.resolve()}else{a.update(ease(t));if(t>=1){tween=null;a.resolve()}}}
 else if(!state.busy){if(state.mode==='atrium'){const goal=overview(),s=1-Math.exp(-dt*9);camera.eye=camera.eye.map((v,i)=>v+(goal.eye[i]-v)*s);camera.target=camera.target.map((v,i)=>v+(goal.target[i]-v)*s);camera.fov+=(.72-camera.fov)*s}else{const r=rooms[state.room],eye=local(r,0,1.65,state.depth),direction=[Math.sin(state.yaw)*Math.cos(state.pitch),Math.sin(state.pitch),Math.cos(state.yaw)*Math.cos(state.pitch)];camera.eye=eye;camera.target=V.add(eye,M.transform(pose(0,0,0,r.angle),V.scale(direction,4),0));}}
 engine.draw(camera);
 if(now-lastPin>100){lastPin=now;rooms.forEach(r=>{const p=engine.project(local(r,0,3.6,-.35)),visible=p&&p.z<1&&p.x>50&&p.x<innerWidth-45&&p.y>110&&p.y<innerHeight-130;let clear=false;if(visible&&!state.busy&&state.mode==='atrium'){const center=engine.project(local(r,0,1.6,-.15));if(center){const hit=engine.pick(center.x,center.y);clear=hit?.action?.type==='door'&&hit.action.id===rooms.indexOf(r)}}r.pin.hidden=!visible||!clear||state.busy||state.mode==='room';if(p){r.pin.style.left=`${p.x}px`;r.pin.style.top=`${p.y}px`}})}
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
// Read-only inspection hook for local smoke tests; no external services.
window.__house={state,rooms,camera,engine,enter,leave,projectDoor:i=>engine.project(local(rooms[i],0,1.4,-.15))};

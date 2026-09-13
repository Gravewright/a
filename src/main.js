// Gravewright 3D Dice — AGPL-3.0-only; see LICENSE.md and THIRD_PARTY_NOTICES.md.
import {DiceRenderer} from './renderer.js';
import {notation,preferences,FONTS} from './notation.js';
let instance;
const translate=(en,pt,es)=>{const l=document.documentElement.lang;return l.startsWith('pt')?pt:l.startsWith('es')?es:en;};
class Module {
 async start(ctx) {
  this.ctx=ctx;this.pending=new Map();this.ids=new Set();this.queue=[];this.disposed=false;
  ctx.styles.use('styles.css');ctx.onDispose(()=>this.dispose());
  this.fonts=[];
  await Promise.all(Object.keys(FONTS).map(async id=>{const face=new FontFace('gw3d-'+id,`url("${ctx.assets.url('assets/fonts/'+id+'.ttf')}")`,{weight:'600'});await face.load();if(!this.disposed){document.fonts.add(face);this.fonts.push(face);}}));
  if(ctx.signal.aborted)return;
  this.saved=await ctx.storage.user.get('appearance');this.prefs=preferences(this.saved?.value);
  this.worker=new Worker(ctx.assets.url('physics-worker.js'));
  this.worker.onmessage=({data})=>{const request=this.pending.get(data.id);if(!request)return;this.pending.delete(data.id);clearTimeout(request.timer);data.error?request.reject(new Error(data.error)):request.resolve(data.result);};
  this.worker.onerror=()=>{for(const r of this.pending.values()){clearTimeout(r.timer);r.reject(new Error('Dice physics worker failed'));}this.pending.clear();};
  this.layer=document.createElement('div');this.layer.className='gw3d-layer';this.layer.hidden=true;
  this.stage=document.createElement('div');this.stage.className='gw3d-stage';this.caption=document.createElement('p');this.caption.className='gw3d-caption';this.caption.role='status';this.layer.append(this.stage,this.caption);document.body.append(this.layer);
  document.addEventListener('pointerdown',()=>{if(!this.audio){try{this.audio=new AudioContext();}catch{}}if(this.audio?.state==='suspended')void this.audio.resume();},{signal:ctx.signal});
  ctx.api.events.on('chat.message',message=>this.receive(message));
 }
 receive(message) {
  if(this.disposed || !message.roll || message.deleted || this.ids.has(message.id))return;
  this.ids.add(message.id);if(this.ids.size>1024)this.ids.delete(this.ids.values().next().value);
  const dice=notation(message);if(!dice.length)return;
  // Only live, already-authorized chat events enter this queue; no history replay
  // or extra socket is used. Private rolls stay with their native audience.
  this.queue.push({message,dice});void this.drain();
 }
 simulate(dice,width,height) {
  return new Promise((resolve,reject)=>{const id=crypto.randomUUID();const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Dice simulation timed out'));},20000);this.pending.set(id,{resolve,reject,timer});this.worker.postMessage({id,dice,width:Math.min(width,40),height,seed:crypto.getRandomValues(new Uint32Array(1))[0]});});
 }
 async drain() {
  if(this.running || this.disposed)return;this.running=true;
  try {
   while(this.queue.length && !this.disposed) {
    const {message,dice}=this.queue.shift();this.layer.hidden=false;
    this.view??=new DiceRenderer(this.stage);this.view.size();
    this.caption.textContent=[message.from?.name,message.roll.label||message.roll.expression].filter(Boolean).join(' · ');
    for(let i=0;i<dice.length&&!this.disposed;i+=24){
     const batch=dice.slice(i,i+24),result=await this.simulate(batch,this.view.width*.88,this.view.height*.82);
     if(this.disposed)break;
     this.view.set(batch,result.landing,this.prefs);this.layer.dataset.state='rolling';
     await this.replay(this.view,result);
     if(this.disposed)break;
     this.layer.dataset.state='settled';this.layer.dataset.values=JSON.stringify(batch.map(d=>d.value));
     await this.pause(1800);
    }
   }
  }catch(error){if(!this.disposed)console.error('Gravewright 3D Dice:',error);}
  finally{this.running=false;if(this.layer){this.layer.hidden=true;this.layer.dataset.state='idle';}this.view?.clear();}
 }
 pause(ms){return new Promise(resolve=>{this.pauseResolve=resolve;this.pauseTimer=setTimeout(()=>{this.pauseResolve=null;resolve();},ms);});}
 replay(view,result) {
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){view.frame(result.frames.at(-1));return Promise.resolve();}
  return new Promise(resolve=>{this.replayResolve=resolve;let start,impact=0;const tick=time=>{
   if(this.disposed){resolve();return;}start??=time;const frame=Math.min(Math.floor((time-start)/1000*60),result.frames.length-1);
   view.frame(result.frames[frame]);
   while(impact<result.impacts.length&&result.impacts[impact][0]<=frame){const hit=result.impacts[impact++];if(frame-hit[0]<4)this.sound(hit[1]);}
   if(frame===result.frames.length-1){this.replayResolve=null;resolve();}else this.raf=requestAnimationFrame(tick);
  };this.raf=requestAnimationFrame(tick);});
 }
 sound(speed){if(!this.audio||this.audio.state!=='running'||this.audio.currentTime-(this.lastSound??0)<.045)return;const t=this.audio.currentTime;this.lastSound=t;const osc=this.audio.createOscillator(),gain=this.audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(130+Math.random()*200,t);gain.gain.setValueAtTime(Math.min(speed/800,.045),t);gain.gain.exponentialRampToValueAtTime(.0001,t+.055);osc.connect(gain).connect(this.audio.destination);osc.start(t);osc.stop(t+.06);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
 async customize() {
  if(this.dialog){this.dialog.focus();return;}
  const dialog=document.createElement('dialog');dialog.className='gw3d-customize';this.dialog=dialog;dialog.addEventListener('keydown',event=>event.stopPropagation());
  const h=document.createElement('h2');h.textContent=translate('Customize dice','Personalizar dados','Personalizar dados');dialog.append(h);
  const form=document.createElement('form');form.method='dialog';dialog.append(form);
  const preview=document.createElement('div');preview.className='gw3d-preview';form.append(preview);
  const draft={...this.prefs};let previewView,previewGeneration=0;
  const render=async()=>{const generation=++previewGeneration;try{previewView??=new DiceRenderer(preview,{height:5});previewView.size();const dice=[{sides:20,value:20},{sides:6,value:6}],r=await this.simulate(dice,previewView.width*.8,previewView.height*.65);if(!dialog.open||generation!==previewGeneration)return;previewView.set(dice,r.landing,draft);const frame=[...r.frames.at(-1)];frame[0]=-1.4;frame[2]=0;frame[7]=1.4;frame[9]=0;previewView.frame(frame);}catch(error){if(dialog.open)notice.textContent=translate('3D preview unavailable.','Prévia 3D indisponível.','Vista 3D no disponible.');}};
  for(const [key,caption] of [['diceColor',translate('Dice color','Cor do dado','Color del dado')],['textColor',translate('Text color','Cor do texto','Color del texto')],['font',translate('Font','Fonte','Fuente')]]) {
   const label=document.createElement('label');label.textContent=caption;
   const input=document.createElement(key==='font'?'select':'input');input.name=key;
   if(key==='font')for(const [id,name] of Object.entries(FONTS))input.add(new Option(name,id));else input.type='color';
   input.value=draft[key];input.addEventListener('input',()=>{draft[key]=input.value;clearTimeout(this.previewTimer);this.previewTimer=setTimeout(()=>void render(),120);});label.append(input);form.append(label);
  }
  const notice=document.createElement('p');notice.role='status';notice.className='gw3d-notice';form.append(notice);
  const actions=document.createElement('footer'),cancel=document.createElement('button'),save=document.createElement('button');cancel.type='button';cancel.textContent=translate('Cancel','Cancelar','Cancelar');cancel.onclick=()=>dialog.close();save.type='submit';save.textContent=translate('Save','Salvar','Guardar');actions.append(cancel,save);form.append(actions);
  const credits=document.createElement('p');credits.className='gw3d-credits';credits.append(document.createTextNode('Based on Dice So Nice · Simone & JDW · AGPLv3 · No warranty. '));
  for(const [url,title] of [['https://github.com/Gravewright/Gravewright-3D-Dice','Source'],[this.ctx.assets.url('LICENSE.md'),'License']]){const a=document.createElement('a');a.href=url;a.textContent=title;a.target='_blank';a.rel='noopener noreferrer';credits.append(a,document.createTextNode(' '));}dialog.append(credits);
  form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{this.saved=await this.ctx.storage.user.set('appearance',preferences(draft),{expectedRevision:this.saved?.revision??null});this.prefs=preferences(draft);dialog.close();}catch(error){if(error.code==='conflict'){this.saved=await this.ctx.storage.user.get('appearance');notice.textContent=translate('Changed in another tab. Review your choices and save again.','Alterado em outra aba. Revise suas escolhas e salve novamente.','Cambió en otra pestaña. Revisa y guarda de nuevo.');}else notice.textContent=translate('Could not save. Try again.','Não foi possível salvar. Tente novamente.','No se pudo guardar. Inténtalo de nuevo.');}finally{save.disabled=false;}};
  dialog.addEventListener('close',()=>{clearTimeout(this.previewTimer);previewGeneration++;previewView?.dispose();dialog.remove();if(this.dialog===dialog)this.dialog=null;},{once:true});
  document.body.append(dialog);dialog.showModal();void render();
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.dialog?.close();this.queue=[];this.worker?.terminate();for(const r of this.pending.values()){clearTimeout(r.timer);r.reject(new Error('Module deactivated'));}this.pending.clear();cancelAnimationFrame(this.raf);clearTimeout(this.pauseTimer);this.pauseResolve?.();this.replayResolve?.();this.view?.dispose();this.layer?.remove();this.audio?.close();for(const font of this.fonts??[])document.fonts.delete(font);}
}
export default {
 async start(ctx){instance=new Module();await instance.start(ctx);},
 register(){},
 customize(){return instance.customize();},
 stop(){instance?.dispose();instance=null;}
};

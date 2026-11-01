'use strict';
const $=id=>document.getElementById(id),C=window.PRCore;
const query=new URLSearchParams(location.search),rehearsal=query.get('ensayo')==='1';
const rehearsalId=(query.get('sala')||'local').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40)||'local';
const sessionId='real_'+Math.random().toString(16).slice(2),storeKey='pr_program_state'+(rehearsal?'_ensayo_'+rehearsalId:'');
let data,event,client,channel,ready=false,owns=false,owner=null,live=null,idx=0,qi=0,seq=0,hidden=new Set(),layout='',surface='scene',externalUrl='',externalTitle='',customPeople=null,boardImages={},presence={},day='',filter='all',manualAlertUntil=0;
const now=()=>Date.now(),scenes=()=>event.productionScenes||[],scene=()=>scenes()[idx]||{},base=()=>data.realtime.topicBase;
function notice(text){$('notice').textContent=text}
function draft(){return C.makeDraft(event,idx,{questionIndex:qi,hidden:[...hidden],layout,surface,participants:customPeople||undefined,externalUrl,title:externalTitle||undefined})}
function storageSet(value){try{localStorage.setItem(storeKey,JSON.stringify(value))}catch(_){notice('No se pudo guardar el respaldo local. Conserva PROGRAM abierto.')}}
function transport(type,obj,retain=true){
  if(rehearsal){channel?.postMessage({kind:type,payload:obj});return true}
  if(!client?.connected)return false;
  client.publish(base()+'/'+type,JSON.stringify(obj),{qos:0,retain});return true;
}
function controlActive(){return !!(owner&&owner.online&&now()-owner.updatedAt<20000)}
function updateStatus(){
  const active=controlActive(),other=active&&owner.sessionId!==sessionId;
  if(owns&&other)owns=false;
  $('claim').disabled=!ready||owns;
  $('claim').textContent=owns?'Control activo':other?'Tomar control de esta cabina':'Tomar control';
  $('ownerStatus').textContent=owns?'Tú controlas la salida. PREVIA no se emite hasta ENVIAR AL AIRE.':other?'Otra cabina tiene el control. Puedes preparar sin modificar la salida.':'Modo observación. Pulsa Tomar control cuando vayas a realizar.';
  $('take').disabled=$('pause').disabled=!(owns&&ready);
  document.querySelectorAll('[data-alert]').forEach(b=>b.disabled=!(owns&&ready&&live&&!live.paused));
}
function receiveState(st){
  if(!C.validState(st,event)||!C.acceptNewer(st,live))return;
  live=st;storageSet(st);$('liveLabel').textContent=st.paused?'PAUSA · audio externo':st.sceneTitle||'Escena recibida';
  $('programMonitor').contentWindow?.postMessage({type:'PR_PROGRAM_STATE',state:st},location.origin);
  updateStatus();renderTiming();
}
function sendCommitted(st){
  if(!owns||!ready){notice('Primero toma el control y verifica el canal. La salida no ha cambiado.');return false}
  if(!transport('state',st)){notice('Canal desconectado. PROGRAM conserva la última escena.');return false}
  receiveState(st);return true;
}
function sendPreview(){
  if(!event)return;const st=draft();
  $('preview').contentWindow?.postMessage({type:'PR_PREVIEW',state:st},location.origin);
  for(const [id,image] of Object.entries(boardImages))$('preview').contentWindow?.postMessage({type:'PR_REMOTE_BOARD_IMAGE',data:image,speakerId:id},location.origin);
  $('draftLabel').textContent=(event.blocks.find(b=>b.id===scene().blockId)?.day||'')+' · '+st.sceneTitle+' · '+st.participants.length+' participante(s) · '+(st.surface==='board'?'Pizarra':st.layoutOverride);
  const q=(scene().questionFlow||[])[qi];
  $('scriptQuestion').textContent=q?.prompt||scene().question||scene().title||'';
  $('scriptCue').textContent=scene().producerCue||'';
  $('scriptTransition').textContent='Continuidad: '+(q?.transition||scene().bridge||'Avance manual.');
  $('qPrev').disabled=!q||qi===0;$('qNext').disabled=!q||qi>=scene().questionFlow.length-1;
  if(q?.to&&!st.participants.includes(q.to))notice('El destinatario de la pregunta no está visible. Adapta la intervención o prepara otra escena antes de emitir.');
}
function sceneOptions(){
  const select=$('scene');select.replaceChildren();
  scenes().forEach((s,i)=>{const b=event.blocks.find(b=>b.id===s.blockId);if(day&&b?.day!==day)return;if(filter!=='all'&&!(s.participants||[]).includes(filter)&&s.leadSpeaker!==filter&&!(s.questionFlow||[]).some(q=>q.to===filter))return;
    const o=document.createElement('option');o.value=String(i);o.textContent=s.title;select.appendChild(o)});
  if(!select.options.length){const o=document.createElement('option');o.textContent='Sin escenas para este filtro';o.value='';select.appendChild(o);notice('No hay escenas con ese filtro. Selecciona Todos para continuar.');return}
  if(![...select.options].some(o=>Number(o.value)===idx))idx=Number(select.options[0].value);
  select.value=String(idx);
}
function selectScene(i){idx=Math.max(0,Math.min(scenes().length-1,Number(i)||0));qi=0;layout='';surface='scene';externalUrl='';externalTitle='';customPeople=null;sceneOptions();updateLinks();sendPreview();notice('Escena preparada en PREVIA. AL AIRE conserva su estado.')}
function renderPeople(){
  $('participants').replaceChildren();Object.entries(event.speakers).forEach(([id,p])=>{
    const row=document.createElement('div');row.className='person';const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=!hidden.has(id);c.dataset.person=id;c.setAttribute('aria-label','Mostrar '+p.name);l.append(c,document.createTextNode(' '+p.name));
    c.onchange=()=>{c.checked?hidden.delete(id):hidden.add(id);if(layout==='trio')customPeople=activeDayPeople();sendPreview();notice('Participantes ajustados en PREVIA. Pulsa ENVIAR AL AIRE para aplicarlos.')};
    const status=document.createElement('small');status.id='presence_'+id;row.append(l,status);$('participants').appendChild(row);
  });renderPresence();
}
function renderPresence(){if(!event)return;for(const id of Object.keys(event.speakers)){const p=presence[id],online=p?.online&&now()-p.updatedAt<45000;$('presence_'+id).textContent=(online?'Canal conectado':'Sin presencia reciente')+' · cámara/audio sin comprobar'}}
function activeDayPeople(){return (day==='Día 2'?['daniel','xavier','camilo']:['daniel','kervin','patricio']).filter(id=>event.speakers[id]&&!hidden.has(id))}
function setLayout(value){layout=value;surface='scene';externalTitle='';externalUrl='';customPeople=value==='trio'?activeDayPeople():null;sendPreview();notice('Composición preparada en PREVIA. Revisa antes de enviar al aire.')}
function take(){
  const d=draft();if(!d.participants.length){notice('No hay participantes visibles. Muestra al menos uno o utiliza PAUSA.');return}
  if(d.layoutOverride==='tool'&&!d.externalUrl){notice('Introduce un enlace público HTTPS válido y revisa PREVIA.');return}
  const st=C.commitDraft(d,live,now(),sessionId,++seq);manualAlertUntil=0;
  if(sendCommitted(st))notice('AL AIRE: '+st.sceneTitle+'. La transmisión a redes se inicia desde el estudio.');
}
function pause(){if(sendCommitted(C.holdState(event,live,now(),sessionId,++seq)))notice('Placa GeoPro AL AIRE. Silencia la salida de audio en Zoom / mezclador. Para volver, revisa PREVIA y pulsa ENVIAR AL AIRE.')}
function claim(){
  if(!ready)return;
  if(controlActive()&&owner.sessionId!==sessionId&&!confirm('Otra cabina tiene el control. ¿Tomar su lugar? Coordina primero con la persona que está realizando.'))return;
  owns=true;owner={online:true,sessionId,updatedAt:now()};transport('control',owner);updateStatus();notice('Control adquirido. La salida sigue igual hasta ENVIAR AL AIRE o PAUSA.');
}
function alertLive(value,manual=true){
  if(!owns||!ready||!live||live.paused)return;
  const st={...live,alert:value,sessionId,seq:++seq,ts:now()};if(manual)manualAlertUntil=now()+15000;sendCommitted(st);
}
function fmt(ms){let s=Math.floor(Math.abs(ms)/1000);return (ms<0?'+':'')+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function renderTiming(){
  if(!live||live.paused){$('sceneTime').textContent=$('segmentTime').textContent='--:--';$('timeHint').textContent=live?.paused?'Pausa activa. Prepara la escena y confirma el regreso.':'Los relojes comienzan al enviar al aire.';return}
  const dur=(live.questionCount?live.questionDurationSec:live.durationSec)*1000;
  const remaining=dur-(now()-(live.questionCount?live.questionStartedAt:live.sceneStartedAt));
  const blockRemaining=live.segmentDurationSec*1000-(now()-live.segmentStartedAt);
  $('sceneTime').textContent=fmt(remaining);$('segmentTime').textContent=fmt(blockRemaining);
  $('timeHint').textContent=remaining<=0?'Tiempo de idea cumplido. Cierra la frase; el avance es manual.':remaining<=30000?'Quedan 30 segundos o menos para cerrar la idea.':'Avance manual · avisos automáticos de bloque.';
  if(owns&&ready&&now()>manualAlertUntil){const a=blockRemaining<=120000?'danger':blockRemaining<=300000?'warning':'';const ending=remaining<=30000;
    if(a!==live.alert||ending!==!!live.sceneEnding){const st={...live,alert:a,sceneEnding:ending,sessionId,seq:++seq,ts:now()};sendCommitted(st)}
  }
}
function acknowledge(cmd,ok,reason){transport('panelist-ack/'+cmd.speakerId,{ok,type:cmd.type,reason,updatedAt:now()},false)}
function panelistCommand(cmd){
  if(!owns||!ready||!live?.onair||live.paused||!cmd?.speakerId)return;
  if(!Number.isFinite(Number(cmd.updatedAt))||Number(cmd.sceneIndex)!==live.sceneIndex||now()-Number(cmd.updatedAt)>15000||Number(cmd.updatedAt)>now()+5000){acknowledge(cmd,false,'stale');return}
  const active=scenes()[live.sceneIndex],allowed=live.participants.includes(cmd.speakerId)&&(live.targetSpeakerId===cmd.speakerId||live.speakerId===cmd.speakerId);
  if(!allowed){acknowledge(cmd,false,'locked');return}
  if(cmd.type==='NEXT_SLIDE'||cmd.type==='PREV_SLIDE'){
    if(active.layout!=='presentation'||active.leadSpeaker!==cmd.speakerId){acknowledge(cmd,false,'locked');return}
    const own=scenes().map((s,i)=>({s,i})).filter(x=>x.s.layout==='presentation'&&x.s.segmentId===active.segmentId&&x.s.leadSpeaker===cmd.speakerId),pos=own.findIndex(x=>x.i===live.sceneIndex),next=own[pos+(cmd.type==='NEXT_SLIDE'?1:-1)];
    if(!next){acknowledge(cmd,false,'boundary');return}
    day=event.blocks.find(b=>b.id===next.s.blockId)?.day||day;$('day').value=day;filter='all';$('speaker').value='all';selectScene(next.i);
    if($('allowSlides').checked){take();acknowledge(cmd,true,'applied')}else{acknowledge(cmd,false,'preview');notice('Solicitud del panelista preparada en PREVIA. Revisa y pulsa ENVIAR AL AIRE.')}
  }else if(cmd.type==='SHOW_BOARD'||cmd.type==='SHOW_SCENE'){
    if(cmd.type==='SHOW_BOARD'&&!boardImages[cmd.speakerId]){acknowledge(cmd,false,'no-board');return}
    day=event.blocks.find(b=>b.id===active.blockId)?.day||day;$('day').value=day;filter='all';$('speaker').value='all';selectScene(live.sceneIndex);surface=cmd.type==='SHOW_BOARD'?'board':'scene';sendPreview();acknowledge(cmd,false,'preview');notice('Solicitud de '+(surface==='board'?'pizarra':'regreso a escena')+' en PREVIA. Revisa y confirma la salida.');
  }
}
function incoming(type,obj){
  if(type==='state'){receiveState(obj);return}
  if(type==='control'){
    if(obj?.sessionId&&obj.sessionId!==sessionId){if(obj.online){owner=obj;if(owns){owns=false;notice('Otra cabina tomó el control. Ahora estás en observación.')}}else if(owner?.sessionId===obj.sessionId)owner=obj}updateStatus();return;
  }
  if(type.startsWith('presence/')){if(event.speakers[obj?.speakerId])presence[obj.speakerId]=obj;renderPresence();return}
  if(type.startsWith('board/')&&obj?.data&&event.speakers[obj.speakerId]&&/^data:image\/(jpeg|png|webp);base64,/.test(obj.data)&&obj.data.length<1600000){boardImages[obj.speakerId]=obj.data;sendPreview();$('programMonitor').contentWindow?.postMessage({type:'PR_REMOTE_BOARD_IMAGE',data:obj.data,speakerId:obj.speakerId},location.origin);return}
  if(type==='command')panelistCommand(obj);
}
async function initTransport(){
  if(rehearsal){channel=new BroadcastChannel('pr-realization-ensayo-'+rehearsalId);channel.onmessage=e=>incoming(e.data.kind,e.data.payload);ready=true;$('rtText').textContent='Ensayo aislado · sin conexión al evento';updateStatus();return}
  try{await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://unpkg.com/mqtt/dist/mqtt.min.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script)});
    client=mqtt.connect(data.realtime.broker,{clientId:sessionId,clean:true,connectTimeout:5000,reconnectPeriod:2000,keepalive:20,will:{topic:base()+'/control',payload:JSON.stringify({online:false,sessionId,updatedAt:now()}),qos:0,retain:true}});
    client.on('connect',()=>{ready=true;client.subscribe(base()+'/#');$('rtText').textContent='Canal conectado · imagen/audio sin comprobar';updateStatus()});
    const offline=()=>{ready=false;owns=false;$('rtText').textContent='Sin canal · PROGRAM conserva la última escena';updateStatus()};
    client.on('offline',offline);client.on('close',offline);client.on('error',()=>{ready=false;owns=false;$('rtText').textContent='Error de canal · revisa conexión';updateStatus()});
    client.on('message',(topic,payload)=>{try{incoming(topic.slice(base().length+1),JSON.parse(payload.toString()))}catch(_){}});
  }catch(_){$('rtText').textContent='No se pudo cargar el canal. Revisa conexión o usa ensayo aislado.';ready=false;updateStatus()}
}
function updateLinks(){const p=event.speakers[$('speaker').value]?$('speaker').value:event.moderatorId;const extra=rehearsal?'&ensayo=1&sala='+encodeURIComponent(rehearsalId):'';
  $('moderatorLink').href='./panelist-live-v142.html?panelista='+encodeURIComponent(event.moderatorId)+extra;
  $('moderatorLink').textContent='Moderador · '+event.speakers[event.moderatorId].name;
  $('panelistLink').href='./panelist-live-v142.html?panelista='+encodeURIComponent(p)+extra;$('panelistLink').textContent='Espacio · '+event.speakers[p].name;
  $('cameraSender').href='./camera-v142.html?panelista='+encodeURIComponent(p);
}
async function init(){try{
  data=await(await fetch('./events-v142.json?v='+now(),{cache:'no-store'})).json();event=data.event;day=event.blocks[0]?.day||'Día 1';
  $('modeBadge').textContent=rehearsal?'ENSAYO AISLADO':'EVENTO';
  const suffix=rehearsal?'&ensayo=1&sala='+encodeURIComponent(rehearsalId):'';
  $('preview').src='./program-v142.html?preview=1'+suffix;$('programMonitor').src='./program-v142.html?monitor=1'+suffix;
  $('openProgram').href='./program-v142.html'+(rehearsal?'?ensayo=1&sala='+encodeURIComponent(rehearsalId):'');
  $('openRehearsal').href='./control-v142.html?ensayo=1&sala='+encodeURIComponent('ensayo-'+Math.random().toString(16).slice(2,10));
  [...new Set(event.blocks.map(b=>b.day))].forEach(d=>{const o=document.createElement('option');o.value=o.textContent=d;$('day').appendChild(o)});
  let o=document.createElement('option');o.value='all';o.textContent='Todos · programa de la jornada';$('speaker').appendChild(o);
  Object.entries(event.speakers).forEach(([id,p])=>{const o=document.createElement('option');o.value=id;o.textContent=p.name;$('speaker').appendChild(o)});
  sceneOptions();renderPeople();updateLinks();
  const activeDecks=new Set(scenes().filter(s=>s.deckId).map(s=>s.deckId));$('decks').replaceChildren();for(const id of activeDecks){const deck=event.presentationDecks[id],row=document.createElement('div');row.textContent=deck.title+' · '+deck.slides.length+' láminas integradas';$('decks').appendChild(row)}
  $('day').onchange=()=>{day=$('day').value;filter='all';$('speaker').value='all';sceneOptions();selectScene(idx);updateLinks()};
  $('speaker').onchange=()=>{filter=$('speaker').value;sceneOptions();selectScene(idx);updateLinks()};
  $('scene').onchange=()=>{if($('scene').value!=='')selectScene(Number($('scene').value))};
  const move=delta=>{const opts=[...$('scene').options].filter(o=>o.value!==''),i=opts.findIndex(o=>Number(o.value)===idx),next=opts[i+delta];if(next)selectScene(Number(next.value))};
  $('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);
  $('qPrev').onclick=()=>{qi=Math.max(0,qi-1);sendPreview()};$('qNext').onclick=()=>{qi=Math.min((scene().questionFlow||[]).length-1,qi+1);sendPreview()};
  $('moderator').onclick=()=>setLayout('moderator');$('conversation').onclick=()=>setLayout('trio');
  $('presentation').onclick=()=>{if(scene().layout!=='presentation'){const i=scenes().findIndex(s=>s.layout==='presentation'&&event.blocks.find(b=>b.id===s.blockId)?.day===day);if(i<0){notice('Esta jornada no tiene presentación asignada. Usa Herramienta web o Pizarra.');return}filter='all';$('speaker').value='all';selectScene(i)}setLayout('presentation')};
  $('board').onclick=()=>{surface='board';sendPreview();notice('Pizarra en PREVIA. Si no hay trazos del participante activo, verás una pizarra vacía.')};
  $('original').onclick=()=>selectScene(idx);$('tool').onclick=()=>{$('toolSettings').open=true;$('externalUrl').focus()};
  $('applyTool').onclick=()=>{const url=C.safeUrl($('externalUrl').value);if(!url){notice('Usa un enlace público HTTPS válido, sin usuario ni contraseña.');return}layout='tool';surface='scene';externalUrl=url;externalTitle=$('externalTitle').value.trim()||'Demostración';sendPreview();notice('Herramienta en PREVIA. Comprueba que cargue antes de enviar al aire.')};
  $('allPeople').onclick=()=>{hidden.clear();if(layout==='trio')customPeople=activeDayPeople();renderPeople();sendPreview()};$('onlyHost').onclick=()=>{hidden=new Set(Object.keys(event.speakers).filter(id=>id!==event.moderatorId));renderPeople();sendPreview()};
  $('claim').onclick=claim;$('take').onclick=take;$('pause').onclick=pause;
  document.querySelectorAll('[data-alert]').forEach(b=>b.onclick=()=>alertLive(b.dataset.alert));
  $('preview').onload=sendPreview;$('programMonitor').onload=()=>{if(live)$('programMonitor').contentWindow?.postMessage({type:'PR_PROGRAM_STATE',state:live},location.origin)};
  window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='PR_PREVIEW_READY'&&e.source===$('preview').contentWindow)sendPreview()});
  window.addEventListener('storage',e=>{if(e.key===storeKey&&e.newValue){try{receiveState(JSON.parse(e.newValue))}catch(_){}}});
  try{const stored=JSON.parse(localStorage.getItem(storeKey));if(C.validState(stored,event))receiveState(stored)}catch(_){}
  sendPreview();notice('Listo. Preparar no cambia PROGRAM. Toma control solo cuando vayas a realizar.');await initTransport();
  setInterval(()=>{$('clock').textContent=new Date().toLocaleTimeString('es-EC',{timeZone:'America/Guayaquil'});if(owns&&ready){owner={online:true,sessionId,updatedAt:now()};transport('control',owner)}renderPresence();updateStatus();renderTiming()},1000);
  window.addEventListener('beforeunload',()=>{if(owns)transport('control',{online:false,sessionId,updatedAt:now()})});
}catch(err){$('rtText').textContent='Error al cargar el evento';notice('Recarga la página y comprueba la conexión. No se ha enviado ninguna escena.');console.error(err)}}
document.addEventListener('DOMContentLoaded',init);

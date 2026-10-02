import { app, database } from './firebase-config.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { ref, set, get, update, push, onValue, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';
const auth = getAuth(app);
auth.languageCode = 'es';
const coordinatorEmail = 'dcoellom2@unemi.edu.ec';
const mobile = document.body.dataset.page === 'collaborator';
const $ = id => document.getElementById(id);
let connected = false, incidentId = '', incident = null, watcher = null, lastSent = 0, sending = false;
let stopIncident = null, sharing = false, markers = new Map(), layer = null, mapInstance = null;
let hiddenMarkers = new Set();
let memberReady = false;
let coordinatorWatcher = null, coordinatorPosition = null, coordinatorGeneration = 0, fittedIncident = false;
function gpsNotice(text,bad=false){const n=$('locationState');if(n){n.textContent=text;n.classList.toggle('error',bad);}}
function coordinatorNotice(text){const n=$('coordinatorLocationState');if(n)n.textContent=text;}
function stopCoordinatorLocation(message='Tu ubicación está apagada.'){
 coordinatorGeneration++;if(coordinatorWatcher!==null)navigator.geolocation.clearWatch(coordinatorWatcher);
 coordinatorWatcher=null;coordinatorPosition=null;
 if($('coordinatorStart'))$('coordinatorStart').disabled=false;
 if($('coordinatorStop'))$('coordinatorStop').disabled=true;
 coordinatorNotice(message);renderPersonnel();
}
function startCoordinatorLocation(){
 if(!isCoordinator(auth.currentUser))throw Error('Inicia sesión como coordinador.');
 if(!navigator.geolocation)throw Error('Este navegador no ofrece ubicación.');
 if(coordinatorWatcher!==null)return;
 const generation=++coordinatorGeneration;
 $('coordinatorStart').disabled=true;$('coordinatorStop').disabled=false;
 coordinatorNotice('Esperando permiso y lectura GPS de este dispositivo…');
 coordinatorWatcher=navigator.geolocation.watchPosition(position=>{
  if(generation!==coordinatorGeneration||!isCoordinator(auth.currentUser))return;
  if(Date.now()-position.timestamp>60000)return;
  const {latitude:lat,longitude:lng,accuracy}=position.coords;
  coordinatorPosition={lat,lng,accuracy,updatedAt:position.timestamp};
  coordinatorNotice(`Tu ubicación: ${time(position.timestamp)} · precisión ±${Math.round(accuracy)} m. Solo visible en esta pantalla.`);
  renderPersonnel();
 },e=>{if(generation!==coordinatorGeneration)return;if(e.code===1)stopCoordinatorLocation('Permiso GPS denegado. Habilítalo para este sitio en el navegador.');else coordinatorNotice('GPS sin lectura: '+e.message);},
 {enableHighAccuracy:true,maximumAge:10000,timeout:20000});
}
function fitTeam(){
 if(!ensureMap()||!markers.size){notice('Todavía no hay ubicaciones recibidas. Enviar un reporte no activa el GPS.',true);return;}
 window.closeDrawers?.();mapInstance.invalidateSize();
 mapInstance.fitBounds(L.latLngBounds([...markers.values()].map(m=>m.getLatLng())),{padding:[70,70],maxZoom:17});
}
function labelMarker(marker,name,status){
 const label=textNode('span',name+' · '+status);
 marker.unbindTooltip();marker.bindTooltip(label,{permanent:true,direction:'top',offset:[0,-10],className:'person-location-label'});
}
function renderCoordinator(){
 const uid='@coordinator';
 if(!coordinatorPosition||!layer){const old=markers.get(uid);if(old)layer?.removeLayer(old);markers.delete(uid);return;}
 const p=coordinatorPosition,fresh=Date.now()-p.updatedAt<90000;
 let marker=markers.get(uid);
 if(!marker){marker=L.circleMarker([p.lat,p.lng],{radius:11,weight:3,fillOpacity:.9}).addTo(layer);markers.set(uid,marker);}
 marker.setLatLng([p.lat,p.lng]);marker.setStyle({color:fresh?'#4da9ff':'#ffc247',fillColor:fresh?'#4da9ff':'#ffc247'});
 labelMarker(marker,(auth.currentUser?.displayName||'Mi ubicación')+' (coordinador)',fresh?'GPS reciente':'última ubicación');
 const popup=textNode('div',`Coordinador · ${time(p.updatedAt)} · ±${Math.round(p.accuracy)} m · solo en este dispositivo`);marker.bindPopup(popup);
}
const errorText = e => ({
 'auth/operation-not-allowed':'El acceso aún no está activado en Firebase. No se enviaron datos.',
 'auth/unauthorized-domain':'Este dominio aún no está autorizado en Firebase.',
 'auth/popup-blocked':'Permite la ventana de acceso de Google y vuelve a intentar.',
 'auth/popup-closed-by-user':'Se cerró el acceso de Google.',
 'auth/network-request-failed':'No hay conexión con Firebase. Revisa Internet.',
 'PERMISSION_DENIED':'Acceso denegado: revisa si el incidente está abierto, el enlace es válido y tu acceso sigue autorizado.'
}[e.code] || (String(e.message).includes('permission_denied') ? 'Acceso denegado. El enlace puede estar vencido o revocado.' : 'No se pudo completar la acción: '+(e.message || e)));
function notice(text, bad = false) { const node = $('collabNotice'); if(node){node.textContent=text;node.classList.toggle('error',bad);} }
function action(fn) { return async event => { const button = event?.currentTarget; if(button)button.disabled=true; try { await fn(); } catch(e) { notice(errorText(e),true); } finally {if(button)button.disabled=false;} }; }
function path(s=''){return ref(database,`incidents/${incidentId}${s ? '/'+s : ''}`);}
function isCoordinator(user){return user && !user.isAnonymous && user.emailVerified && user.email === coordinatorEmail;}
function token(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');}
function active(meta){return meta?.active === true && meta.expiresAt > Date.now();}
function textNode(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
function time(t){return t ? new Date(t).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : 'sin registro';}
function makeButton(text,fn,cls='secondary'){const b=textNode('button',text,cls);b.type='button';b.onclick=action(fn);return b;}
function clearMap(){if(layer&&mapInstance)mapInstance.removeLayer(layer);layer=null;mapInstance=null;markers.clear();}
function ensureMap(){if(!window.map||!window.L)return false;if(mapInstance!==window.map||!layer){clearMap();mapInstance=window.map;layer=L.layerGroup().addTo(mapInstance);}return true;}
function renderPersonnel(){
 if(!incident){ensureMap();renderCoordinator();return;}
 const list=$('collabPersonnel'); if(!list)return; list.replaceChildren();
 ensureMap(); const seen=new Set(coordinatorPosition?['@coordinator']:[]); const all=Object.entries(incident.members||{});
 $('collabCount').textContent=`${all.length} colaboradores registrados · ${connected?'conexión disponible':'sin conexión'}`;
 for(const [uid,m] of all){
  const revoked=!!incident.revoked?.[uid], p=incident.locations?.[uid], report=incident.reports?.[uid];
  const age=p?.updatedAt ? Date.now()-p.updatedAt : Infinity;
  const fresh=connected&&active(incident.meta)&&!revoked&&p&&p.active!==false&&age<120000;
  const row=textNode('article','', 'collab-person');
  row.append(textNode('strong',m.name),textNode('small',`${m.role||'Colaborador'} · ${m.phone}`));
  row.append(textNode('p',revoked?'Acceso revocado':p?`${fresh?'Ubicación reciente':'Última ubicación; no confirma presencia actual'} · ${time(p.updatedAt)} · precisión ±${Math.round(p.accuracy)} m`:'Sin ubicación GPS: el colaborador debe pulsar Compartir ubicación y aceptar el permiso'));
  if(report)row.append(textNode('p',`${report.status} · ${time(report.updatedAt)}${report.detail?' · '+report.detail:''}`,report.status==='EMERGENCIA'?'error':''));
  if(p&&!revoked&&layer){
   const hidden=hiddenMarkers.has(uid);
   if(!hidden){
    seen.add(uid); let marker=markers.get(uid);
    if(!marker){marker=L.circleMarker([p.lat,p.lng],{radius:9,weight:3,fillOpacity:.85}).addTo(layer);markers.set(uid,marker);}
    marker.setLatLng([p.lat,p.lng]);marker.setStyle({color:fresh?'#31d0aa':'#ffc247',fillColor:fresh?'#31d0aa':'#ffc247'});
    labelMarker(marker,`${m.name} · ${m.role||'Colaborador'}`,fresh?'EN LÍNEA':'ÚLTIMA POSICIÓN');
    const popup=document.createElement('div');popup.append(textNode('strong',m.name),textNode('p',`${time(p.updatedAt)} · ±${Math.round(p.accuracy)} m${fresh?'':' · dato no actual'}`));marker.bindPopup(popup);
    row.append(makeButton('Ver en mapa',()=>{window.closeDrawers?.();mapInstance.invalidateSize();mapInstance.setView([p.lat,p.lng],17);marker.openPopup();}));
   }
   row.append(makeButton(hidden?'Mostrar en mapa':'Ocultar del mapa',()=>{if(hidden)hiddenMarkers.delete(uid);else hiddenMarkers.add(uid);renderPersonnel();},'secondary'));
  }
  if(!revoked)row.append(makeButton('Revocar acceso',async()=>{if(confirm(`¿Revocar el acceso de ${m.name}?`))await set(path('revoked/'+uid),true);},'red'));
  list.append(row);
 }
 for(const [uid,m] of markers){if(!seen.has(uid)){layer?.removeLayer(m);markers.delete(uid);}}
 renderCoordinator();
 if(markers.size&&!fittedIncident){fittedIncident=true;mapInstance.invalidateSize();mapInstance.fitBounds(L.latLngBounds([...markers.values()].map(m=>m.getLatLng())),{paddingTopLeft:[60,60],paddingBottomRight:[Math.min(500,mapInstance.getSize().x/2),60],maxZoom:17});}
 if(!all.length)list.append(textNode('p','Todavía no hay colaboradores registrados. Comparte el enlace del incidente.'));
}
function showIncident(id){
 stopIncident?.();clearMap();incidentId=id;fittedIncident=false;
 $('collabIncident').hidden=false;
 stopIncident=onValue(path(),snap=>{
  incident=snap.val();if(!incident){notice('El incidente no está disponible.',true);return;}
  $('collabIncidentTitle').textContent=incident.meta?.name||'Incidente';
  $('collabIncidentState').textContent=active(incident.meta)?`Abierto hasta ${new Date(incident.meta.expiresAt).toLocaleString('es-EC')}`:'Cerrado o vencido: no recibe nuevos datos';
  const url=new URL('colaborador.html',location.href);url.hash=new URLSearchParams({incidente:id,invitacion:incident.inviteToken||''}).toString();
  $('collabLink').value=active(incident.meta)&&incident.inviteToken?url.href:'';
  renderPersonnel();
 },e=>notice(errorText(e),true));
}
async function listIncidents(){
 const snap=await get(ref(database,'incidents'));const list=$('collabIncidents');list.replaceChildren();
 const entries=Object.entries(snap.val()||{}).filter(([,v])=>v.meta?.ownerUid===auth.currentUser.uid).sort((a,b)=>b[1].meta.createdAt-a[1].meta.createdAt);
 for(const [id,v] of entries)list.append(makeButton(`${v.meta.name} · ${active(v.meta)?'abierto':'cerrado'}`,()=>showIncident(id)));
 if(!entries.length)list.append(textNode('p','Crea el primer incidente para generar un enlace.'));
}
function mountControl(){
 const top=document.querySelector('.top-actions');if(!top)return;
 top.append(makeButton('Colaboradores en vivo',()=>window.openDrawer('panelCollaboration'),'green'));
 const panel=document.createElement('aside');panel.id='panelCollaboration';panel.className='drawer collab-panel';
 panel.innerHTML=`<div class="drawer-head"><h2>Colaboradores en vivo</h2><button id="collabClose" class="secondary">Cerrar</button></div>
 <p id="collabNotice" role="status" aria-live="polite">Accede como coordinador para abrir un incidente.</p>
 <p><a href="guia-colaboradores.html" target="_blank" rel="noopener" style="color:#69e6c4">Guía de uso y estado de activación</a></p><div id="collabLogin"><p>Acceso de coordinación con tu cuenta de Google.</p><button id="collabSignIn">Entrar con Google</button></div>
 <div id="collabControl" hidden><p id="collabIdentity"></p><button id="collabSignOut" class="secondary">Cerrar sesión</button>
 <h3>Mi ubicación de coordinador</h3><p id="coordinatorLocationState">Apagada. Usa el GPS del dispositivo donde abres esta cabina; solo se muestra aquí.</p><button id="coordinatorStart">Mostrar mi ubicación</button><button id="coordinatorStop" class="secondary" disabled>Detener mi ubicación</button><button id="collabFit" class="secondary">Ver equipo en mapa</button><h3>Nuevo incidente</h3><label for="collabName">Nombre</label><input id="collabName" maxlength="120" placeholder="Simulacro MATPEL · escuela">
 <label for="collabHours">Duración del enlace</label><select id="collabHours"><option value="4">4 horas</option><option value="12" selected>12 horas</option><option value="24">24 horas</option></select>
 <button id="collabCreate">Crear incidente y enlace</button><h3>Mis incidentes</h3><button id="collabRefresh" class="secondary">Actualizar lista</button><div id="collabIncidents"></div>
 <section id="collabIncident" hidden><h3 id="collabIncidentTitle"></h3><p id="collabIncidentState"></p><label for="collabLink">Enlace privado para colaboradores</label><input id="collabLink" readonly><button id="collabCopy">Copiar enlace</button><p class="hint">Quien reciba este enlace puede registrarse. No lo publiques en redes. Solo coordinación puede ver a todo el equipo.</p><div class="grid2"><button id="collabRotate" class="secondary">Renovar enlace</button><button id="collabEnd" class="red">Cerrar incidente</button></div><p id="collabCount"></p><div id="collabPersonnel"></div></section></div>`;
 document.querySelector('.app').append(panel);
 $('collabClose').onclick=()=>window.closeDrawers();
 $('collabSignIn').onclick=action(async()=>{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);});
 $('collabSignOut').onclick=action(()=>signOut(auth));
 $('collabRefresh').onclick=action(listIncidents);
 $('coordinatorStart').onclick=()=>{try{startCoordinatorLocation();}catch(e){coordinatorNotice(errorText(e));}};
 $('coordinatorStop').onclick=()=>stopCoordinatorLocation();
 $('collabFit').onclick=fitTeam;
 $('collabCreate').onclick=action(async()=>{
  if(!isCoordinator(auth.currentUser))throw Error('Acceso de coordinación requerido.');
  const name=$('collabName').value.trim();if(name.length<3)throw Error('Escribe al menos 3 caracteres para el incidente.');
  if(!connected)throw Error('Espera la conexión antes de crear el incidente.');
  const id=push(ref(database,'incidents')).key;const hours=Number($('collabHours').value);
  await set(ref(database,`incidents/${id}/meta`),{name,ownerUid:auth.currentUser.uid,active:true,createdAt:serverTimestamp(),expiresAt:Date.now()+hours*3600000-5000});
  await set(ref(database,`incidents/${id}/inviteToken`),token());
  showIncident(id);await listIncidents();notice('Incidente creado. Ya puedes copiar el enlace.');
 });
 $('collabCopy').onclick=action(async()=>{if(!$('collabLink').value)throw Error('No hay un enlace activo.');try{await navigator.clipboard.writeText($('collabLink').value);notice('Enlace copiado. Compártelo solo con tu equipo.');}catch{$('collabLink').select();notice('Selecciona y copia el enlace mostrado.');}});
 $('collabRotate').onclick=action(async()=>{await set(path('inviteToken'),token());notice('Enlace renovado. El anterior ya no admite nuevos registros; los registrados conservan su acceso.');});
 $('collabEnd').onclick=action(async()=>{if(confirm('¿Cerrar este incidente? Se detendrá la recepción de ubicaciones y reportes.')){await update(path('meta'),{active:false});await listIncidents();}});
 // Replace previous simulated operational entry points with the live panel.
 if($('v16Control'))$('v16Control').onclick=()=>window.openDrawer('panelCollaboration');
 if($('v16Tech'))$('v16Tech').onclick=()=>{window.openDrawer('panelCollaboration');notice('Crea o selecciona un incidente y abre su enlace en el teléfono del colaborador.');};
 onAuthStateChanged(auth,async user=>{
  const allowed=isCoordinator(user);$('collabLogin').hidden=allowed;$('collabControl').hidden=!allowed;
  if(!allowed){stopCoordinatorLocation();stopIncident?.();stopIncident=null;incident=null;clearMap();notice(user?'Esta cuenta no tiene acceso de coordinación. Usa la cuenta autorizada.':'Accede como coordinador para abrir un incidente.',!!user);return;}
  $('collabIdentity').textContent=user.email;notice('Sesión de coordinación iniciada.');
  try{await listIncidents();}catch(e){notice(errorText(e),true);}
 });
 window.addEventListener('cabina-map-ready',renderPersonnel);
 window.addEventListener('pagehide',()=>stopCoordinatorLocation());
 setInterval(renderPersonnel,15000);
}
async function stopSharing(message='Ubicación detenida. Se conserva la última posición registrada en coordinación.'){
 sharing=false;if(watcher!==null){navigator.geolocation.clearWatch(watcher);watcher=null;}
 if(memberReady&&auth.currentUser&&incidentId&&connected){void update(path('locations/'+auth.currentUser.uid),{active:false,clientUpdatedAt:Date.now()}).catch(()=>{});}
 if($('startLocation'))$('startLocation').disabled=!memberReady;
 if($('stopLocation'))$('stopLocation').disabled=true;
 notice(message);gpsNotice(message);
}
async function startSharing(){
 if(!navigator.geolocation)throw Error('El navegador no ofrece geolocalización.');
 if(!memberReady||!connected)throw Error('Completa el registro y verifica la conexión.');
 if(!active(incident))throw Error('El incidente ya cerró o venció.');
 const uid=auth.currentUser?.uid;if(!uid)throw Error('No existe una sesión de colaborador activa.');
 const target=path('locations/'+uid);
 sharing=true;lastSent=0;$('startLocation').disabled=true;$('stopLocation').disabled=false;notice('Solicitando permiso de ubicación…');gpsNotice('Esperando permiso y lectura GPS…');
 watcher=navigator.geolocation.watchPosition(async position=>{
  if(!sharing||!connected||sending||Date.now()-lastSent<15000)return;
  if(Date.now()-position.timestamp>60000)return;
  if(!active(incident)){await stopSharing('Incidente cerrado o vencido.');return;}
  sending=true;lastSent=Date.now();const {latitude:lat,longitude:lng,accuracy}=position.coords;
  try{await update(target,{lat,lng,accuracy,updatedAt:serverTimestamp(),clientUpdatedAt:Date.now(),active:true});notice(`Ubicación enviada a coordinación a las ${time(Date.now())}. Precisión ±${Math.round(accuracy)} m.`);gpsNotice(`GPS compartido · ${time(Date.now())} · precisión ±${Math.round(accuracy)} m.`);}
  catch(e){notice('No se pudo enviar esta lectura GPS. El seguimiento sigue activo y reintentará automáticamente.',true);gpsNotice('GPS activo; esperando recuperar conexión para actualizar.',true);}finally{sending=false;}
 },async e=>{if(e.code===1)await stopSharing('Permiso de ubicación denegado. Puedes habilitarlo en tu navegador; el registro y los reportes siguen disponibles.');else {notice('GPS sin lectura: '+e.message+'. No se ha confirmado una nueva ubicación.',true);gpsNotice('GPS sin lectura: '+e.message,true);}}, {enableHighAccuracy:true,maximumAge:10000,timeout:20000});
}
function mountMobile(){
 const params=new URLSearchParams(location.hash.slice(1));incidentId=params.get('incidente')||'';const invitation=params.get('invitacion')||'';
 if(!/^[A-Za-z0-9_-]{10,80}$/.test(incidentId)||!/^[a-f0-9]{64}$/.test(invitation)){notice('Enlace incompleto. Solicita a coordinación un enlace nuevo.',true);$('joinForm').hidden=true;return;}
 const activateMember=(name,restored=false)=>{
  memberReady=true;$('joinForm').hidden=true;$('memberControls').hidden=false;$('memberIdentity').textContent=name;
  $('startLocation').disabled=true;$('reportSend').disabled=true;
  notice(restored?'Sesión recuperada. Coordinación conserva tu última posición. Pulsa Compartir ubicación solo para reanudar lecturas nuevas.':'Registro confirmado. La ubicación permanece apagada hasta que pulses Compartir ubicación.');
  gpsNotice(restored?'Última posición conservada. GPS apagado hasta que pulses Compartir ubicación.':'GPS apagado. Pulsa Compartir ubicación y acepta el permiso. Enviar reporte no envía tu posición.');
  stopIncident?.();
  stopIncident=onValue(path('meta'),snap=>{
   incident=snap.val();$('incidentName').textContent=incident?.name||'Incidente';
   const ok=active(incident);
   $('startLocation').disabled=!ok||sharing;
   $('reportSend').disabled=!ok;
   if(!ok){memberReady=false;void stopSharing('Incidente cerrado o vencido.');}
  },e=>{memberReady=false;void stopSharing(errorText(e));});
 };
 $('joinForm').onsubmit=async e=>{
  e.preventDefault();$('joinButton').disabled=true;
  try{
   if(!$('locationConsent').checked)throw Error('Acepta compartir tus datos de registro con coordinación.');
   const name=$('memberName').value.trim(),phone=$('memberPhone').value.trim(),role=$('memberRole').value.trim();
   if(name.length<2||!/^[+0-9 ()-]{7,25}$/.test(phone))throw Error('Revisa tu nombre y teléfono.');
   await auth.authStateReady();
   if(!auth.currentUser)await signInAnonymously(auth);
   const user=auth.currentUser,target=path('members/'+user.uid);const old=await get(target);
   await set(target,{name,phone,role,inviteToken:old.val()?.inviteToken||invitation,joinedAt:old.val()?.joinedAt||serverTimestamp()});
   activateMember(name,false);
  }catch(e){notice(errorText(e),true);}finally{$('joinButton').disabled=false;}
 };
 $('startLocation').onclick=async()=>{if(sharing)return;try{await startSharing();}catch(e){notice(errorText(e),true);$('startLocation').disabled=false;}};
 $('stopLocation').onclick=action(()=>stopSharing());
 $('reportForm').onsubmit=async e=>{e.preventDefault();$('reportSend').disabled=true;try{if(!memberReady||!connected||!active(incident))throw Error('No hay conexión o el incidente ya no admite reportes.');await set(path('reports/'+auth.currentUser.uid),{status:$('memberStatus').value,detail:$('memberDetail').value.trim(),updatedAt:serverTimestamp()});notice('Reporte recibido por Firebase a las '+time(Date.now())+'. Reemplaza tu reporte anterior.');$('memberDetail').value='';}catch(e){notice(errorText(e),true);}finally{$('reportSend').disabled=!memberReady;}};
 void (async()=>{
  try{
   await auth.authStateReady();
   if(!auth.currentUser)return;
   const memberSnap=await get(path('members/'+auth.currentUser.uid));
   const member=memberSnap.val();
   if(member&&member.inviteToken===invitation)activateMember(member.name,true);
  }catch(e){/* Si no existe sesión previa, se mantiene el formulario de registro. */}
 })();
 window.addEventListener('pagehide',()=>{if(watcher!==null)navigator.geolocation.clearWatch(watcher);sharing=false;});
 window.addEventListener('pageshow',e=>{if(e.persisted){$('startLocation').disabled=!memberReady;$('stopLocation').disabled=true;notice('La página volvió a primer plano. Si el navegador pausó el GPS, pulsa Compartir ubicación para reanudar lecturas nuevas; coordinación conserva la última posición.');}});
 setInterval(()=>{if(memberReady&&!active(incident)){memberReady=false;void stopSharing('Incidente vencido.');$('reportSend').disabled=true;}},15000);
}
onValue(ref(database,'.info/connected'),s=>{
 const was=connected;connected=s.val()===true;
 if(mobile&&was&&!connected){notice('Sin conexión con Firebase. El GPS sigue activo y reanudará el envío automáticamente cuando vuelva Internet.',true);gpsNotice('GPS activo · sin conexión temporal; se conserva la última posición.',true);}
 if(mobile&&!was&&connected&&sharing){notice('Conexión recuperada. El seguimiento GPS continúa automáticamente.');gpsNotice('GPS activo · conexión recuperada; esperando próxima lectura.');}
 if(!mobile)renderPersonnel();
});
if(mobile)mountMobile();else mountControl();

/* Cabina SCI NaTech/HazMat V16 - núcleo operacional
   Capa incremental: conserva V15.7 y añade contexto geoespacial/meteo.
*/
(function(){
  'use strict';
  const WEBMAP_ID='674af1befcfd4ae7bfbefdff918ebaf8';
  const state={windDir:225,windSpeed:3.5,windUnit:'m/s',plume:null,windLine:null,sourceMarker:null};

  function el(id){return document.getElementById(id)}
  function num(id,fallback){const n=parseFloat(el(id)?.value);return Number.isFinite(n)?n:fallback}
  function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function incidentLatLng(){
    const lat=parseFloat(el('latPunto')?.value), lng=parseFloat(el('lonPunto')?.value);
    if(Number.isFinite(lat)&&Number.isFinite(lng)) return L.latLng(lat,lng);
    try { return map.getCenter(); } catch(e){ return L.latLng(-2.17,-79.9); }
  }
  function destination(origin,bearingDeg,distanceM){
    const R=6378137, br=bearingDeg*Math.PI/180, lat1=origin.lat*Math.PI/180, lon1=origin.lng*Math.PI/180, d=distanceM/R;
    return L.latLng(Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(br))*180/Math.PI,
      (lon1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(lat1),Math.cos(d)-Math.sin(lat1)*Math.sin(lat1+d*0)))*180/Math.PI);
  }
  function offset(origin,east,north){
    const d=Math.sqrt(east*east+north*north), b=Math.atan2(east,north)*180/Math.PI;
    return destination(origin,b,d);
  }
  function plumePolygon(origin,bearing,length,width){
    const a=bearing*Math.PI/180, ux=Math.sin(a), uy=Math.cos(a), px=Math.cos(a), py=-Math.sin(a);
    const pts=[]; const steps=28;
    for(let side of [1,-1]){
      const arr=[];
      for(let i=0;i<=steps;i++){
        const t=i/steps, along=length*t;
        const half=width*Math.sin(Math.PI*t)*0.5;
        arr.push(offset(origin,ux*along+px*half*side,uy*along+py*half*side));
      }
      if(side===1) pts.push(...arr); else pts.push(...arr.reverse());
    }
    return pts;
  }
  function drawWind(){
    if(!window.map||!window.L) return;
    const origin=incidentLatLng();
    state.windDir=num('v16WindDir',225)%360;
    state.windSpeed=num('v16WindSpeed',3.5);
    const len=Math.max(40,num('v16PlumeLength',300)), wid=Math.max(20,num('v16PlumeWidth',100));
    if(state.plume) map.removeLayer(state.plume);
    if(state.windLine) map.removeLayer(state.windLine);
    if(state.sourceMarker) map.removeLayer(state.sourceMarker);
    const pts=plumePolygon(origin,state.windDir,len,wid);
    state.plume=L.polygon(pts,{color:'#ff6060',weight:2,fillColor:'#ff6060',fillOpacity:.18,dashArray:'7,5'}).addTo(map)
      .bindPopup('<b>Pluma táctica V16</b><br>Representación operacional editable; no es resultado ALOHA validado.');
    const tip=destination(origin,state.windDir,Math.min(len,180));
    state.windLine=L.polyline([origin,tip],{color:'#31d7ff',weight:4,opacity:.9}).addTo(map)
      .bindTooltip('Viento '+state.windDir+'° · '+state.windSpeed+' '+esc(el('v16WindUnit')?.value||'m/s'));
    state.sourceMarker=L.circleMarker(origin,{radius:7,color:'#fff',weight:2,fillColor:'#ff6060',fillOpacity:1}).addTo(map)
      .bindTooltip('Fuente / punto de referencia');
    const status=el('v16MeteoStatus');
    if(status) status.innerHTML='<b>Viento operativo:</b> '+state.windDir+'° · '+state.windSpeed+' '+esc(el('v16WindUnit')?.value||'m/s')+
      '<br><small>Pluma táctica: '+len+' m × '+wid+' m. No sustituye ERG/ALOHA/monitoreo.</small>';
  }
  function clearWind(){
    [state.plume,state.windLine,state.sourceMarker].forEach(x=>{if(x&&window.map)map.removeLayer(x)});
    state.plume=state.windLine=state.sourceMarker=null;
  }
  function openArcGIS(){
    window.open('https://www.arcgis.com/apps/mapviewer/index.html?webmap='+WEBMAP_ID,'_blank','noopener');
  }
  function openArcGISEmbed(){
    const panel=el('v16ArcFrame');
    if(!panel)return;
    panel.src='https://www.arcgis.com/apps/mapviewer/index.html?webmap='+WEBMAP_ID;
    panel.closest('.v16-arc-wrap').classList.add('open');
  }
  function closeArcGIS(){document.querySelector('.v16-arc-wrap')?.classList.remove('open')}
  async function fetchNasaPower(){
    const p=incidentLatLng(), box=el('v16MeteoStatus');
    if(box) box.innerHTML='<b>NASA POWER:</b> consultando coordenada del incidente…';
    const now=new Date(), end=new Date(now.getTime()-24*3600*1000);
    const y=end.getUTCFullYear(),m=String(end.getUTCMonth()+1).padStart(2,'0'),d=String(end.getUTCDate()).padStart(2,'0'),date=''+y+m+d;
    const url='https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=WS10M,WD10M,T2M,RH2M,PS&community=RE&longitude='+p.lng+'&latitude='+p.lat+'&start='+date+'&end='+date+'&format=JSON';
    try{
      const r=await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); const j=await r.json();
      const prm=j?.properties?.parameter||{};
      const keys=Object.keys(prm.WS10M||{}).sort(); const k=keys[keys.length-1];
      if(!k) throw new Error('Sin datos horarios');
      const ws=prm.WS10M[k], wd=prm.WD10M?.[k], t=prm.T2M?.[k], rh=prm.RH2M?.[k], ps=prm.PS?.[k];
      if(Number.isFinite(ws)) el('v16WindSpeed').value=ws;
      if(Number.isFinite(wd)) el('v16WindDir').value=wd;
      drawWind();
      box.innerHTML='<b>NASA POWER · último horario disponible</b><br>Viento: '+esc(wd)+'° · '+esc(ws)+' m/s · T: '+esc(t)+' °C · HR: '+esc(rh)+' % · P: '+esc(ps)+' kPa'+
        '<br><small>Dato regional/modelado. Para operación MATPEL priorizar medición local cuando exista.</small>';
    }catch(err){
      box.innerHTML='<b>NASA POWER:</b> no se pudo consultar ahora. Mantenga entrada manual. <small>'+esc(err.message)+'</small>';
    }
  }
  function setOsm(){
    if(!window.map)return;
    if(window.__v16Base) map.removeLayer(window.__v16Base);
    window.__v16Base=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    window.__v16Base.bringToBack();
  }
  function setEsri(){
    if(!window.map)return;
    if(window.__v16Base) map.removeLayer(window.__v16Base);
    window.__v16Base=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'}).addTo(map);
    window.__v16Base.bringToBack();
  }
  function inject(){
    document.title='Cabina SCI NaTech/HazMat V16 Operacional';
    const h=document.querySelector('h1'); if(h)h.textContent='Cabina SCI NaTech/HazMat V16 Operacional';
    const sub=document.querySelector('.brand .sub'); if(sub)sub.textContent='SCI + MATPEL + contexto geoespacial + meteorología + vigilancia externa.';
    const top=document.querySelector('.top-actions');
    if(top&&!el('v16Btn')){
      const b=document.createElement('button');b.id='v16Btn';b.className='cyan';b.textContent='V16 Operacional';b.onclick=()=>window.openDrawer?openDrawer('panelV16'):null;top.appendChild(b);
    }
    const app=document.querySelector('.app');
    const aside=document.createElement('aside');aside.className='drawer';aside.id='panelV16';
    aside.innerHTML='<div class="drawer-head"><h2>V16 · Contexto operacional</h2><button class="secondary" onclick="closeDrawers()">Cerrar</button></div>'+
      '<div class="v16-badge">CAPAS Y FUENTES</div><div class="grid2"><button class="secondary" id="v16OSM">OSM</button><button class="secondary" id="v16Esri">Satélite Esri</button></div>'+
      '<div class="mini-title">ArcGIS WebMap operacional</div><div class="grid2"><button class="cyan" id="v16ArcIn">Ver dentro</button><button class="secondary" id="v16ArcOut">Abrir ArcGIS</button></div>'+
      '<div class="v16-badge">METEOROLOGÍA Y VIENTO</div><div class="grid2"><div><div class="mini-title">Dirección °</div><input id="v16WindDir" type="number" value="225" min="0" max="359"></div><div><div class="mini-title">Velocidad</div><input id="v16WindSpeed" type="number" value="3.5" step=".1"></div></div>'+
      '<div class="grid2"><div><div class="mini-title">Unidad</div><select id="v16WindUnit"><option>m/s</option><option>km/h</option><option>kn</option><option>mph</option></select></div><div><div class="mini-title">Fuente</div><select><option>Manual / campo</option><option>NASA POWER</option><option>Estación oficial</option><option>Anemómetro local</option></select></div></div>'+
      '<button class="purple v16-full" id="v16Nasa">Consultar NASA POWER</button><div id="v16MeteoStatus" class="v16-status">Sin consulta meteorológica. Puede trabajar manualmente.</div>'+
      '<div class="v16-badge">PLUMA TÁCTICA</div><div class="grid2"><div><div class="mini-title">Longitud m</div><input id="v16PlumeLength" type="number" value="300"></div><div><div class="mini-title">Ancho m</div><input id="v16PlumeWidth" type="number" value="100"></div></div>'+
      '<div class="grid2"><button class="red" id="v16Draw">Dibujar / actualizar</button><button class="secondary" id="v16Clear">Quitar pluma</button></div>'+
      '<div class="v16-warning"><b>Clasificación:</b> CROQUIS TÁCTICO. Esta geometría no representa todavía un cálculo ERG/ALOHA validado.</div>'+
      '<div class="v16-badge">PRÓXIMAS CONEXIONES</div><div class="v16-source-grid"><span>ERG 2024 PHMSA</span><span>Modelo dispersión</span><span>Alertas Ecuador</span><span>INAMHI</span><span>NASA FIRMS</span><span>Rayos</span><span>InSAR</span><span>LiDAR/DEM</span><span>GPS unidades</span></div>';
    app.appendChild(aside);
    const wrap=document.createElement('div');wrap.className='v16-arc-wrap';wrap.innerHTML='<div class="v16-arc-head"><b>ArcGIS WebMap · '+WEBMAP_ID+'</b><button class="secondary" id="v16ArcClose">Cerrar</button></div><iframe id="v16ArcFrame" title="ArcGIS WebMap" loading="lazy"></iframe>';app.appendChild(wrap);
    el('v16OSM').onclick=setOsm;el('v16Esri').onclick=setEsri;el('v16ArcIn').onclick=openArcGISEmbed;el('v16ArcOut').onclick=openArcGIS;el('v16ArcClose').onclick=closeArcGIS;
    el('v16Nasa').onclick=fetchNasaPower;el('v16Draw').onclick=drawWind;el('v16Clear').onclick=clearWind;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
  window.CabinaV16={drawWind,clearWind,fetchNasaPower,openArcGISEmbed};
})();
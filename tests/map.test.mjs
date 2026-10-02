import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../collaboration.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').split("onValue(ref(database,'.info/connected')")[0];
function fixture(){
 const elements=new Map();
 const node=()=>({textContent:'',classList:{toggle(){}},children:[],append(...n){this.children.push(...n)},replaceChildren(){this.children=[]}});
 const map={removeLayer(){},invalidateSize(){},fitBounds(){this.fits=(this.fits||0)+1},getSize(){return {x:1200}}};
 const user={uid:'owner',email:'dcoellom2@unemi.edu.ec',emailVerified:true,isAnonymous:false,displayName:'Daniel'};
 const ctx={app:{},getAuth:()=>({currentUser:user}),document:{body:{dataset:{}},getElementById(id){if(!elements.has(id))elements.set(id,node());return elements.get(id)},createElement:node},window:{map,L:{}},Date,Map,Set,URL,URLSearchParams,console,navigator:{geolocation:{watchPosition(success){ctx.success=success;return 7},clearWatch(){ctx.stopped=true}}}};
 ctx.L={layerGroup:()=>({addTo(){return this},removeLayer(){}}),circleMarker:(p)=>({p,addTo(){return this},setLatLng(p){this.p=p},setStyle(){},unbindTooltip(){},bindTooltip(n,options){this.label=n.textContent;this.options=options},bindPopup(){},getLatLng(){return this.p}}),latLngBounds:p=>p};
 runInNewContext(source,ctx);return ctx;
}
test('marcadores sobreviven a reseleccionar incidente y recrear el mapa',()=>{
 const ctx=fixture();
 runInNewContext(`connected=true;incident={meta:{active:true,expiresAt:Date.now()+60000},members:{mayra:{name:'Mayra',phone:'0000000'}},locations:{mayra:{lat:-2.1,lng:-79.8,accuracy:12,updatedAt:Date.now()}}};renderPersonnel();`,ctx);
 assert.equal(runInNewContext('markers.size',ctx),1);
 assert.match(runInNewContext("markers.get('mayra').label",ctx),/^Mayra · GPS reciente$/);
 assert.equal(runInNewContext("markers.get('mayra').options.permanent",ctx),true);
 runInNewContext('clearMap();renderPersonnel();',ctx);
 assert.equal(runInNewContext('markers.size',ctx),1);
 assert.ok(runInNewContext('layer',ctx));
 ctx.window.map={...ctx.window.map};runInNewContext('renderPersonnel()',ctx);
 assert.equal(runInNewContext('mapInstance===window.map',ctx),true);
});
test('un reporte sin GPS no produce marcador; detener coordinador elimina solo su marcador',()=>{
 const ctx=fixture();
 runInNewContext(`connected=true;incident={meta:{active:true,expiresAt:Date.now()+60000},members:{mayra:{name:'Mayra'}},reports:{mayra:{status:'ESTOY OK',detail:'En sitio'}}};renderPersonnel();`,ctx);
 assert.equal(runInNewContext('markers.size',ctx),0);
 runInNewContext('startCoordinatorLocation()',ctx);
 ctx.success({timestamp:Date.now(),coords:{latitude:-2,longitude:-79,accuracy:20}});
 assert.match(runInNewContext("markers.get('@coordinator').label",ctx),/Daniel \(coordinador\)/);
 runInNewContext('stopCoordinatorLocation()',ctx);
 assert.equal(runInNewContext('markers.size',ctx),0);
 ctx.success({timestamp:Date.now(),coords:{latitude:-2,longitude:-79,accuracy:20}});
 assert.equal(runInNewContext('coordinatorPosition',ctx),null);
});

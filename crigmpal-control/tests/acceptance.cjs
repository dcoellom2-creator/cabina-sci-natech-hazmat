const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const C=require('../assets/realization-core.js'),event=JSON.parse(fs.readFileSync(__dirname+'/../events-v142.json')).event;
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name)}
const first=C.makeDraft(event,0),second=C.makeDraft(event,1),committed=C.commitDraft(first,null,1000,'A',1);
test('draft is not public state',()=>assert.equal(C.validState(first,event),false));
test('TAKE creates committed public state',()=>assert.equal(C.validState(committed,event),true));
test('PREVIEW does not mutate committed state',()=>{const before=JSON.stringify(committed);C.makeDraft(event,5);assert.equal(JSON.stringify(committed),before)});
test('reject legacy state',()=>assert.equal(C.validState({onair:true,sceneIndex:0},event),false));
test('reject other event',()=>assert.equal(C.validState({...committed,eventId:'other'},event),false));
test('reject mismatched scene id',()=>assert.equal(C.validState({...committed,sceneId:'old'},event),false));
test('exclude absent participant and retarget visible person',()=>{const i=event.productionScenes.findIndex(s=>s.layout==='trio');const d=C.makeDraft(event,i,{hidden:['xavier']});assert.ok(!d.participants.includes('xavier'));assert.ok(d.participants.includes(d.targetSpeakerId))});
test('one person conversation remains one person',()=>assert.equal(C.makeDraft(event,0,{layout:'trio',participants:['daniel']}).participants.length,1));
test('two person conversation remains two people',()=>assert.equal(C.makeDraft(event,0,{layout:'trio',participants:['daniel','camilo']}).participants.length,2));
test('moderator uses event identity',()=>assert.deepEqual(C.makeDraft(event,0,{layout:'moderator'}).participants,['daniel']));
test('all hidden gives empty draft',()=>assert.equal(C.makeDraft(event,0,{hidden:Object.keys(event.speakers)}).participants.length,0));
test('pause remains valid without previous TAKE',()=>assert.equal(C.validState(C.holdState(event,null,2000,'A',2),event),true));
test('pause has no participants and is not onair',()=>{let s=C.holdState(event,committed,2000,'A',2);assert.equal(s.paused,true);assert.equal(s.onair,false);assert.deepEqual(s.participants,[])});
test('return from pause requires new TAKE',()=>{let pause=C.holdState(event,committed,2000,'A',2);C.makeDraft(event,1);assert.equal(pause.paused,true);assert.equal(C.commitDraft(second,pause,3000,'A',3).paused,false)});
test('block timer preserved inside block',()=>{let s=C.commitDraft({...second,segmentId:committed.segmentId},committed,2000,'A',2);assert.equal(s.segmentStartedAt,1000)});
test('new block starts timer',()=>assert.equal(C.commitDraft({...second,segmentId:'different'},committed,2000,'A',2).segmentStartedAt,2000));
test('reject stale packets',()=>assert.equal(C.acceptNewer({...committed,ts:999},committed),false));
test('accept same millisecond higher sequence',()=>assert.equal(C.acceptNewer({...committed,seq:2},committed),true));
test('allow public HTTPS tool',()=>assert.equal(C.safeUrl('https://example.org/map'),'https://example.org/map'));
test('reject script HTTP and credential URLs',()=>['javascript:alert(1)','http://example.org','https://user:pass@example.org'].forEach(u=>assert.equal(C.safeUrl(u),'')));
test('all 42 scenes have valid references',()=>{assert.equal(event.productionScenes.length,42);for(const s of event.productionScenes){assert.ok(event.blocks.some(b=>b.id===s.blockId));assert.ok(event.speakers[s.leadSpeaker]);for(const p of s.participants)assert.ok(event.speakers[p])}});
test('two active original decks total 20 slides',()=>assert.equal(['piloto-geotecnia','piloto-comunidad'].reduce((n,k)=>n+event.presentationDecks[k].slides.length,0),20));
for(const file of ['program-v142.html','panelist-live-v142.html']){const html=fs.readFileSync(__dirname+'/../'+file,'utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);}
test('current page scripts compile',()=>new vm.Script(fs.readFileSync(__dirname+'/../assets/realization-control.js','utf8')));
let nodes={},messages=[],saved=new Map(),listeners={},intervals=[];
function el(id){return nodes[id]||(nodes[id]={textContent:'',innerHTML:'',style:{},disabled:false,checked:false,options:[],contentWindow:{postMessage(){}},replaceChildren(){},classList:{add(){},remove(){}},appendChild(){},querySelector(){return null}})}
const ctx=vm.createContext({window:{PRCore:C,addEventListener(){}},document:{getElementById:el,addEventListener(){},querySelectorAll(){return[]}},location:{search:'',origin:'https://example.invalid'},URLSearchParams,Date,JSON,Math,Set,console,localStorage:{setItem(k,v){saved.set(k,v)}},setInterval(fn){intervals.push(fn);return 1},confirm(){return true}});
vm.runInContext(fs.readFileSync(__dirname+'/../assets/realization-control.js','utf8'),ctx);
ctx.eventInput=event;ctx.capture=(type,value)=>messages.push({type,value});
vm.runInContext(`event=eventInput;data={event,realtime:{topicBase:'TEST',broker:'none'}};day='Día 1';sceneOptions=()=>{};renderPeople=()=>{};transport=(type,value)=>{capture(type,value);return true};ready=true;`,ctx);
test('opening controller sends no state',()=>assert.equal(messages.length,0));
test('selection before claim sends nothing',()=>{vm.runInContext('selectScene(2)',ctx);assert.equal(messages.length,0)});
test('claim changes only control ownership',()=>{vm.runInContext('claim()',ctx);assert.equal(messages.filter(m=>m.type==='state').length,0)});
test('TAKE publishes one state',()=>{vm.runInContext('take()',ctx);assert.equal(messages.filter(m=>m.type==='state').length,1)});
test('selection after TAKE does not change public state',()=>{const n=messages.length,last=JSON.stringify(messages.at(-1));vm.runInContext('selectScene(4)',ctx);assert.equal(messages.length,n);assert.equal(JSON.stringify(messages.at(-1)),last)});
test('participant change stays in preview',()=>{const n=messages.length;vm.runInContext("hidden.add('daniel');sendPreview()",ctx);assert.equal(messages.length,n)});
test('TAKE blocked when no visible participants',()=>{const n=messages.length;vm.runInContext('take()',ctx);assert.equal(messages.length,n)});
test('pause publishes branded hold state',()=>{vm.runInContext('pause()',ctx);assert.equal(messages.at(-1).value.paused,true)});
test('preparing return does not unpause',()=>{const n=messages.length;vm.runInContext("hidden.clear();selectScene(0)",ctx);assert.equal(messages.length,n);assert.equal(messages.at(-1).value.paused,true)});
test('TAKE explicitly resumes',()=>{vm.runInContext('take()',ctx);assert.equal(messages.at(-1).value.paused,false)});
test('disconnected controller cannot publish',()=>{const n=messages.length;vm.runInContext('ready=false;take();pause()',ctx);assert.equal(messages.length,n)});
console.log(`${count} acceptance checks passed; all transports mocked, no public channel used.`);

// Regressions from the moderator walkthrough.
test('solo host resets stale conversation participants',()=>{vm.runInContext("ready=true;hidden.clear();layout='trio';customPeople=['kervin','patricio'];hidden=new Set(Object.keys(event.speakers).filter(id=>id!==event.moderatorId));setLayout('moderator')",ctx);const d=vm.runInContext('draft()',ctx);assert.deepEqual(Array.from(d.participants),['daniel'])});
test('Kervin filter includes his optional technical question',()=>assert.ok(event.productionScenes.some(s=>s.id==='piloto-q02'&&s.relatedSpeakers.includes('kervin'))));
const panelHtml=fs.readFileSync(__dirname+'/../panelist-live-v142.html','utf8'),panelScript=[...panelHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
const panelNodes={};const noop=()=>{};const drawingContext={drawImage:noop,fillRect:noop};
function panelEl(id){return panelNodes[id]||(panelNodes[id]={value:'',textContent:'',innerHTML:'',className:'',classList:{add:noop,remove:noop,toggle:noop},firstElementChild:{},contentWindow:{postMessage:noop},replaceChildren:noop,appendChild:noop,append:noop,setAttribute:noop,getContext:()=>drawingContext,getBoundingClientRect:()=>({width:800,height:500})})}
const panelContext=vm.createContext({document:{getElementById:panelEl,querySelector:()=>panelEl('brand'),querySelectorAll:()=>[],createElement:()=>panelEl('temp'),addEventListener:noop},window:{addEventListener:noop},location:{search:'?panelista=daniel&ensayo=1&sala=check',origin:'https://example.invalid'},URLSearchParams,Date,Math,JSON,console,devicePixelRatio:1,setInterval:noop,setTimeout:noop,localStorage:{getItem:()=>null},BroadcastChannel:class{postMessage(){}},fetch:async()=>({json:async()=>({event,realtime:{topicBase:'TEST'}})})});
vm.runInContext(panelScript,panelContext);
(async()=>{await vm.runInContext('init()',panelContext);assert.equal(panelNodes.speakerName.textContent,event.speakers.daniel.name);assert.equal(panelNodes.brand.textContent,'Promter Risk · Moderador');assert.ok(panelNodes.hiloTrack.innerHTML);console.log('PASS moderator initializes, renders identity and agenda in isolated rehearsal');})().catch(e=>{console.error(e);process.exitCode=1});


// Whiteboard owner must be independent of the current question target.
const drawingA='data:image/jpeg;base64,/9j/AQ==',drawingB='data:image/jpeg;base64,/9j/Ag==';
ctx.drawingA=drawingA;ctx.drawingB=drawingB;
test('moderator board is bound to the drawer instead of Xavier',()=>{
 vm.runInContext("ready=true;owns=true;hidden.clear();filter='all';selectScene(event.productionScenes.findIndex(s=>s.id==='piloto-q09'));take();boardImages.daniel=drawingA",ctx);
 const n=messages.filter(m=>m.type==='state').length;
 vm.runInContext("panelistCommand({type:'SHOW_BOARD',speakerId:'daniel',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);
 const d=vm.runInContext('draft()',ctx);assert.equal(d.boardSpeakerId,'daniel');assert.equal(d.targetSpeakerId,'xavier');assert.equal(d.boardImage,drawingA);assert.equal(messages.filter(m=>m.type==='state').length,n);
});
test('TAKE commits the exact board snapshot',()=>{vm.runInContext('take()',ctx);const state=messages.filter(m=>m.type==='state').at(-1).value;assert.equal(state.boardSpeakerId,'daniel');assert.equal(state.boardImage,drawingA);assert.equal(state.surface,'board')});
test('later drawing receipt stays in preview and cannot replace committed drawing',()=>{const n=messages.filter(m=>m.type==='state').length;vm.runInContext("incoming('board/daniel',{speakerId:'daniel',data:drawingB,updatedAt:Date.now()})",ctx);assert.equal(messages.filter(m=>m.type==='state').length,n);assert.equal(vm.runInContext('live.boardImage',ctx),drawingA);assert.equal(vm.runInContext('draft().boardImage',ctx),drawingB)});
test('second question and Camilo owner survive board preparation',()=>{vm.runInContext("selectScene(event.productionScenes.findIndex(s=>s.id==='piloto-q17'));qi=1;take();boardImages.camilo=drawingB;panelistCommand({type:'SHOW_BOARD',speakerId:'camilo',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);const d=vm.runInContext('draft()',ctx);assert.equal(d.questionIndex,1);assert.equal(d.boardSpeakerId,'camilo');assert.equal(d.targetSpeakerId,'camilo')});
test('return to scene clears board without automatic emission',()=>{vm.runInContext('take()',ctx);const n=messages.filter(m=>m.type==='state').length;vm.runInContext("panelistCommand({type:'SHOW_SCENE',speakerId:'camilo',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);const d=vm.runInContext('draft()',ctx);assert.equal(d.surface,'scene');assert.equal(d.boardSpeakerId,'');assert.equal(d.questionIndex,1);assert.equal(messages.filter(m=>m.type==='state').length,n)});
test('non-visible sender cannot prepare board',()=>{const n=messages.filter(m=>m.type==='state').length;vm.runInContext("panelistCommand({type:'SHOW_BOARD',speakerId:'kervin',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);assert.equal(messages.at(-1).value.reason,'locked');assert.equal(messages.filter(m=>m.type==='state').length,n)});
test('missing board is refused explicitly',()=>{vm.runInContext("delete boardImages.camilo;panelistCommand({type:'SHOW_BOARD',speakerId:'camilo',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);assert.equal(messages.at(-1).value.reason,'no-board')});
test('TAKE refuses blank board',()=>{const n=messages.filter(m=>m.type==='state').length;vm.runInContext("surface='board';boardSpeakerId='camilo';take()",ctx);assert.equal(messages.filter(m=>m.type==='state').length,n)});
test('invalid image data rejected by draft model',()=>{assert.equal(C.makeDraft(event,0,{boardSpeakerId:'daniel',boardImage:'data:text/html,test'}).boardImage,'')});
console.log('Whiteboard regression checks passed without network.');


// Direct facilitator mode: explicit grant, eligible active participant, pause wins.
test('direct show bypasses TAKE and keeps the clock and pending preview',()=>{
 vm.runInContext("ready=true;owns=true;hidden.clear();$('allowSlides').checked=true;selectScene(event.productionScenes.findIndex(s=>s.id==='piloto-q09'));take();boardImages.daniel=drawingA;selectScene(0)",ctx);
 const before=vm.runInContext('live.sceneStartedAt',ctx),pending=vm.runInContext('idx',ctx);
 vm.runInContext("panelistCommand({type:'SHOW_BOARD',speakerId:'daniel',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);
 assert.equal(vm.runInContext('live.surface',ctx),'board');assert.equal(vm.runInContext('live.sceneStartedAt',ctx),before);assert.equal(vm.runInContext('idx',ctx),pending);
});
test('drawing updates live while direct grant is active',()=>{vm.runInContext("incoming('board/daniel',{speakerId:'daniel',data:drawingB,updatedAt:Date.now()})",ctx);assert.equal(vm.runInContext('live.boardImage',ctx),drawingB)});
test('direct hide returns without TAKE',()=>{vm.runInContext("panelistCommand({type:'SHOW_SCENE',speakerId:'daniel',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);assert.equal(vm.runInContext('live.surface',ctx),'scene');assert.equal(vm.runInContext('live.boardImage',ctx),'')});
test('revoking permission freezes the public drawing',()=>{vm.runInContext("panelistCommand({type:'SHOW_BOARD',speakerId:'daniel',sceneIndex:live.sceneIndex,updatedAt:Date.now()});$('allowSlides').checked=false",ctx);const old=vm.runInContext('live.boardImage',ctx);vm.runInContext("incoming('board/daniel',{speakerId:'daniel',data:drawingA,updatedAt:Date.now()})",ctx);assert.equal(vm.runInContext('live.boardImage',ctx),old)});
test('revoked hide request waits in preview',()=>{vm.runInContext("panelistCommand({type:'SHOW_SCENE',speakerId:'daniel',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);assert.equal(vm.runInContext('live.surface',ctx),'board');assert.equal(messages.at(-1).value.reason,'preview')});
test('PAUSE prevents all direct board updates and show commands',()=>{vm.runInContext("$('allowSlides').checked=true;pause()",ctx);const n=messages.filter(m=>m.type==='state').length;vm.runInContext("incoming('board/daniel',{speakerId:'daniel',data:drawingB,updatedAt:Date.now()});panelistCommand({type:'SHOW_BOARD',speakerId:'daniel',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);assert.equal(vm.runInContext('live.paused',ctx),true);assert.equal(messages.filter(m=>m.type==='state').length,n)});
test('a participant not in turn cannot take over the board',()=>{vm.runInContext("selectScene(event.productionScenes.findIndex(s=>s.id==='piloto-q09'));take();panelistCommand({type:'SHOW_BOARD',speakerId:'camilo',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);assert.equal(messages.at(-1).value.reason,'locked')});
test('stale drawing cannot stream to the public',()=>{vm.runInContext("panelistCommand({type:'SHOW_BOARD',speakerId:'daniel',sceneIndex:live.sceneIndex,updatedAt:Date.now()})",ctx);const old=vm.runInContext('live.boardImage',ctx);vm.runInContext("incoming('board/daniel',{speakerId:'daniel',data:drawingA,updatedAt:Date.now()-60000})",ctx);assert.equal(vm.runInContext('live.boardImage',ctx),old)});
console.log('Direct facilitator mode checks passed.');

(function(root){
  'use strict';
  function safeUrl(value){try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch(_){return ''}}
  function makeDraft(event,index,options={}){
    const scenes=event.productionScenes||[],i=Math.max(0,Math.min(scenes.length-1,Number(index)||0)),sc=scenes[i]||{};
    const hidden=new Set(options.hidden||[]),available=Object.keys(event.speakers||{}).filter(id=>!hidden.has(id));
    const layout=options.layout||sc.layout||'question';
    let participants=(options.participants||sc.participants||[sc.leadSpeaker||event.moderatorId]).filter(id=>available.includes(id));
    if(layout==='moderator')participants=available.includes(event.moderatorId)?[event.moderatorId]:[];
    if(layout==='trio')participants=participants.slice(0,3);
    const flow=sc.questionFlow||[],qi=Math.max(0,Math.min(flow.length-1,Number(options.questionIndex)||0)),q=flow[qi]||{};
    const speaker=participants.includes(sc.leadSpeaker)?sc.leadSpeaker:(participants[0]||event.moderatorId);
    if(['tool','presentation','fullspeaker'].includes(layout))participants=participants.includes(speaker)?[speaker]:[];
    return {protocol:2,eventId:event.id,sceneIndex:i,sceneId:sc.id,speakerId:speaker,participants,layoutOverride:layout,
      questionIndex:qi,targetSpeakerId:participants.includes(q.to)?q.to:speaker,question:options.question||q.prompt||sc.question||'',
      sceneTitle:options.title||sc.title||'',producerCue:sc.producerCue||'',transition:q.transition||sc.bridge||'',
      blockId:sc.blockId||'',segmentId:sc.segmentId||'',segmentTitle:sc.segmentTitle||'',
      segmentDurationSec:Number(sc.segmentDurationSec)||0,durationSec:Number(sc.durationSec)||90,
      questionDurationSec:Number(q.durationSec)||90,questionCount:flow.length,
      scenePosition:scenes.filter(s=>s.segmentId===sc.segmentId).findIndex(s=>s.id===sc.id)+1,
      segmentSceneCount:scenes.filter(s=>s.segmentId===sc.segmentId).length,
      surface:options.surface||'scene',externalUrl:safeUrl(options.externalUrl),
      onair:false,black:false,paused:false,alert:'',hiddenParticipants:[...hidden]};
  }
  function validState(st,event){return !!(st&&st.protocol===2&&st.eventId===event.id&&st.committed===true&&Number.isFinite(st.ts)&&(st.paused||((event.productionScenes||[])[st.sceneIndex]?.id===st.sceneId)))}
  function commitDraft(draft,previous,now,sessionId,seq){
    const sameBlock=previous&&!previous.paused&&previous.segmentId===draft.segmentId;
    return {...draft,committed:true,onair:true,paused:false,black:false,ts:now,sessionId,seq,
      sceneStartedAt:now,questionStartedAt:now,segmentStartedAt:sameBlock?previous.segmentStartedAt:now};
  }
  function holdState(event,previous,now,sessionId,seq){return {...(previous||{}),protocol:2,eventId:event.id,committed:true,onair:false,paused:true,black:false,alert:'',ts:now,sessionId,seq,participants:[]}}
  function acceptNewer(incoming,current){return !current||incoming.ts>current.ts||(incoming.ts===current.ts&&incoming.sessionId===current.sessionId&&Number(incoming.seq)>Number(current.seq))}
  const api={safeUrl,makeDraft,validState,commitDraft,holdState,acceptNewer};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PRCore=api;
})(typeof window!=='undefined'?window:this);

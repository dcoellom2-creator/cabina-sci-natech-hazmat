import { app, database } from "../firebase-config.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { ref, set, update, onValue, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const auth=getAuth(app);
await setPersistence(auth,browserLocalPersistence);
const ADMIN_EMAIL="dcoellom2@unemi.edu.ec";
const adminOK=u=>!!u&&u.email===ADMIN_EMAIL&&u.emailVerified;

async function ensureAnon(){ if(!auth.currentUser) await signInAnonymously(auth); return auth.currentUser; }
const base=(eventId)=>"promterRisk/events/"+eventId;
const rState=(eventId)=>ref(database,base(eventId)+"/state");
const rClients=(eventId)=>ref(database,base(eventId)+"/clients");
const rBoards=(eventId)=>ref(database,base(eventId)+"/boards");

window.PRFB={
  auth,
  async loginAdmin(){
    const provider=new GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    const result=await signInWithPopup(auth,provider);
    if(!adminOK(result.user)) throw new Error("Cuenta no autorizada para administrar Promter Risk.");
    return result.user;
  },
  watchAdminAuth(cb){ return onAuthStateChanged(auth,u=>cb({user:u,authorized:adminOK(u)})); },
  async setState(eventId,patch){
    if(!adminOK(auth.currentUser)) throw new Error("Inicia sesión con la cuenta administradora.");
    await update(rState(eventId),{...patch,updatedAt:Date.now()});
  },
  watchState(eventId,cb){ return onValue(rState(eventId),s=>cb(s.val()||{})); },
  async connectPanelist(eventId,speakerId,handlers={}){
    const u=await ensureAnon();
    const cr=ref(database,base(eventId)+"/clients/"+u.uid);
    await set(cr,{speakerId,role:"panelist",online:true,updatedAt:Date.now()});
    onDisconnect(cr).update({online:false,updatedAt:serverTimestamp()});
    const unState=onValue(rState(eventId),s=>handlers.onState?.(s.val()||{}));
    handlers.onConnected?.({uid:u.uid});
    return {uid:u.uid,unsubscribe(){unState();}};
  },
  async setPanelistSpeaker(eventId,speakerId){
    const u=await ensureAnon();
    await update(ref(database,base(eventId)+"/clients/"+u.uid),{speakerId,online:true,updatedAt:Date.now()});
  },
  async sendBoard(eventId,speakerId,data){
    const u=await ensureAnon();
    await set(ref(database,base(eventId)+"/boards/"+u.uid),{speakerId,data,updatedAt:Date.now()});
  },
  watchClients(eventId,cb){ return onValue(rClients(eventId),s=>cb(s.val()||{})); },
  watchBoards(eventId,cb){ return onValue(rBoards(eventId),s=>cb(s.val()||{})); },
  async initProgram(eventId,handlers={}){
    await ensureAnon();
    const a=onValue(rState(eventId),s=>handlers.onState?.(s.val()||{}));
    const b=onValue(rBoards(eventId),s=>handlers.onBoards?.(s.val()||{}));
    handlers.onConnected?.({uid:auth.currentUser.uid});
    return ()=>{a();b();};
  }
};
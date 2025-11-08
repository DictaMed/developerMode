/* DictaMed – PWA ready */
const CONFIG={normal:"https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode",test:"https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed"};
const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
const toast=(m,t="info")=>{const d=Object.assign(document.createElement("div"),{className:`toast ${t}`,textContent:m});document.body.appendChild(d);setTimeout(()=>d.remove(),4000);};

/* Tabs */
function switchTab(id){$$(".tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));$$(".tab-content").forEach(c=>c.classList.toggle("active",c.id===id));localStorage.setItem("tab",id);}
$$(".tab-btn").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
switchTab(localStorage.getItem("tab")||"mode-normal");

/* Counters */
$$("input[maxlength],textarea").forEach(el=>{const c=el.parentElement.querySelector(".counter");const upd=()=>c.textContent=`${el.value.length}/${el.maxLength||"∞"}`;el.addEventListener("input",upd);upd();});

/* Recorder */
class Recorder{
  constructor(section){
    this.s=section;this.st=section.querySelector(".status-badge");this.t=section.querySelector(".timer");
    this.btnR=section.querySelector(".btn-record");this.btnP=section.querySelector(".btn-pause");this.btnS=section.querySelector(".btn-stop");this.btnD=section.querySelector(".btn-delete");this.a=section.querySelector("audio");
    this.max=+section.dataset.max||120;this.ch=[];this.time=0;this.iv=null;
    this.btnR.addEventListener("click",()=>this.start());this.btnP.addEventListener("click",()=>this.togglePause());this.btnS.addEventListener("click",()=>this.stop());this.btnD.addEventListener("click",()=>this.reset());
  }
  async start(){
    try{
      this.stream=await navigator.mediaDevices.getUserMedia({audio:{sampleRate:44100,channelCount:1}});
      this.rec=new MediaRecorder(this.stream);this.rec.ondataavailable=e=>this.ch.push(e.data);
      this.rec.onstop=()=>{this.blob=new Blob(this.ch,{type:"audio/webm"});this.a.src=URL.createObjectURL(this.blob);this.s.dataset.status="stopped";this.s.textContent="Enregistré";this.s.classList.add("recorded");updateCount();};
      this.rec.start(1000);this.startTime=Date.now();
      this.iv=setInterval(()=>{const s=Math.floor((Date.now()-this.startTime)/1000);this.t.textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;if(s>=this.max){this.stop();toast("Durée max atteinte","warning");}},1000);
      this.st.dataset.status="recording";this.btnR.disabled=true;this.btnP.classList.remove("hidden");this.btnS.classList.remove("hidden");
    }catch(e){toast("Micro inaccessible","error");}
  }
  togglePause(){if(this.rec.state==="recording"){this.rec.pause();clearInterval(this.iv);this.st.dataset.status="paused";}else{this.rec.resume();this.startTime=Date.now()-this.time;this.iv=setInterval(()=>this.tick(),1000);this.st.dataset.status="recording";}}
  stop(){this.rec.stop();this.stream.getTracks().forEach(t=>t.stop());clearInterval(this.iv);this.btnR.classList.add("hidden");this.btnP.classList.add("hidden");this.btnS.classList.add("hidden");this.btnD.classList.remove("hidden");}
  reset(){this.ch=[];this.time=0;this.t.textContent="00:00";this.a.src="";this.s.dataset.status="ready";this.s.textContent="Prêt";this.s.classList.remove("recorded");this.btnR.classList.remove("hidden");this.btnR.disabled=false;this.btnD.classList.add("hidden");updateCount();}
}
$$(".recording-section").forEach(s=>new Recorder(s));

/* Submit */
async function submit(mode){
  const btn=$(`#submit${mode==="normal"?"Normal":"Test"}`);
  btn.disabled=true;btn.textContent="Envoi…";
  const payload={mode,patient:{numero:$(`#numeroDossier${mode==="test"?"Test":""}`).value,nom:$(`#nomPatient${mode==="test"?"Test":""}`).value},sections:[]};
  const sections=mode==="normal"?["partie1","partie2","partie3","partie4"]:["clinique","antecedents","biologie"];
  for(const id of sections){
    const s=$(`[data-section="${id}"]`);
    if(!s.classList.contains("recorded"))continue;
    const blob=s.querySelector("audio").src;
    const base64=await fetch(blob).then(r=>r.blob()).then(b=>new Promise((res,rej)=>{const reader=new FileReader();reader.onloadend=()=>res(reader.result.split(",")[1]);reader.readAsDataURL(b);}));
    payload.sections.push({id,base64});
  }
  if(!payload.sections.length){toast("Aucune section enregistrée","warning");btn.disabled=false;btn.textContent="Envoyer";return;}
  try{const r=await fetch(CONFIG[mode],{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw new Error(r.statusText);toast("Envoi réussi !","success");if(mode==="test")$("#googleSheetCard").classList.remove("hidden");else $$("input").forEach(i=>i.value="");}catch(e){toast("Erreur réseau","error");}
  btn.disabled=false;btn.textContent="Envoyer";
}
$("#submitNormal").addEventListener("click",()=>submit("normal"));
$("#submitTest").addEventListener("click",()=>submit("test"));

/* Optional part 4 */
$("#togglePartie4").addEventListener("click",()=>{const p=$("[data-section=partie4]");p.classList.toggle("hidden");$("#togglePartie4").textContent=p.classList.contains("hidden")?"Afficher Partie 4":"Masquer Partie 4";});

/* Photos DMI */
const photos=[];
$("#photosUpload").addEventListener("change",e=>{
  const files=[...e.target.files].slice(0,5-photos.length);
  files.forEach(f=>{if(!f.type.startsWith("image/"))return;const reader=new FileReader();reader.onload=()=>{photos.push({name:f.name,data:reader.result.split(",")[1]});renderPhotos();};reader.readAsDataURL(f);});
});
function renderPhotos(){const box=$("#photosPreview");box.innerHTML=photos.map((p,i)=>`<div class="photo-item"><img src="data:image/jpeg;base64,${p.data}" alt=""><button class="photo-item-remove" data-index="${i}">×</button></div>`).join("");box.querySelectorAll(".photo-item-remove").forEach(b=>b.addEventListener("click",e=>{photos.splice(e.target.dataset.index,1);renderPhotos();}));}
$("#submitTexte").addEventListener("click",async()=>{const payload={mode:"texte",patient:{numero:$("#numeroDossierTexte").value,nom:$("#nomPatientTexte").value,texte:$("#texteLibre").value,photos}};try{const r=await fetch(CONFIG.test,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw new Error(r.statusText);toast("Envoi réussi !","success");}catch(e){toast("Erreur réseau","error");}});

/* Count sections */
function updateCount(){const c=$$(".recording-section.recorded").length;$$(".sections-count").forEach(el=>el.textContent=`${c} section(s) enregistrée(s)`);$$(".btn-primary[id^=submit]").forEach(b=>b.disabled=!c);}
updateCount();

/* Auth save */
const authKey="dm_auth";
const auth={username:$("#username"),access:$("#accessCode"),chk:$("#rememberAuth")};
auth.chk.addEventListener("change",()=>{if(auth.chk.checked)localStorage.setItem(authKey,JSON.stringify({u:auth.username.value,p:auth.access.value}));else localStorage.removeItem(authKey);});
(()=>{const s=localStorage.getItem(authKey);if(s){const{u,p}=JSON.parse(s);auth.username.value=u;auth.access.value=p;auth.chk.checked=true;}})();

/* SW register */
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
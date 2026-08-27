/* Healthcare Management Platform for Clinical Operations — Milestone 3, Clinical Safety Validation
   Dynamic / API-ready build: every module tries the real backend first,
   exactly like Milestone 2's script.js. If the API isn't reachable yet,
   it falls back to demo data and shows a clear "not connected" notice,
   so the UI works today and needs no rewiring once the backend is live —
   just update the URLs in API below. */

const API_BASE = window.VITALS_API_BASE || (location.protocol.startsWith("http") ? location.origin : "http://localhost:8080");

const API = {
  // Unified Healthcare Management Platform Spring Boot backend
  vitals: API_BASE,
  alerts: (window.ALERTS_API_BASE || API_BASE),
  anomaly: (window.ANOMALY_API_BASE || API_BASE)
};

function setText(id, value, fallback="--"){
  const el=document.getElementById(id);
  if(el) el.textContent = value ?? fallback;
}

function notice(id, message, type="info"){
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=`<i class="bi ${type==="error"?"bi-exclamation-triangle":"bi-cloud-check"}"></i><span>${message}</span>`;
}

async function apiFetch(url, options={}){
  const res=await fetch(url, {headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const text=await res.text();
  return text ? JSON.parse(text) : {};
}

let precisionChart = null;
let alertChart = null;

/* ---------------- Vitals Range Validation ---------------- */

const VITAL_DEFS = [
  {key:"heartRate", name:"Heart Rate", unit:"bpm", min:60, max:100, icon:"bi-heart-pulse-fill", valueKey:"heartRate"},
  {key:"spo2", name:"SpO₂", unit:"%", min:95, max:100, icon:"bi-lungs-fill", valueKey:"spo2"},
  {key:"temperature", name:"Temperature", unit:"°C", min:36.1, max:37.2, icon:"bi-thermometer-half", valueKey:"temperature"},
  {key:"respiratoryRate", name:"Respiratory Rate", unit:"/min", min:12, max:20, icon:"bi-wind", valueKey:"respiratoryRate"},
  {key:"systolicBp", name:"Systolic BP", unit:"mmHg", min:90, max:120, icon:"bi-activity", valueKey:"systolicBp"},
  {key:"diastolicBp", name:"Diastolic BP", unit:"mmHg", min:60, max:80, icon:"bi-heart", valueKey:"diastolicBp"}
];

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function demoReading(min,max){
  const span=max-min;
  const val = min - span*0.2 + Math.random()*(span*1.4);
  return Math.round(val*10)/10;
}

function demoVitals(){
  return VITAL_DEFS.map(v=>({...v, value:demoReading(v.min,v.max)}));
}

function getPatientId(){
  return (document.getElementById("patientId")?.value || "").trim();
}

function normaliseVitals(raw){
  const arr = Array.isArray(raw)
    ? raw
    : (raw?.vitals || raw?.data || raw?.results || []);

  return arr.map(item=>{
    const def = VITAL_DEFS.find(d =>
      d.key === item.key || d.name === item.name
    );
    const value = Number(item.value ?? item.reading);
    return {
      ...def,
      key: item.key ?? def?.key,
      name: item.name ?? def?.name,
      unit: item.unit ?? def?.unit,
      min: Number(item.min ?? item.range_min ?? def?.min),
      max: Number(item.max ?? item.range_max ?? def?.max),
      value
    };
  }).filter(v=>v.name && Number.isFinite(v.value));
}

function normaliseRecord(record){
  const values = {
    heartRate: Number(record.heartRate),
    spo2: Number(record.spo2),
    temperature: Number(record.temperature),
    respiratoryRate: Number(record.respiratoryRate),
    systolicBp: Number(record.systolicBp),
    diastolicBp: Number(record.diastolicBp)
  };

  const statuses = {
    heartRate: String(record.heartRateStatus || ""),
    spo2: String(record.spo2Status || ""),
    temperature: String(record.temperatureStatus || ""),
    respiratoryRate: String(record.respiratoryRateStatus || ""),
    bloodPressure: String(record.bloodpressureStatus || "")
  };

  const hasStatus = Object.values(statuses).some(Boolean);
  const derivedBad =
    values.heartRate < 60 || values.heartRate > 100 ||
    values.spo2 < 95 ||
    values.temperature < 36.1 || values.temperature > 37.2 ||
    values.respiratoryRate < 12 || values.respiratoryRate > 20 ||
    values.systolicBp < 90 || values.systolicBp > 120 ||
    values.diastolicBp < 60 || values.diastolicBp > 80;

  const statusBad = Object.values(statuses).some(s =>
    ["LOW","HIGH","ABNORMAL","OUT_OF_RANGE"].includes(s.toUpperCase())
  );

  return {
    ...record,
    ...values,
    statuses,
    overallStatus: hasStatus
      ? (statusBad ? "ABNORMAL" : "NORMAL")
      : (derivedBad ? "ABNORMAL" : "NORMAL"),
    timestamp: record.timestamp || record.recordedAt || record.createdAt || record.dateTime || null
  };
}

function formatDateTime(value){
  if(!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function statusFor(key,value){
  const def=VITAL_DEFS.find(v=>v.key===key);
  if(!def || !Number.isFinite(Number(value))) return "UNKNOWN";
  const n=Number(value);
  if(n<def.min) return "LOW";
  if(n>def.max) return "HIGH";
  return "NORMAL";
}

function paintCurrentVitals(record){
  const values = record?.values || record || {};
  const patientId = values.patientId || getPatientId() || "--";
  const defs = VITAL_DEFS.map(v=>({
    ...v,
    value:Number(values[v.valueKey])
  })).filter(v=>Number.isFinite(v.value));

  const list=document.getElementById("vitalsList");
  if(!list) return;

  list.innerHTML="";
  let outCount=0;

  defs.forEach(v=>{
    const out=v.value<v.min || v.value>v.max;
    if(out) outCount++;

    const span=v.max-v.min || 1;
    const rangeLo=v.min-span*0.2;
    const rangeHi=v.max+span*0.2;
    let pos=((v.value-rangeLo)/(rangeHi-rangeLo))*100;
    pos=Math.max(2,Math.min(98,pos));
    const fillLo=((v.min-rangeLo)/(rangeHi-rangeLo))*100;
    const fillHi=((v.max-rangeLo)/(rangeHi-rangeLo))*100;

    list.insertAdjacentHTML("beforeend",`
      <div class="vital-row">
        <div class="vname"><i class="bi ${v.icon}"></i> ${escapeHtml(v.name)}</div>
        <div class="vreading">${v.value} <small style="font-weight:500;color:#697991">${escapeHtml(v.unit)}</small></div>
        <div class="range-track">
          <div class="range-fill" style="left:${fillLo}%;width:${fillHi-fillLo}%"></div>
          <div class="range-marker ${out?"bad":""}" style="left:${pos}%"></div>
        </div>
        <div class="vital-badge ${out?"bad":"ok"}">${out?"Out of Range":"In Range"}</div>
      </div>`);
  });

  setText("vTotal", defs.length);
  setText("vOk", defs.length-outCount);
  setText("vBad", outCount);
  setText("vTime", formatDateTime(record?.timestamp) === "--" ? new Date().toLocaleTimeString() : formatDateTime(record.timestamp));
  setText("vStatus", outCount>0 ? "Attention Needed" : "All Normal");
  setText("currentPatientId", patientId);
}

function updatePatientOptions(records){
  const datalist=document.getElementById("patientIds");
  if(!datalist) return;
  const ids=[...new Set(records.map(r=>r.patientId).filter(Boolean))].sort();
  datalist.innerHTML=ids.map(id=>`<option value="${escapeHtml(id)}"></option>`).join("");
}

function getSelectedPatient(records){
  const requested=getPatientId();
  const filtered=requested
    ? records.filter(r=>String(r.patientId).toLowerCase()===requested.toLowerCase())
    : records;
  return filtered.slice().sort((a,b)=>{
    const ta=new Date(a.timestamp||0).getTime();
    const tb=new Date(b.timestamp||0).getTime();
    if(tb!==ta) return tb-ta;
    return Number(b.id||0)-Number(a.id||0);
  });
}

function paintHistory(records){
  const body=document.getElementById("historyBody");
  const empty=document.getElementById("historyEmpty");
  if(!body) return;

  body.innerHTML="";
  const selected=getSelectedPatient(records);

  if(!selected.length){
    if(empty) empty.classList.remove("hidden");
    return;
  }
  if(empty) empty.classList.add("hidden");

  selected
    .slice()
    .sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0))
    .forEach(r=>{
      const bp=`${r.systolicBp}/${r.diastolicBp}`;
      const status=r.overallStatus;
      const badge=status==="NORMAL" ? "ok" : "bad";
      body.insertAdjacentHTML("beforeend",`
        <tr>
          <td>${escapeHtml(formatDateTime(r.timestamp))}</td>
          <td><strong>${escapeHtml(r.patientId || "--")}</strong></td>
          <td>${r.heartRate} bpm</td>
          <td>${r.spo2}%</td>
          <td>${r.temperature} °C</td>
          <td>${r.respiratoryRate}/min</td>
          <td>${bp} mmHg</td>
          <td><span class="vital-badge ${badge}">${status}</span></td>
        </tr>`);
    });
}

let vitalsRecords=[];

async function loadVitalsHistory(options={}){
  const silent=Boolean(options.silent);
  if(!silent) notice("vNotice","Loading stored vitals from PostgreSQL via Spring Boot...");

  try{
    const data=await apiFetch(`${API.vitals}/api/getvitals`);
    vitalsRecords=(Array.isArray(data)?data:(data.vitals||data.data||data.results||[]))
      .map(normaliseRecord);

    updatePatientOptions(vitalsRecords);
    paintHistory(vitalsRecords);

    const selected=getSelectedPatient(vitalsRecords);
    if(selected.length){
      paintCurrentVitals(selected[0]);
    }

    if(!silent){
      notice("vNotice",`Loaded ${vitalsRecords.length} stored vital record${vitalsRecords.length===1?"":"s"} from backend.`);
    }
    setText("vStatus",selected.length ? "Backend Connected" : "No Patient Selected");
    return vitalsRecords;
  }catch(e){
    if(!silent) notice("vNotice",`Vitals backend unavailable at ${API.vitals}. ${e.message}`,"error");
    paintHistory([]);
    return [];
  }
}

async function submitVitals(event){
  event?.preventDefault();

  const form=document.getElementById("vitalsForm");
  if(!form) return;

  const patientId=getPatientId();
  const payload={
    patientId,
    heartRate:Number(document.getElementById("heartRateInput")?.value),
    spo2:Number(document.getElementById("spo2Input")?.value),
    temperature:Number(document.getElementById("temperatureInput")?.value),
    respiratoryRate:Number(document.getElementById("respiratoryRateInput")?.value),
    systolicBp:Number(document.getElementById("systolicBpInput")?.value),
    diastolicBp:Number(document.getElementById("diastolicBpInput")?.value)
  };

  if(!patientId || Object.values(payload).slice(1).some(v=>!Number.isFinite(v))){
    notice("vNotice","Please enter a Patient ID and valid values for all six vital signs.","error");
    return;
  }

  const button=document.getElementById("saveVitalsBtn");
  if(button){
    button.disabled=true;
    button.innerHTML='<i class="bi bi-arrow-repeat"></i> Saving...';
  }

  notice("vNotice","Sending new vitals to Spring Boot validation...");
  try{
    const data=await apiFetch(`${API.vitals}/api/vitals`,{
      method:"POST",
      body:JSON.stringify(payload)
    });

    const saved=normaliseRecord(data);
    paintCurrentVitals(saved);

    // The POST response is authoritative for the current dashboard.
    setText("currentPatientId",saved.patientId || patientId);
    setText("vTime",formatDateTime(saved.timestamp) === "--" ? new Date().toLocaleTimeString() : formatDateTime(saved.timestamp));

    await loadVitalsHistory({silent:true});

    // Keep the newly submitted response visible even if the DB returns an older ordering.
    paintCurrentVitals(saved);
    document.getElementById("patientId").value=saved.patientId || patientId;
    paintHistory(vitalsRecords);

    notice("vNotice","Vital record validated and saved successfully. Current vitals and history are updated from the backend.");
    form.reset();
    document.getElementById("patientId").value=saved.patientId || patientId;
  }catch(e){
    console.error("POST /api/vitals failed:",e);
    notice("vNotice",`Could not save vitals: ${e.message}`,"error");
  }finally{
    if(button){
      button.disabled=false;
      button.innerHTML='<i class="bi bi-send-fill"></i> Validate & Save Vitals';
    }
  }
}

function selectPatient(){
  const id=getPatientId();
  if(!id){
    paintHistory(vitalsRecords);
    if(vitalsRecords.length) paintCurrentVitals(vitalsRecords[0]);
    setText("vStatus","All Patients");
    return;
  }

  const matches=vitalsRecords.filter(r=>String(r.patientId).toLowerCase()===id.toLowerCase());
  paintHistory(vitalsRecords);

  if(matches.length){
    paintCurrentVitals(matches[0]);
    notice("vNotice",`Showing latest stored vitals for patient ${id}.`);
    setText("vStatus","Patient Selected");
  }else{
    setText("vStatus","No Records");
    setText("currentPatientId",id);
    notice("vNotice",`No stored records found for patient ${id}. Enter new vitals to create the first record.`);
    const list=document.getElementById("vitalsList");
    if(list) list.innerHTML='<div class="history-empty">No current record for this patient.</div>';
  }
}

function renderVitals(){
  loadVitalsHistory();
}

/* ---------------- Alert Fatigue Prevention ---------------- */
const ALERT_POOL = [
  {sev:"high",   text:"SpO₂ dropped below 90% — Bed 4"},
  {sev:"high",   text:"Irregular rhythm flagged — Bed 1"},
  {sev:"medium", text:"Heart rate elevated 10+ min — Bed 2"},
  {sev:"medium", text:"Repeated low-battery ping — Bed 5"},
  {sev:"low",    text:"Duplicate BP reading — Bed 2"},
  {sev:"low",    text:"Sensor reconnect noise — Bed 7"},
  {sev:"low",    text:"Duplicate SpO₂ reading — Bed 4"},
];

function demoAlerts(){
  return ALERT_POOL.map(a=>({
    ...a,
    isSuppressed: a.sev==="low" ? Math.random()<0.8 : (a.sev==="medium" ? Math.random()<0.35 : false),
    when:"Just now"
  }));
}

function normaliseAlerts(raw){
  const arr=Array.isArray(raw)?raw:(raw.alerts||raw.data||raw.results||[]);
  return arr.map(item=>({
    sev: (item.severity ?? item.sev ?? "low").toLowerCase(),
    text: item.message ?? item.text ?? item.description ?? "Alert",
    isSuppressed: Boolean(item.suppressed ?? item.is_suppressed),
    when: item.time ?? item.timestamp ?? "--"
  }));
}

function paintAlerts(rows){
  const list=document.getElementById("alertsList");
  if(!list) return;
  list.innerHTML="";
  let suppressed=0;
  rows.forEach(a=>{
    if(a.isSuppressed) suppressed++;
    list.insertAdjacentHTML("beforeend",`
      <div class="alert-row3 ${a.isSuppressed?"is-suppressed":""}">
        <div class="sev-tag ${a.sev}">${a.sev.toUpperCase()}</div>
        <div>${a.text}</div>
        <div class="alert-state">${a.isSuppressed?"Suppressed":"Active"}</div>
        <div class="alert-state">${a.when}</div>
      </div>`);
  });
  const total=rows.length;
  const rate=total ? Math.round((suppressed/total)*100) : 0;
  setText("aTotal", total);
  setText("aSuppressed", suppressed);
  setText("aActive", total-suppressed);
  setText("aRate", rate+"%");
}

async function renderAlerts(){
  notice("aNotice","Loading alerts from backend...");
  try{
    const data=await apiFetch(`${API.alerts}/api/alerts/recent`);
    const rows=normaliseAlerts(data);
    if(!rows.length) throw new Error("Empty response");
    paintAlerts(rows);
    setText("aStatus","Backend Connected");
    notice("aNotice","Live alerts loaded from backend.");
  }catch(e){
    paintAlerts(demoAlerts());
    setText("aStatus","Waiting");
    notice("aNotice",`Backend not reachable at ${API.alerts}. Showing demo data — connect the Alert Fatigue Prevention API to see live results.`,"error");
  }
  drawAlertChart();
}

function drawAlertChart(){
  const canvas=document.getElementById("alertChart");
  if(!canvas || typeof Chart==="undefined") return;
  const hours=["-5h","-4h","-3h","-2h","-1h","Now"];
  const active=hours.map(()=>3+Math.floor(Math.random()*5));
  const suppressed=hours.map(()=>4+Math.floor(Math.random()*8));
  if(alertChart) alertChart.destroy();
  alertChart=new Chart(canvas.getContext("2d"),{
    type:"bar",
    data:{labels:hours,datasets:[
      {label:"Needs Action",data:active,backgroundColor:"#f87171",borderRadius:5,stack:"a"},
      {label:"Suppressed",data:suppressed,backgroundColor:"rgba(96,165,250,.55)",borderRadius:5,stack:"a"}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      scales:{x:{stacked:true,ticks:{color:"#8190a7"},grid:{display:false}},
               y:{stacked:true,ticks:{color:"#8190a7"},grid:{color:"rgba(139,148,167,.08)"}}},
      plugins:{legend:{labels:{color:"#cdd4e0"}}}}
  });
}

/* ---------------- Anomaly Detection Precision ---------------- */
function demoBatch(){
  const total = 200+Math.floor(Math.random()*80);
  const precision = 79+Math.random()*17; // occasionally dips below 85 on purpose
  const tp = Math.round(total*precision/100);
  return {total, tp, fp: total-tp, precision};
}

function normaliseBatch(raw){
  const m = raw.metrics || raw;
  const tp = Number(m.true_positives ?? m.tp);
  const fp = Number(m.false_positives ?? m.fp);
  let precision = Number(m.precision ?? m.precision_pct);
  if(!Number.isFinite(precision) && Number.isFinite(tp) && Number.isFinite(fp) && (tp+fp)>0){
    precision = (tp/(tp+fp))*100;
  } else if(Number.isFinite(precision) && precision<=1){
    precision = precision*100;
  }
  const total = Number(m.total ?? m.batch_size ?? (tp+fp));
  if(!Number.isFinite(precision) || !Number.isFinite(total)) return null;
  return {total, tp: tp||0, fp: fp||0, precision};
}

function paintBatch(b){
  setText("pPrecision", b.precision.toFixed(1)+"%");
  setText("pTP", b.tp);
  setText("pFP", b.fp);
  setText("pTotal", b.total);

  const above = b.precision>=85;
  const box=document.getElementById("validityBox");
  const icon=box?.querySelector("i");
  if(box){
    box.style.borderColor = above ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.25)";
    box.style.background = above ? "rgba(74,222,128,.06)" : "rgba(248,113,113,.07)";
    if(icon){ icon.className = "bi "+(above?"bi-check-circle-fill":"bi-exclamation-triangle-fill"); icon.style.color = above?"#4ade80":"#f87171"; }
  }
  setText("validityTitle", above?"Above required precision":"Below required precision");
  setText("validityText", above
    ? "Current batch precision meets the 85% floor set for this module."
    : "Current batch precision has dropped below the 85% floor — flag for model review.");
  const titleEl=document.getElementById("validityTitle");
  if(titleEl) titleEl.style.color = above?"#4ade80":"#f87171";

  drawPrecisionChart(b.precision);
}

async function renderPrecision(){
  notice("pNotice","Loading latest batch from backend...");
  try{
    const data=await apiFetch(`${API.anomaly}/api/anomaly/precision`);
    const batch=normaliseBatch(data);
    if(!batch) throw new Error("Empty response");
    paintBatch(batch);
    setText("pStatus","Backend Connected");
    notice("pNotice","Live precision metrics loaded from backend.");
  }catch(e){
    paintBatch(demoBatch());
    setText("pStatus","Waiting");
    notice("pNotice",`Backend not reachable at ${API.anomaly}. Showing demo data — connect the Anomaly Detection API to see live results.`,"error");
  }
}

function drawPrecisionChart(latest){
  const canvas=document.getElementById("precisionChart");
  if(!canvas || typeof Chart==="undefined") return;
  const labels=["B-7","B-6","B-5","B-4","B-3","B-2","B-1","Latest"];
  const values=labels.slice(0,-1).map(()=>82+Math.random()*12);
  values.push(latest);
  if(precisionChart) precisionChart.destroy();
  precisionChart=new Chart(canvas.getContext("2d"),{
    type:"line",
    data:{labels,datasets:[
      {label:"Precision",data:values,borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,.12)",borderWidth:3,pointRadius:4,tension:.35,fill:true},
      {label:"85% Floor",data:labels.map(()=>85),borderColor:"#f87171",borderDash:[6,5],borderWidth:2,pointRadius:0,fill:false}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      scales:{x:{ticks:{color:"#8190a7"},grid:{color:"rgba(139,148,167,.08)"}},
               y:{min:70,max:100,ticks:{color:"#8190a7",callback:v=>v+"%"},grid:{color:"rgba(139,148,167,.08)"}}},
      plugins:{legend:{labels:{color:"#cdd4e0"}}}}
  });
}

/* ---------------- Dashboard summary ---------------- */
async function refreshDashboard(){
  notice("dashNotice","Refreshing backend data...");
  let anyConnected=false;

  try{
    const data=await apiFetch(`${API.vitals}/api/vitals/current`);
    const vitals=normaliseVitals(data);
    if(!vitals.length) throw new Error("Empty");
    setText("dashOutRange", vitals.filter(v=>v.value<v.min||v.value>v.max).length);
    anyConnected=true;
  }catch(e){
    setText("dashOutRange", demoVitals().filter(v=>v.value<v.min||v.value>v.max).length);
  }

  try{
    const data=await apiFetch(`${API.alerts}/api/alerts/recent`);
    const rows=normaliseAlerts(data);
    if(!rows.length) throw new Error("Empty");
    const rate=Math.round((rows.filter(a=>a.isSuppressed).length/rows.length)*100);
    setText("dashSuppressed", rate+"%");
    anyConnected=true;
  }catch(e){
    const rows=demoAlerts();
    const rate=Math.round((rows.filter(a=>a.isSuppressed).length/rows.length)*100);
    setText("dashSuppressed", rate+"%");
  }

  try{
    const data=await apiFetch(`${API.anomaly}/api/anomaly/precision`);
    const batch=normaliseBatch(data);
    if(!batch) throw new Error("Empty");
    setText("dashPrecision", batch.precision.toFixed(1)+"%");
    anyConnected=true;
  }catch(e){
    setText("dashPrecision", demoBatch().precision.toFixed(1)+"%");
  }

  notice("dashNotice", anyConnected
    ? "Dashboard data refreshed. Backend values are used when APIs are available."
    : "No backend APIs reachable yet. Showing demo data for all three modules.",
    anyConnected ? "info" : "error");
}

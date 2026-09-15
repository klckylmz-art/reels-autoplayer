const $=s=>document.querySelector(s), months=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const KEY='barPuantajV1',SALARY_KEY='barPuantajSalaryVaultV1',OWNER_SALT='YmFyLXB1YW50YWotb3duZXItdjE=',OWNER_VERIFIER='ym4Z7ynuYtowvpezQlHBtcch/kTUTRV0xyF/CDH9+Jk=';
const START_YEAR=2026, START_MONTH=8; let db=load(),salaryVault=null,salaryCryptoKey=null,bossUnlocked=false,htmlFileHandle=null,htmlWriteTimer=null,htmlWriteChain=Promise.resolve(),htmlDirty=false,permissionCheckTimer=null;
function emptyDB(){return{employees:[],months:{}}}
function upperNameSafe(s){return String(s||'').trim().replace(/\s+/g,' ').toLocaleUpperCase('tr-TR')}
function embeddedSnapshot(){try{return JSON.parse($('#embedded-data')?.textContent||'{}')}catch(e){return{savedAt:0,db:null,salary:null}}}
function load(){
 try{
  const persisted=window.puantajAPI?.loadData?.()||null, embedded=embeddedSnapshot();
  const chosen=persisted?.db||embedded.db||emptyDB();
  if(persisted?.salary)localStorage.setItem(SALARY_KEY,persisted.salary);else localStorage.removeItem(SALARY_KEY);
  return normalize(chosen);
 }catch(e){return normalize(embeddedSnapshot().db||emptyDB())}
}

function normalize(raw){
 const clean={employees:Array.isArray(raw.employees)?raw.employees:[],months:{},_updatedAt:+raw._updatedAt||0};
 clean.employees.forEach(e=>{e.name=upperNameSafe(e.name);e.addedFrom=e.addedFrom||'2026-09';e.hourlyRate=Number.isFinite(+e.hourlyRate)?+e.hourlyRate:(+e.rate||0)/8;e.department=e.department||e.role||'';if(e.removedFrom&&!e.removedFromDate)e.removedFromDate=e.removedFrom+'-01'});
 Object.entries(raw.months||{}).forEach(([key,m])=>{
  const hours=m.hours||{},details=m.details||{};
  if(m.attendance)Object.entries(m.attendance).forEach(([id,days])=>{hours[id]=hours[id]||{};Object.entries(days).forEach(([d,v])=>{if(v==='p')hours[id][d]=8;if(v==='h')hours[id][d]=4})});
  if(m.finance)Object.entries(m.finance).forEach(([id,f])=>{details[id]=details[id]||{};if(details[id].advance==null)details[id].advance=+f.advance||0;if(!details[id].note)details[id].note=f.note||''});
  clean.months[key]={hours,details};
 });return clean;
}
function generalDataSnapshot(){const copy=JSON.parse(JSON.stringify(db));copy.employees.forEach(e=>{delete e.hourlyRate;delete e.rate});Object.values(copy.months||{}).forEach(m=>Object.values(m.details||{}).forEach(d=>delete d.rate));return copy}
function snapshotPayload(){return{savedAt:+db._updatedAt||Date.now(),db:generalDataSnapshot(),salary:localStorage.getItem(SALARY_KEY)||null}}
function safeSnapshotJson(payload=snapshotPayload()){return JSON.stringify(payload).replace(/</g,'\\u003c')}
function writeDataIntoHtml(source,payload=snapshotPayload()){
 const marker=/(<script id="embedded-data" type="application\/json">)[\s\S]*?(<\/script>)/;
 if(!marker.test(source))throw new Error('Bu dosya puantaj HTML dosyası değil.');
 return source.replace(marker,(_,open,close)=>open+safeSnapshotJson(payload)+close);
}
async function writeHtmlNow(){
 if(!htmlFileHandle)throw new Error('NO_FILE_HANDLE');
 const permission=await htmlFileHandle.queryPermission({mode:'readwrite'});
 if(permission!=='granted')throw new Error('WRITE_PERMISSION_REQUIRED');
 const file=await htmlFileHandle.getFile(),source=await file.text(),updated=writeDataIntoHtml(source),writable=await htmlFileHandle.createWritable();
 await writable.write(updated);await writable.close();
 htmlDirty=false;
 const st=$('#saveState');if(st){st.textContent='Kaydedildi';st.style.color='var(--green)';clearTimeout(writeHtmlNow.timer);writeHtmlNow.timer=setTimeout(()=>st.textContent='',1800)}
}
function requirePermissionAgain(message='Kayıt güvenliği için dosya erişimini yeniden onaylayın.'){
 clearTimeout(htmlWriteTimer);
 htmlFileHandle=null;
 lockApplication(message);
}
function scheduleHtmlWrite(){
 const st=$('#saveState');
 htmlDirty=true;
 if(!htmlFileHandle){requirePermissionAgain('Değişikliğin HTML dosyasına kaydolması garanti edilemiyor. Yeniden izin verin.');return}
 if(st){st.textContent='Kaydediliyor…';st.style.color='var(--muted)'}
 clearTimeout(htmlWriteTimer);htmlWriteTimer=setTimeout(()=>{htmlWriteChain=htmlWriteChain.then(writeHtmlNow).catch(()=>{requirePermissionAgain('Değişiklik HTML dosyasına yazılamadı. Kayıp riskini önlemek için yeniden izin verin.')})},180);
}
async function verifyStoredPermission(){
 if(!htmlFileHandle)return false;
 try{
  const permission=await htmlFileHandle.queryPermission({mode:'readwrite'});
  if(permission!=='granted'){requirePermissionAgain('Dosya yazma izni artık geçerli değil. Devam etmek için yeniden izin verin.');return false}
  return true;
 }catch(e){requirePermissionAgain('Dosya erişimi doğrulanamadı. Kayıt güvenliği için yeniden izin verin.');return false}
}
function fileHandleStore(action,value){
 return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){resolve(null);return}const request=indexedDB.open('barPuantajFileAccess',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('handles'))request.result.createObjectStore('handles')};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const tx=request.result.transaction('handles',action==='get'?'readonly':'readwrite'),store=tx.objectStore('handles'),query=action==='get'?store.get('html'):store.put(value,'html');query.onsuccess=()=>resolve(query.result||null);query.onerror=()=>reject(query.error)}});
}
function openApplication(){
 const gate=$('#permissionGate'),app=$('#mainApp'),err=$('#permissionError');
 if(err)err.textContent='';
 if(gate)gate.style.display='none';
 if(app)app.style.display='block';
}
function lockApplication(message=''){
 const gate=$('#permissionGate'),app=$('#mainApp'),err=$('#permissionError');
 if(app)app.style.display='none';
 if(gate)gate.style.display='flex';
 if(err)err.textContent=message;
}
async function connectHtmlFile(){
 const err=$('#permissionError');if(err)err.textContent='';
 if(!window.showOpenFilePicker){if(err)err.textContent='Bu özellik için Chrome veya Edge kullanın.';return false}
 try{
  const[handle]=await window.showOpenFilePicker({multiple:false,types:[{description:'Puantaj HTML',accept:{'text/html':['.html','.htm']}}]});
  const permission=await handle.requestPermission({mode:'readwrite'});
  if(permission!=='granted')throw new Error('Yazma izni verilmedi.');
  htmlFileHandle=handle;
  await fileHandleStore('put',handle);
  await writeHtmlNow();
  openApplication();
  return true;
 }catch(e){
  if(e.name!=='AbortError'&&err)err.textContent=e.message||'Dosya izni alınamadı.';
  return false;
 }
}
async function restoreHtmlHandle(){
 try{
  const handle=await fileHandleStore('get');
  if(!handle){lockApplication('');return false}
  const permission=await handle.queryPermission({mode:'readwrite'});
  if(permission==='granted'){
   htmlFileHandle=handle;
   try{await writeHtmlNow();openApplication();return true}catch(e){requirePermissionAgain('Dosyaya yazma erişimi doğrulanamadı. Yeniden izin verin.');return false}
  }
  lockApplication('');
  return false;
 }catch(e){lockApplication('');return false}
}
function persistDesktop(){
 const payload={savedAt:Date.now(),db:generalDataSnapshot(),salary:localStorage.getItem(SALARY_KEY)||null};
 const result=window.puantajAPI?.saveData?.(payload);
 if(result&&result.ok===false){alert('Kayıt yapılamadı: '+(result.error||'Bilinmeyen hata'));throw new Error(result.error||'save-failed')}
 const s=$('#saveState');if(s){s.textContent='Kaydedildi';clearTimeout(save.timer);save.timer=setTimeout(()=>s.textContent='',1200)}
}
function save(){db._updatedAt=Date.now();persistDesktop()}
for(let i=0;i<12;i++)$('#month').add(new Option(months[i],i));for(let y=2020;y<=2045;y++)$('#year').add(new Option(y,y));$('#month').value=START_MONTH;$('#year').value=START_YEAR;
const monthKey=()=>$('#year').value+'-'+String(+$('#month').value+1).padStart(2,'0');
const daysInMonth=()=>new Date(+$('#year').value,+$('#month').value+1,0).getDate();
function monthData(key=monthKey()){return db.months[key]||(db.months[key]={hours:{},details:{}})}
function removalMonth(emp){return emp.removedFromDate?emp.removedFromDate.slice(0,7):''}
function removalDay(emp,key=monthKey()){return removalMonth(emp)===key?+emp.removedFromDate.slice(8,10):Infinity}
function hasMonthActivity(emp,key=monthKey()){
 const m=db.months[key]||{},cutoff=removalDay(emp,key),hours=m.hours?.[emp.id]||{},d=m.details?.[emp.id]||{};
 return Object.entries(hours).some(([day,value])=>+day<=cutoff&&+value>0)||[...(d.others||[]),...(d.leaves||[]),...(d.advances||[])].some(x=>(x.date||key+'-01')<=emp.removedFromDate)||+d.leaveDays>0||+d.advance>0;
}
function sortEmployees(list){return [...list].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'tr',{sensitivity:'base'}))}
function tableEmployees(key=monthKey()){return sortEmployees(db.employees.filter(e=>(e.addedFrom||'2026-09')<=key&&(!removalMonth(e)||key<removalMonth(e))))}
function summaryEmployees(key=monthKey()){return sortEmployees(db.employees.filter(e=>{if((e.addedFrom||'2026-09')>key)return false;const removed=removalMonth(e);return !removed||key<removed||(key===removed&&hasMonthActivity(e,key))}))}
function hoursFor(id,key=monthKey()){return monthData(key).hours[id]||(monthData(key).hours[id]={})}
function detailFor(id,key=monthKey()){
 const d=monthData(key).details[id]||(monthData(key).details[id]={});
 if(!Array.isArray(d.advances))d.advances=d.advance?[{id:'old-a-'+id,date:key+'-01',amount:+d.advance||0,description:d.note||'Önceki avans kaydı'}]:[];
 if(!Array.isArray(d.others)){d.others=[];(d.leaves||[]).forEach(x=>d.others.push({id:'old-o-'+(x.id||Date.now()),date:x.date||key+'-01',description:'İzin'+(x.days?' ('+fmtNum(x.days)+' gün)':'')+(x.description?' — '+x.description:'')}));if(d.note&&!d.advance&&!d.leaves?.length)d.others.push({id:'old-note-'+id,date:key+'-01',description:d.note})}
 return d;
}
function fmtMoney(n){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(+n||0)}
function fmtNum(n){return (+n||0).toLocaleString('tr-TR',{maximumFractionDigits:2})}
function todayLocal(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function parseManualDate(value){
 const raw=String(value||'').trim(),iso=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/),tr=raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/),parts=iso?[+iso[1],+iso[2],+iso[3]]:tr?[+tr[3],+tr[2],+tr[1]]:null;if(!parts)return'';
 const[y,m,d]=parts,check=new Date(Date.UTC(y,m-1,d));if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d)return'';return String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function formatManualDate(iso){const valid=parseManualDate(iso);return valid?valid.split('-').reverse().join('.'):''}
function setDatePair(base,iso){const picker=$('#'+base),text=$('#'+base+'Text');picker.value=iso||'';text.value=formatManualDate(iso);text.setCustomValidity('')}
function readDatePair(base){const text=$('#'+base+'Text'),picker=$('#'+base),iso=parseManualDate(text.value);text.setCustomValidity(iso?'':'Geçerli bir tarih yazın: GG.AA.YYYY');if(!iso){text.reportValidity();return''}picker.value=iso;text.value=formatManualDate(iso);return iso}
function bindDatePair(base){const text=$('#'+base+'Text'),picker=$('#'+base),button=document.querySelector('[data-pick-for="'+base+'"]');text.addEventListener('input',()=>{const iso=parseManualDate(text.value);if(iso){picker.value=iso;text.setCustomValidity('')}});text.addEventListener('blur',()=>{const iso=parseManualDate(text.value);if(iso)setDatePair(base,iso)});picker.addEventListener('change',()=>setDatePair(base,picker.value));button.onclick=()=>{try{if(typeof picker.showPicker==='function')picker.showPicker();else picker.click()}catch(e){picker.click()}}}
function hourClass(value){if(value===''||value==null)return'';const n=+value;if(n<4)return'low';if(n===8)return'target';if(n>8)return'overtime';return'filled'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function upperName(s){return upperNameSafe(s)}
function weekendHours(emp,key=monthKey()){const cutoff=removalDay(emp,key),hours=monthData(key).hours[emp.id]||{};let saturday=0,sunday=0;Object.entries(hours).forEach(([day,value])=>{const d=+day;if(d>cutoff)return;const v=+value||0;if(v<=0)return;const dt=new Date(+key.slice(0,4),+key.slice(5,7)-1,d),w=dt.getDay();if(w===6)saturday+=v;else if(w===0)sunday+=v});return{saturday,sunday}}
function datedEntries(emp,key=monthKey()){
 const cutoff=removalDay(emp,key),d=detailFor(emp.id,key);
 return[...d.advances.map(x=>({...x,type:'advance'})),...d.others.map(x=>({...x,type:'other'}))].filter(x=>!Number.isFinite(cutoff)||(x.date||key+'-01')<=emp.removedFromDate).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
}
function entryText(x){const date=(x.date||'').split('-').reverse().join('.');return date+' — '+(x.type==='advance'?'Avans: '+fmtMoney(x.amount):'Diğer')+(x.description?' ('+x.description+')':'')}
function totals(emp,key=monthKey()){
 const cutoff=removalDay(emp,key),vals=Object.entries(monthData(key).hours[emp.id]||{}).filter(([day])=>+day<=cutoff).map(([,value])=>+value).filter(n=>n>0),hours=vals.reduce((a,b)=>a+b,0),overtime=vals.reduce((a,b)=>a+Math.max(0,b-8),0),normal=hours-overtime,days=vals.length,entries=datedEntries(emp,key),advance=entries.filter(x=>x.type==='advance').reduce((s,x)=>s+(+x.amount||0),0),notes=entries.map(entryText).join(' • ');
 const wk=weekendHours(emp,key),weekday=hours-wk.saturday-wk.sunday;return{hours,weekday,normal,overtime,days,advance,note:notes,entries,saturday:wk.saturday,sunday:wk.sunday};
}
function render(){const key=monthKey();$('#monthTitle').textContent=months[+$('#month').value]+' '+$('#year').value;$('#sheetTitle').textContent=months[+$('#month').value]+' '+$('#year').value+' Çalışma Saatleri';renderTimesheet();renderSummary();if(bossUnlocked)renderBoss()}
function renderTimesheet(){
 const n=daysInMonth(),emps=tableEmployees();let h='<thead><tr><th class="fixed-col name-col">Çalışan</th>';
 for(let d=1;d<=n;d++){const dt=new Date(+$('#year').value,+$('#month').value,d),w=dt.getDay()===0||dt.getDay()===6;h+='<th class="'+(w?'weekend':'')+'">'+d+'<br><small>'+['Pz','Pt','Sa','Ça','Pe','Cu','Ct'][dt.getDay()]+'</small></th>'}
 h+='<th>Toplam Saat</th><th>Gün</th></tr></thead><tbody>';
 emps.forEach(emp=>{const values=monthData().hours[emp.id]||{},t=totals(emp);h+='<tr><td class="fixed-col name-col"><button class="employee-link" data-employee="'+emp.id+'">'+esc(emp.name)+(t.advance||t.note?' <span class="badge">Kayıt</span>':'')+'</button></td>';
  for(let d=1;d<=n;d++){const dt=new Date(+$('#year').value,+$('#month').value,d),w=dt.getDay()===0||dt.getDay()===6,val=values[d]??'';h+='<td class="hour-cell '+(w?'weekend':'')+'"><input class="hour-input '+hourClass(val)+'" type="text" inputmode="decimal" maxlength="5" autocomplete="off" placeholder="" value="'+val+'" data-last="'+val+'" data-id="'+emp.id+'" data-day="'+d+'" aria-label="'+esc(emp.name)+' '+d+'. gün"></td>'}
  h+='<td class="total-col" id="total-'+emp.id+'">'+fmtNum(t.hours)+'</td><td class="total-col" id="days-'+emp.id+'">'+t.days+'</td></tr>'});
 if(!emps.length)h+='<tr><td class="empty" colspan="'+(n+3)+'">Bu ay tabloda çalışan yok. “Kişi Ekle” düğmesini kullanın.</td></tr>';$('#timesheet').innerHTML=h+'</tbody>';
}
function renderSummary(){
 const emps=summaryEmployees();let all={hours:0,weekday:0,days:0,advance:0,saturday:0,sunday:0};let h='<thead><tr><th>Çalışan</th><th>Hafta İçi Saat</th><th>Cumartesi Saat</th><th>Pazar Saat</th><th>Toplam Saat</th><th>Çalışılan Gün</th><th>Toplam Avans</th><th>Aylık Tarihli Kayıtlar</th></tr></thead><tbody>';
 emps.forEach(e=>{const t=totals(e),removed=removalMonth(e)===monthKey()?' <span class="badge">Ayrıldı '+e.removedFromDate.split('-').reverse().join('.')+'</span>':'';all.hours+=t.hours;all.weekday+=t.weekday;all.days+=t.days;all.advance+=t.advance;all.saturday+=t.saturday;all.sunday+=t.sunday;h+='<tr><td><button class="employee-link" data-employee="'+e.id+'">'+esc(e.name)+removed+'</button></td><td>'+fmtNum(t.weekday)+'</td><td>'+fmtNum(t.saturday)+'</td><td>'+fmtNum(t.sunday)+'</td><td><b>'+fmtNum(t.hours)+'</b></td><td>'+t.days+'</td><td>'+fmtMoney(t.advance)+'</td><td class="note-cell">'+(t.entries.length?t.entries.map(x=>'<div>'+esc(entryText(x))+'</div>').join(''):'—')+'</td></tr>'});
 if(!emps.length)h+='<tr><td class="empty" colspan="8">Özetlenecek çalışan yok.</td></tr>';$('#summary').innerHTML=h+'</tbody>';
 $('#summaryCards').innerHTML=[['Çalışan',emps.length],['Hafta İçi Saat',fmtNum(all.weekday)],['Cumartesi Saat',fmtNum(all.saturday)],['Pazar Saat',fmtNum(all.sunday)],['Toplam Saat',fmtNum(all.hours)],['Toplam Avans',fmtMoney(all.advance)]].map(x=>'<div class="card"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
}
function b64ToBytes(value){const s=atob(value),out=new Uint8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out}
function bytesToB64(value){let s='';new Uint8Array(value).forEach(x=>s+=String.fromCharCode(x));return btoa(s)}
async function deriveOwnerKey(password){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),raw=await crypto.subtle.deriveBits({name:'PBKDF2',salt:b64ToBytes(OWNER_SALT),iterations:210000,hash:'SHA-256'},material,256);
 if(bytesToB64(raw)!==OWNER_VERIFIER)throw new Error('wrong-password');
 return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
}

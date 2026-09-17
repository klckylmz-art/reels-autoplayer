(() => {
  const DEFAULT_SALT='YmFyLXB1YW50YWotb3duZXItdjE=';
  const DEFAULT_VERIFIER='VF19cZCnDQ5azFs6NgqdoBE674siHglr3o9WEn8S7jo=';
  const AUTH_KEY='__ACCOUNTING_AUTH__';

  function pB64ToBytes(value){const s=atob(value),out=new Uint8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out}
  function pBytesToB64(value){let s='';new Uint8Array(value).forEach(x=>s+=String.fromCharCode(x));return btoa(s)}
  async function pRaw(password,salt){
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    return crypto.subtle.deriveBits({name:'PBKDF2',salt:pB64ToBytes(salt),iterations:210000,hash:'SHA-256'},material,256);
  }
  async function pVerifier(password,salt){return pBytesToB64(await pRaw(password,salt))}
  async function pKey(password,salt){return crypto.subtle.importKey('raw',await pRaw(password,salt),{name:'AES-GCM'},false,['encrypt','decrypt'])}

  function authContainer(){
    db.months['2026-09']=db.months['2026-09']||{hours:{},details:{}};
    db.months['2026-09'].details=db.months['2026-09'].details||{};
    return db.months['2026-09'].details;
  }
  function getAuthConfig(){const a=authContainer()[AUTH_KEY];return a?.salt&&a?.verifier?a:{salt:DEFAULT_SALT,verifier:DEFAULT_VERIFIER}}
  function setAuthConfig(a){authContainer()[AUTH_KEY]={salt:a.salt,verifier:a.verifier}}

  async function deriveDynamicKey(password){const a=getAuthConfig(),raw=await pRaw(password,a.salt);if(pBytesToB64(raw)!==a.verifier)throw new Error('wrong-password');return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt'])}
  async function saveSalaryVaultDynamic(){
    if(!salaryCryptoKey||!salaryVault)return;
    const iv=crypto.getRandomValues(new Uint8Array(12)),plain=new TextEncoder().encode(JSON.stringify(salaryVault)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},salaryCryptoKey,plain);
    localStorage.setItem(SALARY_KEY,JSON.stringify({iv:pBytesToB64(iv),cipher:pBytesToB64(cipher)}));
    persistDesktop();
  }
  async function unlockSalaryDynamic(password){
    const key=await deriveDynamicKey(password),stored=JSON.parse(localStorage.getItem(SALARY_KEY)||'null');let vault={rates:{},overtime:{}};
    if(stored){const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:pB64ToBytes(stored.iv)},key,pB64ToBytes(stored.cipher));vault=JSON.parse(new TextDecoder().decode(plain));if(!vault.rates)vault.rates={};if(!vault.overtime)vault.overtime={}}
    salaryCryptoKey=key;salaryVault=vault;bossUnlocked=true;await migratePlainSalary();return true;
  }

  saveSalaryVault=saveSalaryVaultDynamic;
  unlockSalary=unlockSalaryDynamic;

  const loginForm=document.querySelector('#bossLoginForm');
  if(loginForm) loginForm.onsubmit=async e=>{e.preventDefault();const error=document.querySelector('#bossLoginError');error.textContent='Kontrol ediliyor…';try{await unlockSalaryDynamic(document.querySelector('#bossPassword').value);error.textContent='';document.querySelector('#bossLoginModal').close();document.querySelector('#bossLocked').hidden=true;document.querySelector('#bossContent').hidden=false;activatePage('bossPage');renderBoss();toast('Muhasebe açıldı')}catch(err){salaryCryptoKey=null;salaryVault=null;bossUnlocked=false;error.textContent='Şifre yanlış.';document.querySelector('#bossPassword').select()}};

  const bossActions=document.querySelector('.boss-actions');
  if(bossActions&&!document.querySelector('#changeBossPassword')){
    const change=document.createElement('button');change.className='btn';change.id='changeBossPassword';change.type='button';change.textContent='Şifre Değiştir';
    const lock=document.querySelector('#lockBoss');lock.parentNode.insertBefore(change,lock);
    change.onclick=async()=>{if(!bossUnlocked)return;const p1=prompt('Yeni Muhasebe şifresini yazın:');if(p1===null)return;if(p1.length<4){alert('Şifre en az 4 karakter olmalıdır.');return}const p2=prompt('Yeni şifreyi tekrar yazın:');if(p2===null)return;if(p1!==p2){alert('Şifreler aynı değil.');return}try{const saltBytes=crypto.getRandomValues(new Uint8Array(16)),salt=pBytesToB64(saltBytes),verifier=await pVerifier(p1,salt),newKey=await pKey(p1,salt);setAuthConfig({salt,verifier});salaryCryptoKey=newKey;await saveSalaryVaultDynamic();save();alert('Muhasebe şifresi değiştirildi.')}catch(err){alert('Şifre değiştirilemedi: '+(err?.message||err))}};
  }

  const headerButtons=document.querySelector('header .buttons');
  if(headerButtons&&!document.querySelector('#importPuantaj')){
    const button=document.createElement('button');button.className='btn';button.id='importPuantaj';button.type='button';button.textContent='Puantaj Yükle';
    const exportBtn=document.querySelector('#exportCsv');headerButtons.insertBefore(button,exportBtn||null);
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;document.body.appendChild(input);
    button.onclick=()=>{input.value='';input.click()};
    input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!imported||!imported.db||!Array.isArray(imported.db.employees)||!imported.db.months||typeof imported.db.months!=='object')throw new Error('Geçerli bir puantaj JSON dosyası değil.');if(!confirm('Mevcut puantaj yedeklenip seçilen puantaj yüklensin mi?'))return;db=normalize(imported.db);if(imported.salary)localStorage.setItem(SALARY_KEY,imported.salary);else localStorage.removeItem(SALARY_KEY);clearBossSession();render();toast('Puantaj yüklendi')}catch(err){alert('Puantaj yüklenemedi: '+(err?.message||err))}};
  }
})();
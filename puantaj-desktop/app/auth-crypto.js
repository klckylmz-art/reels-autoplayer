(function(root,factory){
  const api=factory(root.crypto || (typeof require==='function' ? require('node:crypto').webcrypto : null));
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.PuantajAuthCrypto=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(webcrypto){
  const enc=new TextEncoder();
  function b64ToBytes(value){
    if(typeof Buffer!=='undefined') return new Uint8Array(Buffer.from(value,'base64'));
    const s=atob(value),out=new Uint8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out;
  }
  function bytesToB64(value){
    if(typeof Buffer!=='undefined') return Buffer.from(new Uint8Array(value)).toString('base64');
    let s='';new Uint8Array(value).forEach(x=>s+=String.fromCharCode(x));return btoa(s);
  }
  async function deriveRaw(password,saltB64,iterations=210000){
    if(!webcrypto?.subtle) throw new Error('Web Crypto unavailable');
    const material=await webcrypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
    return webcrypto.subtle.deriveBits({name:'PBKDF2',salt:b64ToBytes(saltB64),iterations,hash:'SHA-256'},material,256);
  }
  async function verifier(password,saltB64,iterations=210000){
    return bytesToB64(await deriveRaw(password,saltB64,iterations));
  }
  async function aesKey(password,saltB64,iterations=210000){
    const raw=await deriveRaw(password,saltB64,iterations);
    return webcrypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
  }
  function randomSalt(){
    const bytes=new Uint8Array(16);webcrypto.getRandomValues(bytes);return bytesToB64(bytes);
  }
  return {b64ToBytes,bytesToB64,deriveRaw,verifier,aesKey,randomSalt};
});
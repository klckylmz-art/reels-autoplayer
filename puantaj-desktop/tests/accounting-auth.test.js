const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto').webcrypto;
const salt=Buffer.from('YmFyLXB1YW50YWotb3duZXItdjE=','base64');
const expected='VF19cZCnDQ5azFs6NgqdoBE674siHglr3o9WEn8S7jo=';
async function verifier(password){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const raw=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},material,256);return Buffer.from(raw).toString('base64')}
test('Hayal17 is the default Muhasebe password',async()=>{assert.equal(await verifier('Hayal17'),expected);assert.notEqual(await verifier('hayal17'),expected)});
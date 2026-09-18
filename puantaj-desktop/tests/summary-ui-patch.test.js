const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const main=fs.readFileSync(path.join(__dirname,'../app/main-patched.js'),'utf8');

test('main loads summary grouping and full-cell input patch',()=>{
  assert.match(main,/summary-ui-patch\.js/);
});

test('summary UI patch groups monthly summary and makes salary input fill cell',()=>{
  const patchPath=path.join(__dirname,'../app/summary-ui-patch.js');
  assert.ok(fs.existsSync(patchPath));
  const patch=fs.readFileSync(patchPath,'utf8');
  assert.match(patch,/AYLIK ÖZET GRUPLAMA/);
  assert.match(patch,/PERSONEL/);
  assert.match(patch,/SANATÇI/);
  assert.match(patch,/GÜVENLİK/);
  assert.match(patch,/localeCompare\([^,]+,'tr-TR'/);
  assert.match(patch,/\.salary-input\{[^}]*width:100%[^}]*height:100%/s);
  assert.match(patch,/#bossTable td:has\(\.salary-input\)\{[^}]*padding:0/s);
});

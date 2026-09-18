const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const patch=fs.readFileSync(path.join(__dirname,'../app/groups-patch.js'),'utf8');
const grouping=fs.readFileSync(path.join(__dirname,'../app/timesheet-grouping-patch.js'),'utf8');
const utils=fs.readFileSync(path.join(__dirname,'../app/group-utils.js'),'utf8');
const main=fs.readFileSync(path.join(__dirname,'../app/main-patched.js'),'utf8');

test('program title is Hayal Kahvesi Puantaj',()=>{
  assert.match(main,/Hayal Kahvesi Puantaj/);
  assert.match(patch,/Hayal Kahvesi Puantaj/);
});

test('main puantaj is unified and shows editable Görevi column',()=>{
  assert.match(patch,/Görevi/);
  assert.match(patch,/data-role-id/);
  assert.match(patch,/role-select/);
  assert.doesNotMatch(patch,/mainTabs\.insertAdjacentElement\('afterend',groupTabs\)/);
});

test('accounting has group tabs and Genel Özet is the last tab',()=>{
  assert.match(patch,/accounting-tabs/);
  assert.match(patch,/\[\['personel','Personel'\],\['sanatci','Sanatçı'\],\['guvenlik','Güvenlik'\],\['general','Genel Özet'\]\]/);
  assert.match(utils,/Sahne Ücreti/);
  assert.match(utils,/Günlük Ücret/);
  assert.match(patch,/Genel Toplam Ödeme/);
});

test('daily fee and salary inputs are highlighted',()=>{
  assert.match(patch,/\.salary-input,\.daily-fee-input\{background:#fff3d6/i);
  assert.match(patch,/\.salary-input:focus,\.daily-fee-input:focus\{background:#ffe8ad/i);
});

test('timesheet group headers explain what to enter for each group',()=>{
  assert.match(grouping,/Çalışma saati girilir.*Tam gün.*8 saat/i);
  assert.match(grouping,/SANATÇI[\s\S]*Günlük ücret girilir/i);
  assert.match(grouping,/GÜVENLİK[\s\S]*Günlük ücret girilir/i);
});

test('timesheet date header stays visible while scrolling down',()=>{
  assert.match(grouping,/#timesheet thead th\{[\s\S]*position:sticky[\s\S]*top:0/i);
  assert.match(grouping,/z-index:\s*8/i);
});

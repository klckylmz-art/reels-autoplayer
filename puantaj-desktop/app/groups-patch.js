(() => {
  const G=window.HayalGroupUtils;
  if(!G) throw new Error('HayalGroupUtils yüklenemedi');

  document.title='Hayal Kahvesi Puantaj';
  const title=document.querySelector('header .title h1');
  if(title) title.textContent='Hayal Kahvesi Puantaj';
  const headerHelp=document.querySelector('.bar .help');
  if(headerHelp) headerHelp.textContent='Personel için saat; Sanatçı için sahne ücreti; Güvenlik için günlük ücret girin. Her giriş otomatik saklanır.';

  const uiStyle=document.createElement('style');
  uiStyle.textContent=`
    .accounting-tabs{display:flex;gap:7px;margin:0 0 12px;flex-wrap:wrap}
    .accounting-tab{border:1px solid #c8d0dc;background:#fff;color:#4b586c;padding:8px 15px;border-radius:999px;font-weight:800;cursor:pointer}
    .accounting-tab.active{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
    .salary-input{background:#fff3d6!important;border-color:#e6b45e!important}
    .salary-input:focus{background:#ffe8ad!important;outline:2px solid #df9d2d;outline-offset:0}
    .daily-fee-input{background:#dff7f5!important;border-color:#6fcfc7!important}
    .daily-fee-input:focus{background:#c9f0ec!important;outline:2px solid #36a99e;outline-offset:0}
    .daily-fee-cell{padding:0;width:86px;min-width:86px}
    .daily-fee-input{width:84px;height:37px;border:0;text-align:right;padding:0 7px;font-weight:800;color:#245c58}
    .role-col{position:sticky;left:190px;z-index:3;background:#fff!important;min-width:128px}
    th.role-col{z-index:7;background:#eef2f7!important}
    .role-select{width:112px;border:1px solid #c8d0dc;border-radius:6px;padding:6px;background:#fff;font-weight:800;color:#344054}
    .role-select:focus{outline:2px solid #93b4f5;border-color:#1d4ed8}
    .group-summary-card{border-color:#b8c9e8}
    .general-payment-card{border:2px solid #087f5b;background:#f0fff8}
    .general-payment-card b{color:#087f5b}
    .muted-cell{color:#8a93a3}
    @media(max-width:850px){.accounting-tabs{overflow:auto;flex-wrap:nowrap}.accounting-tab{white-space:nowrap}.role-col{left:145px}}
  `;
  document.head.appendChild(uiStyle);

  function groupLabel(group){return G.normalizeGroup(group)==='sanatci'?'Sanatçı':G.normalizeGroup(group)==='guvenlik'?'Güvenlik':'Personel'}
  function roleSelect(emp){
    const g=G.normalizeGroup(emp.group);
    return '<select class="role-select" data-role-id="'+emp.id+'" aria-label="'+esc(emp.name)+' görevi">'+
      [['personel','Personel'],['sanatci','Sanatçı'],['guvenlik','Güvenlik']].map(x=>'<option value="'+x[0]+'"'+(x[0]===g?' selected':'')+'>'+x[1]+'</option>').join('')+
      '</select>';
  }
  function withEmployeeSubset(group,fn){
    const all=db.employees;
    db.employees=all.filter(e=>G.normalizeGroup(e.group)===group);
    try{return fn();}finally{db.employees=all;}
  }
  function feeMap(emp,key=monthKey()){
    const d=detailFor(emp.id,key);
    d.dailyFees=d.dailyFees&&typeof d.dailyFees==='object'?d.dailyFees:{};
    return d.dailyFees;
  }
  function dailyFeeTotals(emp,key=monthKey()){
    const cutoff=removalDay(emp,key),fees=feeMap(emp,key);
    let total=0,visits=0;
    Object.entries(fees).forEach(([day,value])=>{
      if(+day>cutoff)return;
      const v=+value||0;
      if(v>0){total+=v;visits++;}
    });
    return {total,visits,advance:totals(emp,key).advance};
  }
  function standardSalary(emp,key=monthKey()){
    const exact=salaryVault?.salaries?.[key]?.[emp.id];
    if(Number.isFinite(+exact))return +exact;
    const prior=Object.keys(salaryVault?.salaries||{}).filter(k=>k<=key&&Number.isFinite(+salaryVault.salaries[k]?.[emp.id])).sort().reverse()[0];
    return prior?+salaryVault.salaries[prior][emp.id]:0;
  }
  function groupNet(group,key=monthKey()){
    const list=summaryEmployees(key).filter(e=>G.normalizeGroup(e.group)===group);
    if(group==='personel')return list.reduce((s,e)=>s+salaryTotals(e,key).net,0);
    return list.reduce((s,e)=>{
      const d=dailyFeeTotals(e,key);
      return s+G.calculateDailyPayment(d.total,standardSalary(e,key),d.advance);
    },0);
  }
  function generalPaymentCards(){
    const values={personel:groupNet('personel'),sanatci:groupNet('sanatci'),guvenlik:groupNet('guvenlik')};
    const total=G.calculateGeneralPayment(values);
    return [
      ['Personel Net Ödeme',fmtMoney(values.personel),'group-summary-card'],
      ['Sanatçı Net Ödeme',fmtMoney(values.sanatci),'group-summary-card'],
      ['Güvenlik Net Ödeme',fmtMoney(values.guvenlik),'group-summary-card'],
      ['Genel Toplam Ödeme',fmtMoney(total),'general-payment-card']
    ].map(x=>'<div class="card '+x[2]+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  }

  let normalized=false;
  db.employees.forEach(e=>{
    const g=G.normalizeGroup(e.group);
    if(e.group!==g){e.group=g;normalized=true;}
  });
  if(normalized) save();

  const baseRenderBoss=renderBoss;
  let accountingView='personel';
  const bossContent=$('#bossContent');
  const accountingTabs=document.createElement('div');
  accountingTabs.className='accounting-tabs';
  accountingTabs.innerHTML=[['general','Genel Özet'],['personel','Personel'],['sanatci','Sanatçı'],['guvenlik','Güvenlik']]
    .map(([id,label])=>'<button class="accounting-tab '+(id==='personel'?'active':'')+'" type="button" data-accounting-view="'+id+'">'+label+'</button>').join('');
  const bossActions=bossContent?.querySelector('.boss-actions');
  if(bossActions) bossActions.insertAdjacentElement('afterend',accountingTabs);

  renderTimesheet=function(){
    const n=daysInMonth(),emps=tableEmployees();
    $('#sheetTitle').textContent=months[+$('#month').value]+' '+$('#year').value+' Aylık Puantaj';
    let h='<thead><tr><th class="fixed-col name-col">Çalışan</th><th class="role-col">Görevi</th>';
    for(let d=1;d<=n;d++){
      const dt=new Date(+$('#year').value,+$('#month').value,d),w=dt.getDay()===0||dt.getDay()===6;
      h+='<th class="'+(w?'weekend':'')+'">'+d+'<br><small>'+['Pz','Pt','Sa','Ça','Pe','Cu','Ct'][dt.getDay()]+'</small></th>';
    }
    h+='<th>Toplam</th><th>Gün / Geliş</th></tr></thead><tbody>';
    emps.forEach(emp=>{
      const group=G.normalizeGroup(emp.group),t=totals(emp),fees=feeMap(emp),dft=dailyFeeTotals(emp);
      h+='<tr><td class="fixed-col name-col"><button class="employee-link" data-employee="'+emp.id+'">'+esc(emp.name)+(t.advance||t.note?' <span class="badge">Kayıt</span>':'')+'</button></td><td class="role-col">'+roleSelect(emp)+'</td>';
      for(let d=1;d<=n;d++){
        const dt=new Date(+$('#year').value,+$('#month').value,d),w=dt.getDay()===0||dt.getDay()===6;
        if(group==='personel'){
          const value=(monthData().hours[emp.id]||{})[d]??'';
          h+='<td class="hour-cell '+(w?'weekend':'')+'"><input class="hour-input '+hourClass(value)+'" type="text" inputmode="decimal" maxlength="5" autocomplete="off" value="'+value+'" data-last="'+value+'" data-id="'+emp.id+'" data-day="'+d+'" aria-label="'+esc(emp.name)+' '+d+'. gün saat"></td>';
        }else{
          const value=fees[d]??'',label=G.feeLabel(group);
          h+='<td class="daily-fee-cell '+(w?'weekend':'')+'"><input class="daily-fee-input" type="text" inputmode="decimal" autocomplete="off" value="'+esc(value)+'" data-last="'+esc(value)+'" data-fee-id="'+emp.id+'" data-day="'+d+'" aria-label="'+esc(emp.name)+' '+d+'. gün '+label+'"></td>';
        }
      }
      if(group==='personel')h+='<td class="total-col" id="total-'+emp.id+'">'+fmtNum(t.hours)+' saat</td><td class="total-col" id="days-'+emp.id+'">'+t.days+'</td></tr>';
      else h+='<td class="total-col money" id="fee-total-'+emp.id+'">'+fmtMoney(dft.total)+'</td><td class="total-col" id="fee-visits-'+emp.id+'">'+dft.visits+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="'+(n+4)+'">Bu ay tabloda çalışan yok. “Kişi Ekle” düğmesini kullanın.</td></tr>';
    $('#timesheet').innerHTML=h+'</tbody>';
  };

  renderSummary=function(){
    const emps=summaryEmployees();
    let all={personel:0,sanatci:0,guvenlik:0,hours:0,fees:0,advance:0};
    let h='<thead><tr><th>Çalışan</th><th>Görevi</th><th>Toplam Saat</th><th>Geliş</th><th>Toplam Sahne / Günlük Ücret</th><th>Toplam Avans</th><th>Aylık Tarihli Kayıtlar</th></tr></thead><tbody>';
    emps.forEach(e=>{
      const group=G.normalizeGroup(e.group),t=totals(e),d=dailyFeeTotals(e),entries=datedEntries(e),removed=removalMonth(e)===monthKey()?' <span class="badge">Ayrıldı '+e.removedFromDate.split('-').reverse().join('.')+'</span>':'';
      all[group]++;all.advance+=t.advance;
      if(group==='personel')all.hours+=t.hours;else all.fees+=d.total;
      h+='<tr><td><button class="employee-link" data-employee="'+e.id+'">'+esc(e.name)+removed+'</button></td><td>'+roleSelect(e)+'</td><td>'+(group==='personel'?'<b>'+fmtNum(t.hours)+'</b>':'<span class="muted-cell">—</span>')+'</td><td>'+(group==='personel'?t.days:d.visits)+'</td><td>'+(group==='personel'?'<span class="muted-cell">—</span>':'<b>'+fmtMoney(d.total)+'</b>')+'</td><td>'+fmtMoney(t.advance)+'</td><td class="note-cell">'+(entries.length?entries.map(x=>'<div>'+esc(entryText(x))+'</div>').join(''):'—')+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="7">Özetlenecek çalışan yok.</td></tr>';
    $('#summary').innerHTML=h+'</tbody>';
    $('#summaryCards').innerHTML=[
      ['Toplam Kişi',emps.length],['Personel',all.personel],['Sanatçı',all.sanatci],['Güvenlik',all.guvenlik],['Personel Toplam Saat',fmtNum(all.hours)],['Sanatçı + Güvenlik Ücret',fmtMoney(all.fees)],['Toplam Avans',fmtMoney(all.advance)]
    ].map(x=>'<div class="card"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  };

  function renderGeneralAccounting(){
    const emps=summaryEmployees();
    let h='<thead><tr><th>Çalışan</th><th>Görevi</th><th>Hesaplanan Toplam</th><th>Maaş</th><th>Avans</th><th>Net Ödeme</th><th>Prim</th></tr></thead><tbody>';
    emps.forEach(e=>{
      const group=G.normalizeGroup(e.group),salary=standardSalary(e);
      let calculated=0,advance=0,net=0,prime='—';
      if(group==='personel'){
        const t=salaryTotals(e);calculated=t.gross;advance=t.advance;net=t.net;prime=fmtMoney(PuantajPayroll.calculatePrime(t.net,salary));
      }else{
        const d=dailyFeeTotals(e);calculated=d.total;advance=d.advance;net=G.calculateDailyPayment(d.total,salary,d.advance);
      }
      h+='<tr><td>'+esc(e.name)+'</td><td>'+groupLabel(group)+'</td><td class="money">'+fmtMoney(calculated)+'</td><td>'+fmtMoney(salary)+'</td><td>'+fmtMoney(advance)+'</td><td class="net">'+fmtMoney(net)+'</td><td class="money">'+prime+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="7">Özetlenecek ödeme kaydı yok.</td></tr>';
    $('#bossTable').innerHTML=h+'</tbody>';
    $('#bossCards').innerHTML=generalPaymentCards();
  }

  function renderDailyFeeAccounting(group){
    salaryVault.salaries=salaryVault.salaries||{};
    const emps=summaryEmployees().filter(e=>G.normalizeGroup(e.group)===group),label=G.feeLabel(group),groupName=groupLabel(group);
    let all={fees:0,salary:0,advance:0,net:0};
    let h='<thead><tr><th>'+groupName+'</th><th>Geliş</th><th>Toplam '+label+'</th><th>Maaş</th><th>Avans</th><th>Net Ödeme</th></tr></thead><tbody>';
    emps.forEach(e=>{
      const d=dailyFeeTotals(e),salary=standardSalary(e),net=G.calculateDailyPayment(d.total,salary,d.advance);
      all.fees+=d.total;all.salary+=salary;all.advance+=d.advance;all.net+=net;
      h+='<tr><td>'+esc(e.name)+'</td><td>'+d.visits+'</td><td class="money">'+fmtMoney(d.total)+'</td><td><input class="salary-input" type="text" inputmode="decimal" autocomplete="off" value="'+(salary||'')+'" data-daily-salary-id="'+e.id+'" placeholder="0,00"></td><td>'+fmtMoney(d.advance)+'</td><td class="net">'+fmtMoney(net)+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="6">Ödeme hesabı yapılacak '+groupName.toLocaleLowerCase('tr-TR')+' yok.</td></tr>';
    $('#bossTable').innerHTML=h+'</tbody>';
    $('#bossCards').innerHTML=[
      ['Toplam '+label,fmtMoney(all.fees)],['Maaş',fmtMoney(all.salary)],['Toplam Avans',fmtMoney(all.advance)],['Net Ödeme',fmtMoney(all.net)]
    ].map(x=>'<div class="card"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  }

  renderBoss=function(){
    if(!bossUnlocked)return;
    const settings=document.querySelector('.overtime-settings');
    if(settings)settings.style.display=accountingView==='personel'?'grid':'none';
    accountingTabs.querySelectorAll('.accounting-tab').forEach(x=>x.classList.toggle('active',x.dataset.accountingView===accountingView));
    if(accountingView==='general')return renderGeneralAccounting();
    if(accountingView==='personel')return withEmployeeSubset('personel',baseRenderBoss);
    return renderDailyFeeAccounting(accountingView);
  };

  accountingTabs.addEventListener('click',e=>{
    const b=e.target.closest('[data-accounting-view]');if(!b)return;
    accountingView=b.dataset.accountingView;
    renderBoss();
  });

  function updateRole(select){
    const emp=db.employees.find(x=>x.id===select.dataset.roleId);if(!emp)return;
    emp.group=G.normalizeGroup(select.value);
    save();render();toast('Görev güncellendi');
  }
  $('#timesheet').addEventListener('change',e=>{const s=e.target.closest('[data-role-id]');if(s)updateRole(s)});
  $('#summary').addEventListener('change',e=>{const s=e.target.closest('[data-role-id]');if(s)updateRole(s)});

  $('#timesheet').addEventListener('input',e=>{
    const input=e.target.closest('[data-fee-id]');if(!input)return;
    const raw=input.value.trim();
    if(!/^(?:\d+(?:[.,]\d{0,2})?)?$/.test(raw)){input.value=input.dataset.last||'';return;}
    const emp=db.employees.find(x=>x.id===input.dataset.feeId);if(!emp)return;
    const fees=feeMap(emp);
    if(raw==='')delete fees[input.dataset.day];else fees[input.dataset.day]=+raw.replace(',','.');
    input.dataset.last=input.value;save();
    const t=dailyFeeTotals(emp),total=$('#fee-total-'+emp.id),visits=$('#fee-visits-'+emp.id);
    if(total)total.textContent=fmtMoney(t.total);if(visits)visits.textContent=t.visits;
  });

  $('#bossTable').addEventListener('change',async e=>{
    const input=e.target.closest('[data-daily-salary-id]');if(!input||!bossUnlocked)return;
    const value=parseManualMoney(input.value);
    if(!Number.isFinite(value)||value<0){input.setCustomValidity('Geçerli bir maaş yazın');input.reportValidity();return;}
    input.setCustomValidity('');
    salaryVault.salaries=salaryVault.salaries||{};
    salaryVault.salaries[monthKey()]=salaryVault.salaries[monthKey()]||{};
    salaryVault.salaries[monthKey()][input.dataset.dailySalaryId]=value;
    await saveSalaryVault();renderBoss();toast('Maaş kaydedildi');
  });

  const employeeBody=$('#employeeModal .modal-body');
  if(employeeBody&&!$('#newGroup')){
    const label=document.createElement('label');
    label.innerHTML='Görevi<select id="newGroup"><option value="personel">Personel</option><option value="sanatci">Sanatçı</option><option value="guvenlik">Güvenlik</option></select>';
    employeeBody.appendChild(label);
  }
  $('#employeeForm').onsubmit=e=>{
    e.preventDefault();
    db.employees.push({id:'e'+Date.now()+Math.random().toString(16).slice(2),name:upperName($('#newName').value),addedFrom:monthKey(),department:'',group:G.normalizeGroup($('#newGroup')?.value)});
    save();$('#employeeModal').close();render();toast('Kişi eklendi');
  };

  render();
})();

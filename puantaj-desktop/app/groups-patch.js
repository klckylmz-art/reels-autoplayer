(() => {
  const G=window.HayalGroupUtils;
  if(!G) throw new Error('HayalGroupUtils yüklenemedi');

  document.title='Hayal Kahvesi Puantaj';
  const title=document.querySelector('header .title h1');
  if(title) title.textContent='Hayal Kahvesi Puantaj';

  const uiStyle=document.createElement('style');
  uiStyle.textContent=`
    .group-tabs{display:flex;gap:7px;margin:-2px 0 12px;flex-wrap:wrap}
    .group-tab{border:1px solid #c8d0dc;background:#fff;color:#4b586c;padding:8px 15px;border-radius:999px;font-weight:800;cursor:pointer}
    .group-tab.active{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
    .salary-input,.daily-fee-input{background:#fff3d6!important;border-color:#e6b45e!important}
    .salary-input:focus,.daily-fee-input:focus{background:#ffe8ad!important;outline:2px solid #df9d2d;outline-offset:0}
    .daily-fee-cell{padding:0;width:86px;min-width:86px}
    .daily-fee-input{width:84px;height:37px;border:0;text-align:right;padding:0 7px;font-weight:800;color:#6f4300}
    .group-summary-card{border-color:#b8c9e8}
    .general-payment-card{border:2px solid #087f5b;background:#f0fff8}
    .general-payment-card b{color:#087f5b}
    @media(max-width:850px){.group-tabs{overflow:auto;flex-wrap:nowrap}.group-tab{white-space:nowrap}}
  `;
  document.head.appendChild(uiStyle);

  let activeGroup='personel';
  let normalized=false;
  db.employees.forEach(e=>{
    const g=G.normalizeGroup(e.group);
    if(e.group!==g){e.group=g;normalized=true;}
  });
  if(normalized) save();

  const mainTabs=document.querySelector('.tabs');
  const groupTabs=document.createElement('div');
  groupTabs.className='group-tabs';
  groupTabs.innerHTML=[['personel','Personel'],['sanatci','Sanatçı'],['guvenlik','Güvenlik']]
    .map(([id,label])=>`<button class="group-tab ${id==='personel'?'active':''}" type="button" data-work-group="${id}">${label}</button>`).join('');
  mainTabs.insertAdjacentElement('afterend',groupTabs);

  function currentGroupLabel(){return activeGroup==='personel'?'Personel':activeGroup==='sanatci'?'Sanatçı':'Güvenlik'}
  function groupEmployees(list){return list.filter(e=>G.normalizeGroup(e.group)===activeGroup)}
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
    const advance=totals(emp,key).advance;
    return {total,visits,advance};
  }
  function baseSalary(emp,key=monthKey()){
    const exact=salaryVault?.salaries?.[key]?.[emp.id];
    if(Number.isFinite(+exact))return +exact;
    const prior=Object.keys(salaryVault?.salaries||{}).filter(k=>k<=key&&Number.isFinite(+salaryVault.salaries[k]?.[emp.id])).sort().reverse()[0];
    return prior?+salaryVault.salaries[prior][emp.id]:0;
  }
  function groupNet(group,key=monthKey()){
    const all=summaryEmployees(key).filter(e=>G.normalizeGroup(e.group)===group);
    if(group==='personel')return all.reduce((s,e)=>s+salaryTotals(e,key).net,0);
    return all.reduce((s,e)=>{
      const d=dailyFeeTotals(e,key);
      return s+G.calculateDailyPayment(d.total,baseSalary(e,key),d.advance);
    },0);
  }
  function generalPaymentCards(){
    if(!bossUnlocked)return '';
    const values={personel:groupNet('personel'),sanatci:groupNet('sanatci'),guvenlik:groupNet('guvenlik')};
    const total=G.calculateGeneralPayment(values);
    return [
      ['Personel Net Ödeme',fmtMoney(values.personel),'group-summary-card'],
      ['Sanatçı Net Ödeme',fmtMoney(values.sanatci),'group-summary-card'],
      ['Güvenlik Net Ödeme',fmtMoney(values.guvenlik),'group-summary-card'],
      ['Genel Toplam Ödeme',fmtMoney(total),'general-payment-card']
    ].map(x=>`<div class="card ${x[2]}"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
  }

  const baseRenderTimesheet=renderTimesheet;
  const baseRenderSummary=renderSummary;
  const baseRenderBoss=renderBoss;

  function renderDailyFeeTimesheet(){
    const n=daysInMonth(),emps=groupEmployees(tableEmployees()),label=G.feeLabel(activeGroup);
    $('#sheetTitle').textContent=months[+$('#month').value]+' '+$('#year').value+' '+currentGroupLabel()+' '+label+' Tablosu';
    let h='<thead><tr><th class="fixed-col name-col">'+currentGroupLabel()+'</th>';
    for(let d=1;d<=n;d++){
      const dt=new Date(+$('#year').value,+$('#month').value,d),w=dt.getDay()===0||dt.getDay()===6;
      h+='<th class="'+(w?'weekend':'')+'">'+d+'<br><small>'+['Pz','Pt','Sa','Ça','Pe','Cu','Ct'][dt.getDay()]+'</small></th>';
    }
    h+='<th>Toplam '+label+'</th><th>Geliş</th></tr></thead><tbody>';
    emps.forEach(emp=>{
      const fees=feeMap(emp),t=dailyFeeTotals(emp);
      h+='<tr><td class="fixed-col name-col"><button class="employee-link" data-employee="'+emp.id+'">'+esc(emp.name)+(t.advance?' <span class="badge">Avans</span>':'')+'</button></td>';
      for(let d=1;d<=n;d++){
        const dt=new Date(+$('#year').value,+$('#month').value,d),w=dt.getDay()===0||dt.getDay()===6,val=fees[d]??'';
        h+='<td class="daily-fee-cell '+(w?'weekend':'')+'"><input class="daily-fee-input" type="text" inputmode="decimal" autocomplete="off" value="'+esc(val)+'" data-fee-id="'+emp.id+'" data-day="'+d+'" aria-label="'+esc(emp.name)+' '+d+'. gün '+label+'"></td>';
      }
      h+='<td class="total-col money" id="fee-total-'+emp.id+'">'+fmtMoney(t.total)+'</td><td class="total-col" id="fee-visits-'+emp.id+'">'+t.visits+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="'+(n+3)+'">Bu grupta kişi yok. “Kişi Ekle” düğmesini kullanın.</td></tr>';
    $('#timesheet').innerHTML=h+'</tbody>';
  }

  renderTimesheet=function(){
    if(activeGroup==='personel'){
      $('#sheetTitle').textContent=months[+$('#month').value]+' '+$('#year').value+' Personel Çalışma Saatleri';
      return withEmployeeSubset('personel',baseRenderTimesheet);
    }
    return renderDailyFeeTimesheet();
  };

  function renderDailyFeeSummary(){
    const emps=groupEmployees(summaryEmployees()),label=G.feeLabel(activeGroup);
    let all={fees:0,visits:0,advance:0};
    let h='<thead><tr><th>'+currentGroupLabel()+'</th><th>Geliş Sayısı</th><th>Toplam '+label+'</th><th>Toplam Avans</th><th>Aylık Tarihli Kayıtlar</th></tr></thead><tbody>';
    emps.forEach(e=>{
      const t=dailyFeeTotals(e),entries=datedEntries(e);
      all.fees+=t.total;all.visits+=t.visits;all.advance+=t.advance;
      h+='<tr><td><button class="employee-link" data-employee="'+e.id+'">'+esc(e.name)+'</button></td><td>'+t.visits+'</td><td class="money">'+fmtMoney(t.total)+'</td><td>'+fmtMoney(t.advance)+'</td><td class="note-cell">'+(entries.length?entries.map(x=>'<div>'+esc(entryText(x))+'</div>').join(''):'—')+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="5">Özetlenecek '+currentGroupLabel().toLocaleLowerCase('tr-TR')+' yok.</td></tr>';
    $('#summary').innerHTML=h+'</tbody>';
    $('#summaryCards').innerHTML=[
      [currentGroupLabel(),emps.length],['Toplam Geliş',all.visits],['Toplam '+label,fmtMoney(all.fees)],['Toplam Avans',fmtMoney(all.advance)]
    ].map(x=>'<div class="card"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  }

  renderSummary=function(){
    if(activeGroup==='personel')return withEmployeeSubset('personel',baseRenderSummary);
    return renderDailyFeeSummary();
  };

  function renderDailyFeeBoss(){
    if(!bossUnlocked)return;
    salaryVault.salaries=salaryVault.salaries||{};
    const emps=groupEmployees(summaryEmployees()),label=G.feeLabel(activeGroup);
    let all={fees:0,salary:0,advance:0,net:0};
    let h='<thead><tr><th>'+currentGroupLabel()+'</th><th>Geliş</th><th>Toplam '+label+'</th><th>Maaş</th><th>Avans</th><th>Net Ödeme</th></tr></thead><tbody>';
    emps.forEach(e=>{
      const d=dailyFeeTotals(e),salary=baseSalary(e),net=G.calculateDailyPayment(d.total,salary,d.advance);
      all.fees+=d.total;all.salary+=salary;all.advance+=d.advance;all.net+=net;
      h+='<tr><td><button class="employee-link" data-boss-employee="'+e.id+'">'+esc(e.name)+'</button></td><td>'+d.visits+'</td><td class="money">'+fmtMoney(d.total)+'</td><td><input class="salary-input" type="text" inputmode="decimal" autocomplete="off" value="'+(salary||'')+'" data-daily-salary-id="'+e.id+'" placeholder="0,00"></td><td>'+fmtMoney(d.advance)+'</td><td class="net">'+fmtMoney(net)+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="6">Ödeme hesabı yapılacak kişi yok.</td></tr>';
    $('#bossTable').innerHTML=h+'</tbody>';
    $('#bossCards').innerHTML=[
      ['Toplam '+label,fmtMoney(all.fees)],['Maaş',fmtMoney(all.salary)],['Toplam Avans',fmtMoney(all.advance)],['Net Ödeme',fmtMoney(all.net)]
    ].map(x=>'<div class="card"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('')+generalPaymentCards();
  }

  renderBoss=function(){
    if(!bossUnlocked)return;
    const settings=document.querySelector('.overtime-settings');
    if(settings)settings.style.display=activeGroup==='personel'?'grid':'none';
    if(activeGroup==='personel'){
      withEmployeeSubset('personel',baseRenderBoss);
      $('#bossCards').insertAdjacentHTML('beforeend',generalPaymentCards());
      return;
    }
    renderDailyFeeBoss();
  };

  groupTabs.addEventListener('click',e=>{
    const b=e.target.closest('[data-work-group]');if(!b)return;
    activeGroup=b.dataset.workGroup;
    groupTabs.querySelectorAll('.group-tab').forEach(x=>x.classList.toggle('active',x===b));
    render();
  });

  $('#timesheet').addEventListener('input',e=>{
    const input=e.target.closest('[data-fee-id]');if(!input)return;
    const raw=input.value.trim();
    if(!/^(?:\d+(?:[.,]\d{0,2})?)?$/.test(raw)){input.value=input.dataset.last||'';return;}
    const fees=feeMap(db.employees.find(x=>x.id===input.dataset.feeId));
    if(raw==='')delete fees[input.dataset.day];
    else fees[input.dataset.day]=+raw.replace(',','.');
    input.dataset.last=input.value;
    save();
    const emp=db.employees.find(x=>x.id===input.dataset.feeId),t=dailyFeeTotals(emp);
    const total=$('#fee-total-'+emp.id),visits=$('#fee-visits-'+emp.id);
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
    label.innerHTML='Grup<select id="newGroup"><option value="personel">Personel</option><option value="sanatci">Sanatçı</option><option value="guvenlik">Güvenlik</option></select>';
    employeeBody.appendChild(label);
  }
  $('#employeeForm').onsubmit=e=>{
    e.preventDefault();
    db.employees.push({id:'e'+Date.now()+Math.random().toString(16).slice(2),name:upperName($('#newName').value),addedFrom:monthKey(),group:G.normalizeGroup($('#newGroup')?.value)});
    save();$('#employeeModal').close();render();toast('Kişi eklendi');
  };

  render();
})();

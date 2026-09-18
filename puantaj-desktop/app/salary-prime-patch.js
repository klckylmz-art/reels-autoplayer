(() => {
  function standardSalary(emp,key=monthKey()){
    const exact=salaryVault?.salaries?.[key]?.[emp.id];
    if(Number.isFinite(+exact))return +exact;
    const prior=Object.keys(salaryVault?.salaries||{}).filter(k=>k<=key&&Number.isFinite(+salaryVault.salaries[k]?.[emp.id])).sort().reverse()[0];
    return prior?+salaryVault.salaries[prior][emp.id]:0;
  }

  renderBoss=function(){
    if(!bossUnlocked)return;
    salaryVault.salaries=salaryVault.salaries||{};
    const emps=summaryEmployees(),cfg=overtimeConfig();
    $('#weekdayOtMultiplier').value=cfg.weekday;$('#saturdayMultiplier').value=cfg.saturday;$('#sundayMultiplier').value=cfg.sunday;
    let all={gross:0,salary:0,prime:0,advance:0,net:0};
    let h='<thead><tr><th>Çalışan</th><th>Toplam Saat</th><th>Hafta İçi Normal</th><th>Hafta İçi 8 Saat Sonrası</th><th>Cumartesi</th><th>Pazar</th><th>Saat Ücreti</th><th>Toplam</th><th>Maaş</th><th>Avans</th><th>Yapılan Ödeme</th><th>Prim</th></tr></thead><tbody>';
    emps.forEach(e=>{
      const t=salaryTotals(e),salary=standardSalary(e),prime=PuantajPayroll.calculatePrime(t.net,salary);
      all.gross+=t.gross;all.salary+=salary;all.prime+=prime;all.advance+=t.advance;all.net+=t.net;
      h+='<tr><td><button class="employee-link" data-boss-employee="'+e.id+'">'+esc(e.name)+'</button></td><td>'+fmtNum(t.hours)+'</td><td>'+fmtNum(t.weekdayBase)+'</td><td>'+fmtNum(t.weekdayOt)+'</td><td>'+fmtNum(t.sat)+'</td><td>'+fmtNum(t.sun)+'</td><td><input class="salary-input" type="text" inputmode="decimal" autocomplete="off" value="'+(t.rate||'')+'" data-salary-id="'+e.id+'" placeholder="0,00"></td><td class="money">'+fmtMoney(t.gross)+'</td><td><input class="salary-input" type="text" inputmode="decimal" autocomplete="off" value="'+(salary||'')+'" data-base-salary-id="'+e.id+'" placeholder="0,00" title="Kopyala-yapıştır kullanılabilir"></td><td>'+fmtMoney(t.advance)+'</td><td class="net">'+fmtMoney(t.net)+'</td><td class="money">'+fmtMoney(prime)+'</td></tr>';
    });
    if(!emps.length)h+='<tr><td class="empty" colspan="12">Maaş hesabı yapılacak çalışan yok.</td></tr>';
    $('#bossTable').innerHTML=h+'</tbody>';
    $('#bossCards').innerHTML=[['Toplam',fmtMoney(all.gross)],['Maaş',fmtMoney(all.salary)],['Toplam Prim',fmtMoney(all.prime)],['Toplam Avans',fmtMoney(all.advance)],['Yapılan Ödeme',fmtMoney(all.net)]].map(x=>'<div class="card"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  };

  $('#bossTable').addEventListener('change',async e=>{
    const input=e.target.closest('[data-base-salary-id]');
    if(!input||!bossUnlocked)return;
    const value=parseManualMoney(input.value);
    if(!Number.isFinite(value)||value<0){input.setCustomValidity('Geçerli bir maaş yazın');input.reportValidity();return}
    input.setCustomValidity('');
    salaryVault.salaries=salaryVault.salaries||{};
    salaryVault.salaries[monthKey()]=salaryVault.salaries[monthKey()]||{};
    salaryVault.salaries[monthKey()][input.dataset.baseSalaryId]=value;
    await saveSalaryVault();
    renderBoss();
    toast('Maaş kaydedildi');
  });
})();

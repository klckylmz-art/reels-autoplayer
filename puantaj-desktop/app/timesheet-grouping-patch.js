(() => {
  const G=window.HayalGroupUtils;
  if(!G||typeof G.sortByGroupThenName!=='function') throw new Error('Gruplu sıralama yardımcıları yüklenemedi');

  const style=document.createElement('style');
  style.textContent=`
    #timesheet thead th{
      position:sticky;
      top:0;
      z-index:8;
      background:#eef2f7!important;
      box-shadow:0 1px 0 #cfd7e3;
    }
    #timesheet thead th.fixed-col{z-index:11}
    #timesheet thead th.role-col{z-index:10}
    #timesheet .work-group-row th{
      position:relative;
      left:auto;
      background:#e8eef8!important;
      color:#243b64;
      text-align:left;
      font-size:12px;
      letter-spacing:.04em;
      padding:8px 12px;
      border-top:2px solid #9fb3d5;
      border-bottom:1px solid #c8d4e7;
    }
    #timesheet .work-group-row:first-child th{border-top:0}
    #timesheet .group-entry-note{
      margin-left:10px;
      font-weight:700;
      letter-spacing:0;
      color:#5b6780;
      font-size:11px;
    }
  `;
  document.head.appendChild(style);

  function groupLabel(group){
    const g=G.normalizeGroup(group);
    return g==='sanatci'?'SANATÇI':g==='guvenlik'?'GÜVENLİK':'PERSONEL';
  }
  function groupNote(group){
    const g=G.normalizeGroup(group);
    if(g==='personel') return 'Çalışma saati girilir. Tam gün için 8 saat girin.';
    if(g==='sanatci') return 'Günlük ücret girilir.';
    return 'Günlük ücret girilir.';
  }
  function roleSelect(emp){
    const g=G.normalizeGroup(emp.group);
    return '<select class="role-select" data-role-id="'+emp.id+'" aria-label="'+esc(emp.name)+' görevi">'+
      [['personel','Personel'],['sanatci','Sanatçı'],['guvenlik','Güvenlik']].map(x=>'<option value="'+x[0]+'"'+(x[0]===g?' selected':'')+'>'+x[1]+'</option>').join('')+
      '</select>';
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

  renderTimesheet=function(){
    const n=daysInMonth(),emps=G.sortByGroupThenName(tableEmployees());
    $('#sheetTitle').textContent=months[+$('#month').value]+' '+$('#year').value+' Aylık Puantaj';
    let h='<thead><tr><th class="fixed-col name-col">Çalışan</th><th class="role-col">Görevi</th>';
    for(let d=1;d<=n;d++){
      const dt=new Date(+$('#year').value,+$('#month').value,d),w=dt.getDay()===0||dt.getDay()===6;
      h+='<th class="'+(w?'weekend':'')+'">'+d+'<br><small>'+['Pz','Pt','Sa','Ça','Pe','Cu','Ct'][dt.getDay()]+'</small></th>';
    }
    h+='<th>Toplam</th><th>Gün / Geliş</th></tr></thead><tbody>';

    let previousGroup='';
    emps.forEach(emp=>{
      const group=G.normalizeGroup(emp.group);
      if(group!==previousGroup){
        h+='<tr class="work-group-row"><th colspan="'+(n+4)+'">'+groupLabel(group)+'<span class="group-entry-note">'+groupNote(group)+'</span></th></tr>';
        previousGroup=group;
      }
      const t=totals(emp),fees=feeMap(emp),dft=dailyFeeTotals(emp);
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

  renderTimesheet();
})();

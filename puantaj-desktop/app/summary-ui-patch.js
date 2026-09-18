(() => {
  // AYLIK ÖZET GRUPLAMA + MUHASEBE INPUT / PARA SÜTUN DÜZENİ
  const style=document.createElement('style');
  style.textContent=`
    #bossTable td:has(.salary-input){padding:0!important}
    #bossTable .salary-input{width:100%!important;height:100%!important;min-height:48px!important;box-sizing:border-box!important;border-radius:0!important;display:block!important;padding:0 10px!important;text-align:right!important}

    #bossTable.personnel-accounting{width:100%!important;table-layout:fixed!important}
    #bossTable.personnel-accounting th,#bossTable.personnel-accounting td{overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
    #bossTable.personnel-accounting th:nth-child(1),#bossTable.personnel-accounting td:nth-child(1){width:14%!important}
    #bossTable.personnel-accounting th:nth-child(2),#bossTable.personnel-accounting td:nth-child(2){width:6%!important}
    #bossTable.personnel-accounting th:nth-child(3),#bossTable.personnel-accounting td:nth-child(3){width:7%!important}
    #bossTable.personnel-accounting th:nth-child(4),#bossTable.personnel-accounting td:nth-child(4){width:9%!important}
    #bossTable.personnel-accounting th:nth-child(5),#bossTable.personnel-accounting td:nth-child(5){width:6%!important}
    #bossTable.personnel-accounting th:nth-child(6),#bossTable.personnel-accounting td:nth-child(6){width:5%!important}
    #bossTable.personnel-accounting th:nth-child(7),#bossTable.personnel-accounting td:nth-child(7){width:9%!important}
    #bossTable.personnel-accounting th:nth-child(8),#bossTable.personnel-accounting td:nth-child(8){width:9%!important;min-width:105px!important}
    #bossTable.personnel-accounting th:nth-child(9),#bossTable.personnel-accounting td:nth-child(9){width:9%!important}
    #bossTable.personnel-accounting th:nth-child(10),#bossTable.personnel-accounting td:nth-child(10){width:7%!important;min-width:90px!important}
    #bossTable.personnel-accounting th:nth-child(11),#bossTable.personnel-accounting td:nth-child(11){width:9%!important;min-width:115px!important}
    #bossTable.personnel-accounting th:nth-child(12),#bossTable.personnel-accounting td:nth-child(12){width:8%!important;min-width:95px!important}
    #bossTable.personnel-accounting td:nth-child(n+8){white-space:nowrap!important}

    #bossTable .payment-value,#bossTable .net{color:#111!important;font-weight:700!important}
    #bossTable .prime-positive{color:#15803d!important;font-weight:800!important}
    #bossTable .prime-negative{color:#b91c1c!important;font-weight:800!important}
    #bossTable .prime-zero{color:#111!important;font-weight:800!important}

    #summary .summary-group-row th{background:#e8eef8!important;color:#243b64!important;text-align:left!important;font-size:12px!important;letter-spacing:.04em!important;padding:8px 12px!important;border-top:2px solid #9fb3d5!important;border-bottom:1px solid #c8d4e7!important}
    #summary .summary-group-row:first-child th{border-top:0!important}
  `;
  document.head.appendChild(style);

  function moneyNumber(text){
    let s=String(text||'').replace(/[^0-9,.-]/g,'');
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    return Number(s)||0;
  }
  function syncAccountingLayout(){
    const table=$('#bossTable');
    if(!table)return;
    const headers=[...table.querySelectorAll('thead th')];
    headers.forEach(th=>{if(th.textContent.trim()==='Net Ödeme')th.textContent='Yapılan Ödeme'});
    const names=headers.map(x=>x.textContent.trim());
    const isPersonnel=names.includes('Saat Ücreti')&&names.includes('Toplam')&&names.includes('Prim')&&names.length===12;
    table.classList.toggle('personnel-accounting',isPersonnel);

    const primeIndex=names.indexOf('Prim');
    if(primeIndex>=0){
      table.querySelectorAll('tbody tr').forEach(row=>{
        const cell=row.cells[primeIndex];if(!cell)return;
        cell.classList.remove('prime-positive','prime-negative','prime-zero');
        const v=moneyNumber(cell.textContent);
        cell.classList.add(v>0?'prime-positive':v<0?'prime-negative':'prime-zero');
      });
    }
    document.querySelectorAll('#bossCards small').forEach(x=>{
      if(x.textContent.includes('Net Ödeme'))x.textContent=x.textContent.replace('Net Ödeme','Yapılan Ödeme');
    });
  }
  const bossTable=$('#bossTable');
  const bossCards=$('#bossCards');
  if(bossTable){new MutationObserver(syncAccountingLayout).observe(bossTable,{childList:true,subtree:true});}
  if(bossCards){new MutationObserver(syncAccountingLayout).observe(bossCards,{childList:true,subtree:true});}
  syncAccountingLayout();

  const baseRenderSummary=renderSummary;
  function groupInfo(row){
    const select=row.querySelector('[data-role-id]');
    const v=select?select.value:'personel';
    if(v==='sanatci')return {id:'sanatci',label:'SANATÇI',order:1};
    if(v==='guvenlik')return {id:'guvenlik',label:'GÜVENLİK',order:2};
    return {id:'personel',label:'PERSONEL',order:0};
  }
  renderSummary=function(){
    baseRenderSummary();
    const table=$('#summary');
    const tbody=table?.querySelector('tbody');
    if(!tbody)return;
    const rows=[...tbody.querySelectorAll('tr')].filter(r=>!r.classList.contains('empty')&&!r.classList.contains('summary-group-row'));
    if(!rows.length)return;
    rows.sort((a,b)=>{
      const ga=groupInfo(a),gb=groupInfo(b);
      if(ga.order!==gb.order)return ga.order-gb.order;
      const an=(a.cells[0]?.innerText||'').trim(),bn=(b.cells[0]?.innerText||'').trim();
      return an.localeCompare(bn,'tr-TR',{sensitivity:'base'});
    });
    tbody.innerHTML='';
    let last='';
    const cols=table.querySelectorAll('thead th').length||7;
    rows.forEach(row=>{
      const g=groupInfo(row);
      if(g.id!==last){
        const header=document.createElement('tr');
        header.className='summary-group-row';
        const th=document.createElement('th');
        th.colSpan=cols;
        th.textContent=g.label;
        header.appendChild(th);
        tbody.appendChild(header);
        last=g.id;
      }
      tbody.appendChild(row);
    });
  };

  if(document.querySelector('#summary')) renderSummary();
})();

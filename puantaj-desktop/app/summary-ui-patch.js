(() => {
  // AYLIK ÖZET GRUPLAMA + MUHASEBE INPUT TAM HÜCRE
  const style=document.createElement('style');
  style.textContent=`
    #bossTable td:has(.salary-input){padding:0!important}
    #bossTable .salary-input{width:100%!important;height:100%!important;min-height:48px!important;box-sizing:border-box!important;border-radius:0!important;display:block!important;padding:0 14px!important;text-align:right!important}
    #summary .summary-group-row th{background:#e8eef8!important;color:#243b64!important;text-align:left!important;font-size:12px!important;letter-spacing:.04em!important;padding:8px 12px!important;border-top:2px solid #9fb3d5!important;border-bottom:1px solid #c8d4e7!important}
    #summary .summary-group-row:first-child th{border-top:0!important}
  `;
  document.head.appendChild(style);

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

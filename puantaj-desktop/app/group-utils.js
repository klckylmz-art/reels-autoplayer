(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HayalGroupUtils=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const GROUPS=new Set(['personel','sanatci','guvenlik']);
  const GROUP_ORDER={personel:0,sanatci:1,guvenlik:2};
  function normalizeGroup(value){
    const v=String(value||'').toLocaleLowerCase('tr-TR');
    return GROUPS.has(v)?v:'personel';
  }
  function feeLabel(group){
    return normalizeGroup(group)==='sanatci'?'Sahne Ücreti':normalizeGroup(group)==='guvenlik'?'Günlük Ücret':'Saat Ücreti';
  }
  function calculateDailyPayment(totalFees,salary,advance){
    return (+totalFees||0)-(+salary||0)-(+advance||0);
  }
  function calculateGeneralPayment(values){
    return (+values?.personel||0)+(+values?.sanatci||0)+(+values?.guvenlik||0);
  }
  function sortByGroupThenName(list){
    return [...(list||[])].sort((a,b)=>{
      const ga=normalizeGroup(a?.group),gb=normalizeGroup(b?.group);
      const groupDiff=GROUP_ORDER[ga]-GROUP_ORDER[gb];
      if(groupDiff)return groupDiff;
      return String(a?.name||'').localeCompare(String(b?.name||''),'tr',{sensitivity:'base'});
    });
  }
  return {normalizeGroup,feeLabel,calculateDailyPayment,calculateGeneralPayment,sortByGroupThenName};
});

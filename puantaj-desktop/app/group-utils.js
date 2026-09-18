(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HayalGroupUtils=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const GROUPS=new Set(['personel','sanatci','guvenlik']);
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
  return {normalizeGroup,feeLabel,calculateDailyPayment,calculateGeneralPayment};
});

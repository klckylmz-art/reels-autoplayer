(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PuantajPayroll=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function calculatePrime(calculatedSalary,standardSalary){
    return (+calculatedSalary||0)-(+standardSalary||0);
  }
  return {calculatePrime};
});

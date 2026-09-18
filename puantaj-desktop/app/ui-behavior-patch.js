(() => {
  const tabs=document.querySelector('.accounting-tabs');
  if(!tabs)return;
  const general=tabs.querySelector('[data-accounting-view="general"]');
  if(general)tabs.appendChild(general);
})();

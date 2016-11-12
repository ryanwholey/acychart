function formatIncomeAndExpense() {
  if(!window.acyData) {
    console.log('no global data object');
    return 
  }

  window.expense = _(acyData).chain().map(({expense}) => expense).flatten().valueOf();

  window.income = _(acyData).chain().map(({income}) => income).flatten().valueOf();

}

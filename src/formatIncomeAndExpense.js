function formatIncomeAndExpense() {
  if (!window.acyData) {
    console.log('no global data object');
    return
  }
  window.chartData = [];

  _(acyData).each(function(data, type) {
    let setData = {type};

    setData.expense = _(data).chain().map(({expense}) => expense).flatten().valueOf();
    setData.income  = _(data).chain().map(({income}) => income).flatten().valueOf();
    window.chartData.push(setData);
  });
}

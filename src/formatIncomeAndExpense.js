function formatIncomeAndExpense() {
  if (!window.acyData) {
    console.log('no global data object');
    return
  }
  window.chartData = [];

  _(acyData).each(function(data, type) {
    var setData = {type};

    setData.expense = _(data).chain().map(function(data) {
      return data.expense;
    })
    .flatten()
    .valueOf();

    setData.income  = _(data).chain().map(function(data) {
      return data.income;
    })
    .flatten()
    .valueOf();
    window.chartData.push(setData);
  });
}

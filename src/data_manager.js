function djFormatData(data, type) {
  var _memo = {combined: data, expense:[], income:[], type: type};
  if (!data.reduce) {
    console.log('data is not defined, there was probably an error getting data from the server');
    return
  }
  return data.reduce(function(memo, item) {
    var account = item.amount < 0 ? 'expense' : 'income';
    item.date = new Date(item.date);
    memo[account].push(item);
    return memo;
  }, _memo);
}

function djRunningTotals(data) {
  var totals = [];
  var dateMin;
  var dateMax;
  var pointer;
  var end;
  var runningTotal;
  var isBefore;

  dateMin = d3.min(data.map(function(set) {
    return d3.min(set.combined.map(function(d){return d.date}))
  }));

  dateMax = d3.max(data.map(function(set) {
    return d3.max(set.combined.map(function(d){return d.date}))
  }));

  window.xMin = dateMin;
  window.xMax = dateMax;

  data.forEach(function(set) {
    pointer = moment(new Date(moment(dateMin).format('LL')))
    end = moment(new Date(moment(dateMax).format('LL')))
    set.running = [];
    while (pointer.isSameOrBefore(end)) {
      set.running.push({date: pointer.toDate()});
      pointer.add(1, 'day');
    }
  });

  pointer = 0;
  runningTotal = 0;

  data.forEach(function(set) {
    pointer = 0;
    runningTotal = 0;
    set.combined.forEach(function(datum) {
      set.running[pointer].amount = runningTotal;

      isBefore  = moment(set.running[pointer])
      while(set.running[pointer] && moment(set.running[pointer].date).isBefore(datum.date)) {
        set.running[pointer].amount = runningTotal;
        pointer += 1;
      }
      runningTotal += datum.amount
    });

    set.runningTotalByDate = set.running.reduce(function(memo, item) {

      return (_.extend(memo, {[item.date] : item.amount }));
    }, {});
  });
}

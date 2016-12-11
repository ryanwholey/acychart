window.acyData = {};
var incomeOrExpense = 'income';
var monthToNum = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12
};

var monthIndex = {};

var rowMap = ['date', 'category', 'amount', 'description', 'tag'];

function parseMonths(rawMonths) {
  var months = [];
  var month = '';

  for (var i = 0; i < rawMonths.length; i++) {
    if (rawMonths[i] !== ',') {
      month += rawMonths[i];
    } else if (rawMonths[i] === ',') {
      months.push(month);
      month = '';
      while (rawMonths[i] === ',') {
        i += 1;
      }
      i -= 1;
    }
  }
  return months;
}

function parseRow(row) {
  var formattedRow = [];
  var pointer = -1;

  row.forEach(function(item, i) {
    var mapIndex = i % 5;
    if (mapIndex === 0) {
      pointer += 1;
      formattedRow.push({});
    } else if (mapIndex === 2) {
      item = parseFloat(item);

    } else if (mapIndex === 4) {
      item = item.split('|').map(function(tag) {
        return tag.trim();
      });
    }
    formattedRow[pointer][rowMap[mapIndex]] = item;
  });
  return formattedRow;
}

function formatData(data) {
  data.forEach(function(dataSet) {
    data = dataSet.data.split('\n');
    acyData[dataSet.type] = [];

    var months = parseMonths(data[0]);
    months.forEach(function(month, i) {
      monthIndex[monthToNum[month]] = i;
      acyData[dataSet.type].push(
        {
          month: month,
          income: [],
          expense: []
        }
      );
    });

    data.forEach(function(row, i) {
      //nothing important here
      if ( i < 3) {
        return;
      }

      var splitRow = row.split(',');
      if (splitRow[0] === 'Expense') {
        incomeOrExpense = 'expense';
      }
      formattedRow = parseRow(splitRow);
      formattedRow.forEach(function(entry) {
        if (entry.date === '' || entry.date === 'Expense') {
          return;
        }
        var monthNum = entry.date.split('/')[0];
        if (acyData[dataSet.type][monthIndex[monthNum]]) {
          acyData[dataSet.type][monthIndex[monthNum]][incomeOrExpense].push(entry);
        }
      });
    });
    incomeOrExpense = 'income';
  });
}

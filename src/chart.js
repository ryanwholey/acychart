var CONTAINER_WIDTH = 1400;
var CONTAINER_HEIGHT = 700;
var CHART_WIDTH = 1300;
var CHART_HEIGHT = 650;
var TOP = 25;
var MID_HEIGHT = CHART_HEIGHT / 2;
var LEFT = 50;
var tooltipEntries = {
  projected: 'red',
  actual: 'lightskyblue'
};
var svg;

function attachGroups() {
  var groups = [
    'axisGroup',
    'tickGroup',
    'lineGroup',
    'pointGroup',
    'metaGroup',
  ];

  if (svg) {
    svg.selectAll('g')
      .data(groups)
      .enter()
      .append('g')
      .attr('class', function(cls){
        return cls;
      })
      .attr('transform', `translate(${TOP, LEFT})`);
  }
}

function _appendYear(dateString) {
    var monthNum = parseInt(dateString.split('/')[0]);
    var year = monthNum < 5 ? '2017' : '2016';

    return dateString + '/' + year;
}

function formatDataWithDates(data) {
  data.forEach(function(dataSet) {
    var incomeWithDate = dataSet.income.map(function(datum) {
      datum.date = new Date(_appendYear(datum.date));
      return datum;
    });

    dataSet.combined = dataSet.expense.reduce(function(memo, item) {
      item.amount = item.amount * -1;
      item.date = new Date(_appendYear(item.date));
      memo.push(item);
      return memo;
    }, incomeWithDate);

    dataSet.combined = _(dataSet.combined).sortBy('date');
  });
}

function _computeDateBounds(set, bound) {
  var dataType = bound[0] === 'x' ? 'date' : 'amount';
  var calculated = d3['m' + bound.substr(2)](set, function(d){
    return d[dataType];
  });

  window[bound] = window[bound] !== undefined ?
    Math['m'+ bound.substr(2)](window[bound], calculated) : calculated;
}

function calculateRunningTotals(data) {
  var bounds = ['xMin', 'xMax'];

  data.forEach(function(dataSet)  {

    bounds.forEach(function(bound) {
      _computeDateBounds(dataSet.combined, bound) ;
    });

    dataSet.running = [];
    var pointer = moment(xMin);
    var end = moment(xMax);

    while (pointer.isSameOrBefore(end)) {
      dataSet.running.push({date: pointer.toDate()});
      pointer.add(1, 'day');
    }

    pointer = 0;
    runningTotal = 0;
    dataSet.combined.forEach(function(datum) {
      dataSet.running[pointer].amount = runningTotal;
      isBefore = moment(dataSet.running[pointer].date).isBefore(datum.date);
      while (moment(dataSet.running[pointer].date).isBefore(datum.date)) {
        dataSet.running[pointer].amount = runningTotal;
        pointer += 1;
      }
      runningTotal += datum.amount;
    });

    dataSet.runningTotalByDate = dataSet.running.reduce(function(memo, item) {
      return (_.extend(memo, {[item.date] : item.amount }));
    }, {});
  });
}

function buildAxis(data) {
  var yAbs;

  data.forEach(function(dataSet) {
    var calcAbsolute = d3.max(dataSet.running.map(function(data) {
      return data.amount;
    }));

    if (yAbs === undefined) {
      yAbs = calcAbsolute;
    } else {
      yAbs = Math.max(yAbs, calcAbsolute);
    }
  });

  yMax = yAbs + yAbs * 0.2;
  yMin = -0.3 * yAbs;

  window.yScale = d3.scaleLinear()
    .domain([yMax, yMin])
    .range([TOP, TOP + CHART_HEIGHT]);

  window.xScale = d3.scaleTime()
    .domain([xMin, xMax])
    .range([LEFT, LEFT + CHART_WIDTH]);

  window.yAxis = d3.axisLeft(yScale)
    .ticks(15)

  window.xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth)
    .tickFormat(d3.timeFormat('%b'))
    .tickSizeOuter(0)

  d3.select('.axisGroup')
    .append('g')
    .attr('class', 'xAxis')
    .attr('transform', `translate(${-LEFT}, ${yScale(0)})`)
    .call(xAxis)

  d3.select('.axisGroup')
    .append('g')
    .attr('class', 'yAxis')
    .call(yAxis)
}

function buildDataLines(data) {
  var line = d3.line()
    .x(function(d) {
      return xScale(d.date);
    })
    .y(function(d) {
      return yScale(d.amount);
    });

  data.forEach(function(dataSet) {
    d3.select('.lineGroup')
      .append('path')
      .datum(dataSet.running)
      .attr('class', 'line')
      .attr('d', line)
      .attr('transform', `translate(${-LEFT}, 0)`)
      .style('stroke', tooltipEntries[dataSet.type]);
  });
}

function appendTooltipBase() {
  window.tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip');

  window.cursorLine = d3.select('.metaGroup')
    .append('line')
    .attr('class', 'cursorLine')
    .attr('stroke', 'red')
    .attr('stroke-width', 1)
    .attr('height', CHART_HEIGHT);
}

function addMetaRect() {
  d3.select('.metaGroup')
    .append('rect')
    .attr('class', 'metaRect')
    .attr('width', CHART_WIDTH)
    .attr('height', CHART_HEIGHT)
    .attr('transform', `translate(0, ${TOP})`)
    .style('opacity', 0);
}

function _getTooltipText(mouseX) {
  var date = new Date(xScale.invert(mouseX).setHours(0,0,0,0));
  var formattedDate = d3.timeFormat('%a %b %d %Y')(date);
  var possibleEntries = data.map(function(data) {
    return data.type;
  });
  var entries = Object.keys(tooltipEntries).filter(function(entry) {
    return possibleEntries.indexOf(entry) >= 0;
  });
  var amounts = entries.reduce(function(memo, entry) {
    memo[entry] = d3.format('$,.2f')(data.filter(function(dataSet) {
      return dataSet.type === entry;
    })[0].runningTotalByDate[date]);
    return memo;
  }, {});

  entries = entries.filter(function(entry) {
    return amounts[entry] !== '$NaN';
  });

  var rawHtmlEntries = entries.map(function(entry) {
    return `
      <div class="tooltip_entry">
        <div class="tooltip_entry__legend_key" style="background: ${tooltipEntries[entry]}">.</div>
        <p class=tooltip_entry__title>${entry}</p>
        <p class=tooltip_entry__amount> ${amounts[entry]} </p>
      </div>
    `;
  });

  return `
    <div>${formattedDate}</div>
    ${rawHtmlEntries.join()}
  `;
}

function addTooltip(data) {
  appendTooltipBase();

  d3.select('svg')
    .on('mousemove', function() {
      tooltip.html(_getTooltipText(d3.event.pageX))
        .style('left', `${d3.event.pageX}px`)
        .style('top', '200px')
        .style('opacity', 0.9);

      cursorLine
        .attr('x1', d3.event.pageX - LEFT)
        .attr('y1', TOP)
        .attr('x2', d3.event.pageX - LEFT)
        .attr('y2', TOP + CHART_HEIGHT)
        .style('opacity', 0.9)
    })
    .on('mouseout', function() {
      tooltip
        .style('opacity', 0)

      cursorLine
        .style('opacity', 0)
    });
}

function buildChart(selector, data) {
  svg = d3.select(selector).append('svg')
    .attr('width', CONTAINER_WIDTH)
    .attr('height', CONTAINER_HEIGHT)
  window.data = data;

  attachGroups();
  addMetaRect();
  formatDataWithDates(data);
  calculateRunningTotals(data);
  buildAxis(data);
  buildDataLines(data);
  addTooltip(data);
}
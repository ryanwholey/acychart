const CONTAINER_WIDTH = 1400;
const CONTAINER_HEIGHT = 700;
const CHART_WIDTH = 1300;
const CHART_HEIGHT = 650;
const TOP = 25;
const MID_HEIGHT = CHART_HEIGHT / 2;
const LEFT = 50;
const tooltipEntries = {
  projected: 'red',
  actual: 'lightskyblue'
};
let svg;

function attachGroups() {
  let groups = [
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
      .attr('class', (cls) => cls)
      .attr('transform', `translate(${TOP, LEFT})`);
  }
}

function _appendYear(dateString) {
    let monthNum = parseInt(dateString.split('/')[0]);
    let year = monthNum < 5 ? '2017' : '2016';

    return dateString + '/' + year;
}

function formatDataWithDates(data) {
  data.forEach(function(dataSet) {
    let incomeWithDate = dataSet.income.map((datum) => {
      datum.date = new Date(_appendYear(datum.date));
      return datum;
    });

    dataSet.combined = dataSet.expense.reduce((memo, item) => {
      item.amount = item.amount * -1;
      item.date = new Date(_appendYear(item.date));
      memo.push(item);
      return memo;
    }, incomeWithDate);

    dataSet.combined = _(dataSet.combined).sortBy('date');
  });
}

function _computeDateBounds(set, bound) {
  let dataType = bound[0] === 'x' ? 'date' : 'amount';
  let calculated = d3['m' + bound.substr(2)](set, (d) => d[dataType]);

  window[bound] = window[bound] !== undefined ?
    Math['m'+ bound.substr(2)](window[bound], calculated) : calculated;
}

function calculateRunningTotals(data) {
  let bounds = ['xMin', 'xMax'];

  data.forEach((dataSet) => {

    bounds.forEach((bound) => {
      _computeDateBounds(dataSet.combined, bound) ;
    });

    dataSet.running = [];
    let pointer = moment(xMin);
    let end = moment(xMax);

    while (pointer.isSameOrBefore(end)) {
      dataSet.running.push({date: pointer.toDate()});
      pointer.add(1, 'day');
    }

    pointer = 0;
    runningTotal = 0;
    dataSet.combined.forEach((datum) => {
      dataSet.running[pointer].amount = runningTotal;
      isBefore = moment(dataSet.running[pointer].date).isBefore(datum.date);
      while (moment(dataSet.running[pointer].date).isBefore(datum.date)) {
        dataSet.running[pointer].amount = runningTotal;
        pointer += 1;
      }
      runningTotal += datum.amount;
    });

    dataSet.runningTotalByDate = dataSet.running.reduce((memo, item) => (_.extend(memo, {
      [item.date] : item.amount
    })),{});
  });
}

function buildAxis(data) {
  let yAbs;

  data.forEach((dataSet) => {
    let calcAbsolute = d3.max(dataSet.running.map(({amount}) => amount));

    if (yAbs === undefined) {
      yAbs = calcAbsolute;
    } else {
      yAbs = Math.max(yAbs, calcAbsolute);
    }
  });

  yMax = yAbs + yAbs * .2;
  yMin = -.3 * yAbs;

  window.yScale = d3.scaleLinear()
    .domain([yMax, yMin])
    .range([TOP, TOP + CHART_HEIGHT])

  window.xScale = d3.scaleTime()
    .domain([xMin, xMax])
    .range([LEFT, LEFT + CHART_WIDTH])

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
  let line = d3.line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.amount));

  data.forEach((dataSet) => {
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
  let date = new Date(xScale.invert(mouseX).setHours(0,0,0,0));
  let formattedDate = d3.timeFormat('%a %b %d %Y')(date);
  let possibleEntries = data.map(({type}) => type);
  let entries = Object.keys(tooltipEntries).filter((entry) => possibleEntries.indexOf(entry) >= 0);
  let amounts = entries.reduce((memo, entry) => {
    memo[entry] = d3.format('$,.2f')(data.filter((dataSet) => dataSet.type === entry)[0].runningTotalByDate[date]);
    return memo;
  }, {});

  entries = entries.filter((entry) => amounts[entry] != '$NaN');

  let rawHtmlEntries = entries.map((entry) => {
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
    .on('mousemove', () => {
      tooltip.html(_getTooltipText(d3.event.pageX))
        .style('left', `${d3.event.pageX}px`)
        .style('top', '200px')
        .style('opacity', .9);

      cursorLine
        .attr('x1', d3.event.pageX - LEFT)
        .attr('y1', TOP)
        .attr('x2', d3.event.pageX - LEFT)
        .attr('y2', TOP + CHART_HEIGHT)
        .style('opacity', .9)
    })
    .on('mouseout', () => {
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
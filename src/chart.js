const CONTAINER_WIDTH = 700;
const CONTAINER_HEIGHT = 500;
const CHART_WIDTH = 600;
const CHART_HEIGHT = 450;
const TOP = 25;
const MID_HEIGHT = CHART_HEIGHT / 2;
const LEFT = 50;
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
      .attr('transform', `translate(${TOP, LEFT})`)
  }
}

function _appendYear(dateString) {
    let monthNum = parseInt(dateString.split('/')[0]);
    let year = monthNum < 5 ? '2017' : '2016'
    return dateString + '/' + year;
}

function formatDataWithDates(data) {
  data.incomeWithDate = data.income.map((datum) => {
    datum.date = new Date(_appendYear(datum.date));
    return datum;
  });

  data.combined = data.expense.reduce((memo, item) => {
    item.amount = item.amount * -1;
    item.date = new Date(_appendYear(item.date));
    memo.push(item);
    return memo;
  }, data.incomeWithDate);
  data.combined = _(data.combined).sortBy('date');
}

function minAndMax(data) {
  window.xMin = d3.min(data.combined, (d) => d.date);
  window.xMax = d3.max(data.combined, (d) => d.date);
  window.yMax = d3.max(data.combined, (d) => d.amount);
  window.yMin = d3.min(data.combined, (d) => d.amount);

  data.running = [];
  let pointer = moment(xMin);
  let end = moment(xMax);

  while(pointer.isSameOrBefore(end)) {
    data.running.push({date: pointer.toDate()});
    pointer.add(1, 'day');
  }
  
  pointer = 0;
  runningTotal = 0;
  data.combined.forEach((datum) => {
    data.running[pointer].amount = runningTotal;
    isBefore = moment(data.running[pointer].date).isBefore(datum.date);
    while(moment(data.running[pointer].date).isBefore(datum.date)) {
      data.running[pointer].amount = runningTotal;
      pointer += 1;
    }
    runningTotal += datum.amount;
  });
}

function buildAxis(data) {
  yAbs = d3.max(data.running.map(({amount}) => amount));
  yMax = yAbs + yAbs * .2;
  yMin = -.3 * yAbs;
  yScale = d3.scaleLinear()
    .domain([yMax, yMin])
    .range([TOP, TOP+CHART_HEIGHT])

  xScale = d3.scaleTime()
    .domain([xMin, xMax])
    .range([LEFT, LEFT + CHART_WIDTH])

  window.yAxis = d3.axisLeft(yScale)
    .ticks(10)

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
    .x((d) =>  xScale(d.date) )
    .y((d) =>  yScale(d.amount) );

    d3.select('.lineGroup')
      .append('path')
      .datum(data.running)
      .attr('class', 'line')
      .attr('d', line)
      .attr('transform', `translate(${-LEFT}, 0)`)
}

function appendTooltipBase() {
  window.tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')

  window.cursorLine = d3.select('.metaGroup')
    .append('line')
    .attr('class', 'cursorLine')
    .attr('stroke', 'red')
    .attr('stroke-width', 1)
    .attr('height', CHART_HEIGHT)
}

function addMetaRect() {
  d3.select('.metaGroup')
    .append('rect')
    .attr('class', 'metaRect')
    .attr('width', CHART_WIDTH)
    .attr('height', CHART_HEIGHT)
    .attr('transform', `translate(0, ${TOP})`)
    .style('opacity', 0)
}

function addToolTip(data) {
  appendTooltipBase();

  
 
  d3.select('svg')
    .on('mousemove', () => {
      tooltip.text('hi')
        .style('left', `${d3.event.pageX}px`)
        .style('top', "200px")
        .style('background', 'red')
        .style('opacity', .9)

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
    })
  //d3.select('.metaRect')
  //  .on('mousemove', () => {
  //    tooltip.transition() 
  //      .duration(200)
  //      .style('opacity', .9)
  //    debugger  
  //  })
  //  .on('mouseout', () => {
  //    tooltip.transition()
  //      .duration(500)
  //      .style('opacity', 0)
  //  });

}

function buildChart(selector, data) {
  svg = d3.select(selector).append('svg')
    .attr('width', CONTAINER_WIDTH)
    .attr('height', CONTAINER_HEIGHT)
  window.data = data;

  attachGroups();
  addMetaRect();
  formatDataWithDates(data);
  minAndMax(data);
  buildAxis(data);
  buildDataLines(data);
  addToolTip(data)
}

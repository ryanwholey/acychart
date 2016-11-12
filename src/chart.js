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
    'lineGroup',
    'pointGroup',
    'metaGroup',
  ];

  if(svg) {
    svg.selectAll('g')
      .data(groups)
      .enter()
      .append('g')
      .attr('class', (cls) => cls)
  }
}

function buildAxis() {
  let axisGroup = d3.select('.axisGroup')
  if(!axisGroup) {
    return
  }

  axisGroup.selectAll('line')
    .data([ 
      { x1: LEFT, y1: TOP, x2: LEFT, y2: TOP + CHART_HEIGHT },
      { x1: LEFT, y1: TOP + MID_HEIGHT, x2: LEFT + CHART_WIDTH, y2: TOP + MID_HEIGHT } 
    ])
    .enter()
    .append('line')
    .attr('x1', ({x1}) => x1)
    .attr('y1', ({y1}) => y1)
    .attr('x2', ({x2}) => x2)
    .attr('y2', ({y2}) => y2)
    .attr('stroke', 'gray')
    .attr('stroke-width', 2)
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
  let xMin = d3.min(data.combined, (d) => d.date);
  let xMax = d3.max(data.combined, (d) => d.date);
  let yMax = d3.max(data.combined, (d) => d.amount);
  let yMin = d3.min(data.combined, (d) => d.amount);

  data.running = [];
  let pointer = moment(xMin);
  let end = moment(xMax);

  while(pointer.isSameOrBefore(end)) {
    data.running.push({date: pointer.toDate()});
    pointer.add(1, 'day');
  }
  
  pointer = 0;
  let runningTotal = 0;
  data.combined.forEach((datum) => {
    while(moment(datum.date).isBefore(data.running[pointer].date)) {
      data.running[pointer].amount = runningTotal;
      pointer += 1; 
    }
    runningTotal += datum.amount;
  });
}

function buildChart(selector, data) {
  svg = d3.select(selector).append('svg')
    .attr('width', CONTAINER_WIDTH)
    .attr('height', CONTAINER_HEIGHT)

  attachGroups();
  buildAxis();
  formatDataWithDates(data);
  minAndMax(data);
}

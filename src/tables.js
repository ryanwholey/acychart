window.makeTable = function(selector, collection) {
    $(selector).text(vkbeautify.json(collection));
};

var config = {
    startMonth: 5,
    endMonth: 4
}
var monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

window.buildTables = function(selector, data) {
    var $table = $('<table>');

    var byMonth = data.combined.reduce(function(memo, item) {
        var month = item.date.getMonth() + 1;
        if (!memo[month]) {
            memo[month] = [item];
        } else {
            memo[month].push(item);
        }
        return memo;
    }, {});

    var byMonthArray = new Array(12).toString().split('').map(function(_, i) {
        // start at begining month, go until no more months and start over again
        var index = (config.startMonth + i) % 12;
        if (byMonth[index]) {
            byMonth[index].month = index - 1;
        }

        return byMonth[index];
    }).filter(function(doot) {return !!doot;})

    // HEADER
    var $thead = $('<thead>')
    var categories = ['date', 'category', 'amount', 'description']
    var $headers = categories.map(function(header) {
        return $('<th>', {id:header, scope:'col', text: header});
    });

    // EACH MONTH SECTION
    $table.append($headers);

    var $tbody = $('<tbody>');

    byMonthArray.forEach(function(month) {
        var section = [];
        var $tr_th = $('<tr>');
        var $th = $('<th>',{id:monthNames[month.month], class:'month-header',colSpan:"5", scope:'colgroup', text: monthNames[month.month]})
        $tr_th.append($th);
        section.push($tr_th);

        month.forEach(function(item) {
            var $tr_td = $('<tr>');
            categories.forEach(function(col) {
                var text = item[col];
                if (col === 'date') {
                    text = item[col].toDateString()
                }
                var th = $('<th>', {headers:monthNames[month.month], text:text})
                $tr_td.append(th);
            })
            section.push($tr_td);
        })

        section.forEach(function(item){
            $tbody.append(item);
        });

    });

    $table.append($tbody);

    $(selector).append($table);

}
var fs = require('fs'),
    csv = require('csv'),
    pnormaldist = require('pnormaldist'),
    whiskys = {},
    parse = csv.parse,
    parser = parse({columns: true}, function (err, data) {
        var res = [], i = 0;

        map(data);
        res = reduce(whiskys);

        console.log('Scotchit Whisky Rankings');
        for (i; i < res.length; i++) {
            console.log(res[i][0] + ': ' + res[i][1] + '%' + ' ' + res[i][2]);
        }
    });

//////

/* Convert the parsed CSV data into a JavaScript object, reduced to Name: Array(values) */
function map(data) {
    var row, key, value,
        exclude = ['Bourbon', 'Rye', 'Grain', 'Tennessee', 'Liqueur', 'Wheat'];

    for (row in data) {
        if (exclude.indexOf(data[row].Region) >= 0) {
            continue;
        }
        key = data[row]['Whisky Name'].trim();
        value = parseInt(data[row].Rating);

        if (!whiskys.hasOwnProperty(key)) {
            whiskys[key] = [];
        }
        if (value > -1) {
            whiskys[key].push(value);
        }
    }
}

/* Generate scores for each whisky and sort descending */
function reduce(data) {
    var row, pos, value, score = [];

    for (row in data) {
        if (row.length < 5) { continue; }
        pos = data[row].filter(function (x) { return x > 90; });
        value = Math.round(ci_lower_bound(pos.length, data[row].length, 0.975) * 100.0, 0);
        if (value > 0) { score.push([row, value, price_indicator(data[row])]); }
    }
    return score.sort(function (a, b) { return b[1] - a[1]; });
}

/* Confidence interval, lower bound. Wilson Score */
function ci_lower_bound(pos, n, confidence) {
    var phat, z;

    if (n === 0) { return 0; }
    z = pnormaldist(1 - (1 - confidence) / 2);
    phat = 1.0 * pos / n;
    return (phat + z * z / (2 * n) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) / (1 + z * z / n);
}

if (typeof (String.prototype.trim) === 'undefined') {
    String.prototype.trim = function () {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

/* generate price indicators for all whiskys */
function price_indicator(row) {
    var sum, average, indicator = '$$$$$';
    if (row.length < 1) { return 0; }

    sum = row.reduce(function (a, b) { return a + b; });
    average = Math.round(sum / row.length, 0);

    if (average === 0) {
        indicator = '?';
    } else if (average < 40) {
        indicator = '$';
    } else if (average < 70) {
        indicator = '$$';
    } else if (average < 90) {
        indicator = '$$$';
    } else if (average < 120) {
        indicator = '$$$$';
    }

    return indicator;
}

fs.createReadStream(__dirname + '/ratings.csv').pipe(parser);

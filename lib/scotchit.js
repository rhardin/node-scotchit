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
            console.log(res[i][0] + ': ' + res[i][1] + '%');
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
        whiskys[key].push(value);
    }
}

/* Generate scores for each whisky and sort descending */
function reduce(data) {
    var row, pos, value, score = [];

    for (row in data) {
        if (row.length < 5) { continue; }
        pos = data[row].filter(function (x) { return x > 90; });
        value = Math.round(ci_lower_bound(pos.length, data[row].length, .975) * 100.0, 0);
        if (value > 0) { score.push([row, value]); }
    }
    return score.sort(function (a,b) { return b[1] - a[1]; });
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

fs.createReadStream(__dirname + '/ratings.csv').pipe(parser);

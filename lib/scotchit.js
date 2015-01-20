var fs = require('fs'),
	csv = require('csv'),
    pnormaldist = require('pnormaldist'),
    whiskys = {},
	parse = csv.parse,
	parser = parse({columns: true}, function (err, data) { map(data); });

//////

/* Convert the parsed CSV data into a JavaScript object, reduced to Name: Array(values) */
function map(data) {
    var row, key, value;

    for (row in data) {
        key = data[row]['Whisky Name'];
        value = data[row].Rating;

        if (!whiskys.hasOwnProperty(key)) {
            whiskys[key] = [];
        }
        whiskys[key].push(parseInt(value));
    }
}

/* Confidence interval, lower bound. Wilson Score */
function ci_lower_bound(pos, n, confidence) {
    var phat, z;

    if (n === 0) { return 0; }
    z = pnormaldist(1 - (1 - confidence) / 2);
    phat = 1.0 * pos / n;
    return (phat + z * z / (2 * n) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) / (1 + z * z / n);
}

fs.createReadStream(__dirname + '/ratings.csv').pipe(parser);

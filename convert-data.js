const fs = require('fs');
const csv = require('fast-csv');

function addZ(n) { return (n<10)?'0'+n:''+n; }

var data = {};

function processRow(row) {
    return [row[0], {
            'Confirmed': +row[4],
            'Recovered': +row[2],
            'Deaths': +row[3]
    }];
}

var timestamp_data = JSON.parse(fs.readFileSync('data/timeseries_india.json'));
timestamp_data['Dates'] = {};

let cnt = -1;

csv.parseString(fs.readFileSync('covid_19_india.csv'))
    .on('data', (row) => {
        cnt += 1;
        if (cnt == 0) return;
        r = processRow(row);
        if (!timestamp_data['Dates'].hasOwnProperty(r[0])) timestamp_data['Dates'][r[0]] = {};
        timestamp_data['Dates'][r[0]][row[1]+'/India'] = r[1];
    })
    .on('end', () => fs.writeFileSync('data/timeseries_india.json', JSON.stringify(timestamp_data)));

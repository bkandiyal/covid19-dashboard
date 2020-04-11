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
        let d = new Date(r[0]);
        d = addZ((d.getMonth()+1))+'/'+addZ(d.getDate())+'/'+d.getFullYear();
        if (!timestamp_data['Dates'].hasOwnProperty(d)) timestamp_data['Dates'][d] = {};
        timestamp_data['Dates'][d][row[1]+'/India'] = r[1];
    })
    .on('end', () => fs.writeFileSync('data/timeseries_india.json', JSON.stringify(timestamp_data)));

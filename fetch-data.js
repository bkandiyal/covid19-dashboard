const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const csv = require('fast-csv');

function addZ(n) { return (n<10)?'0'+n:''+n; }

axios.all([
    axios.get('https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv'),
    axios.get('https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'),
    axios.get('https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv'),
    axios.get('https://www.mohfw.gov.in/')
]).then(axios.spread((c, r, d, moh) => {
    let india_timeseries = JSON.parse(fs.readFileSync('data/timeseries_india.json'));

    var $ = cheerio.load(moh.data);
    let date = new Date($('#site-dashboard .status-update span').text().split(':').slice(1)[0].trim().split(',')[0]);
    let t = addZ(date.getDate())+'-'+addZ((date.getMonth()+1))+'-'+date.getFullYear();
    console.log('Date: ' + t);

    $('#state-data .data-table table tbody').find('tr').each(function(i, e) {
        let children = $(e).children();
        if (isNaN(parseInt($(children[0]).text()))) return;
        if (!india_timeseries['Dates'].hasOwnProperty(t)) india_timeseries['Dates'][t] = {}
        india_timeseries['Dates'][t][$(children[1]).text()+'/India'] = {
                'Confirmed': parseInt($(children[2]).text()),
                'Recovered': parseInt($(children[3]).text()),
                'Deaths': parseInt($(children[4]).text())
        };
    });

    fs.writeFileSync('data/timeseries_india.json', JSON.stringify(india_timeseries));

    let DATA = india_timeseries;

    function processRow(object, type, row) {
        let keys = Object.keys(row);
        if (row[keys[1]] == 'India') return; // Skip India as instead the data is being taken from MOHFW website

        let location = row[keys[0]]+'/'+row[keys[1]];
        if (!object.Meta.Locations.hasOwnProperty(location)) {
            object.Meta.Locations[location] = {
                Country: row[keys[1]],
                Lat: row[keys[2]],
                Long: row[keys[3]]
            }
        }

        for (let i=4; i < keys.length; i++) {
            if (+row[keys[i]] == 0) continue; // Skip zero figure entries
            let d = new Date(keys[i]);
            d = addZ(d.getDate())+'-'+addZ((d.getMonth()+1))+'-'+d.getFullYear();

            if (!object['Dates'].hasOwnProperty(d)) object['Dates'][d] = {};
            let k = row[keys[0]]+'/'+row[keys[1]];

            if (!object['Dates'][d].hasOwnProperty(k))
                object['Dates'][d][k] = {[type]: +row[keys[i]]};
            else
                object['Dates'][d][k][type] = +row[keys[i]];
        }
    }
    
    function commit() {
        fs.writeFileSync('data/timeseries_global.json', JSON.stringify(DATA));
    }

    Promise.all([
        new Promise((resolve, reject) => {csv.parseString(c.data, {headers:true}).on('data', row => processRow(DATA, 'Confirmed', row)).on('end', () => resolve())}),
        new Promise((resolve, reject) => {csv.parseString(r.data, {headers:true}).on('data', row => processRow(DATA, 'Recovered', row)).on('end', () => resolve())}),
        new Promise((resolve, reject) => {csv.parseString(r.data, {headers:true}).on('data', row => processRow(DATA, 'Deaths', row)).on('end', () => resolve())}),
    ]).then(function() {
        console.log('Done');
        commit();
    });
})).catch(error => {
    console.log(error);
});


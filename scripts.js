var URL_CONFIRMED="https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";
var URL_RECOVERED="https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv";
var URL_DEATHS="https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv";

var DATA = {
    confirmed: {},
    recovered: {},
    active: {},
    dates: [],
    summary: {},
}

// var DATA_CONFIRMED = {};
// var DATA_RECOVERED = {};
// var DATA_DEATHS = {};
// var DATA_ACTIVE = {};
// var DATA_DATES = [];
// var summary = {};

var svg = d3.select('#globalmap');

const width = function() {
    var w = svg.node().getBoundingClientRect().width;
    return w-(0.1*w);
};

const height = function() {
    const [[x0, y0], [x1, y1]] = d3.geoPath(map.projection.fitWidth(width(), map.outline)).bounds(map.outline);
    const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
    map.projection.scale(map.projection.scale() * (l - 1) / l).precision(0.2);
    return dy;
};

// Map Stuff
var map = {
    projection: d3.geoNaturalEarth1(),
    world: null,
    land: null,
    outline: null,
    graticule: null,
};

var path = d3.geoPath(map.projection);

function processPoints(data, key) {
    var ret = [];

    for (k in data) {
        var e = data[k];
        if (e.dates[key] == 0) continue;
        ret.push({
            'State':e['Province/State'],
            'Country':e['Country/Region'],
            'Lat':e['Lat'],
            'Long':e['Long'],
            'Value':e.dates[key],
            'Date':key,
        });
    }
    //console.log('Points:');
    //console.log(ret);
    return ret;
}

function renderMap() {
    map.land = topojson.feature(map.world, map.world.objects.land);
    map.graticule = d3.geoGraticule10();
    map.outline = ({type: "Sphere"});

    d3.select('#globalmap').attr('width', width()+'px');
    d3.select('#globalmap').attr('height', height()+'px');

    svg.append('path')
        .datum(map.land)
        .attr('class', 'land')
        .attr('d', path(map.land));

    svg.append('path')
        .datum(map.graticule)
        .attr('class', 'graticule')
        .attr('d', path(map.graticule));

    svg.append('path')
        .datum(map.outline)
        .attr('class', 'outline')
        .attr('d', path(map.outline));
}

function renderBubbles(data) {
    //console.log(data);

    var scale = d3.scaleLinear().domain([d3.min(data, d=> {return d.Value}), d3.max(data, d => {return d.Value})]).range([4, 0.05*width()]);

    // Clear all the existing bubbles or it causes problems
    svg.selectAll('circle')
    .data([])
    .exit()
    .remove();
    
    svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d) { return map.projection([d['Long'], d['Lat']])[0] })
    .attr('cy', function(d) { return map.projection([d['Long'], d['Lat']])[1] })
    .attr('r', function(d) { return scale(d['Value'])})
    .attr('fill', d3.select('#dataType').node().selectedOptions[0].getAttribute('data-color'));
}

function loadData() {
    var date = DATA.dates[+d3.select('#date-slider').attr('value')];
    var type = d3.select('#dataType').property('value');
    console.log(date);

    let totalConfirmed = 0;
    let totalRecovered = 0;
    let totalDeaths = 0;
    let totalActive = 0;

    for (c in DATA.confirmed) {
        totalConfirmed += DATA.confirmed[c].dates[date];
    }

    for (c in DATA.recovered) {
        totalRecovered += DATA.recovered[c].dates[date];
    }

    for (c in DATA.deaths) {
        totalDeaths += DATA.deaths[c].dates[date];
    }

    for (c in DATA.active) {
        totalActive += DATA.active[c].dates[date];
    }

    d3.select('#date').text('Date: ' + date);
    d3.select('#total-confirmed').text(totalConfirmed);
    d3.select('#total-recovered').text(totalRecovered);
    d3.select('#total-deaths').text(totalDeaths);
    d3.select('#total-active').text(totalActive);
    d3.select('#mortality-rate').text(((totalDeaths/totalConfirmed) * 100).toFixed(2)+'%');
    renderBubbles(processPoints(DATA[type], date));
}

// UI Stuff
function setupUI() {
    //d3.select('#date').attr('data-cols', DATA.dates.length);
    d3.select('#date-slider')
        .attr('max', DATA.dates.length-1)
        .on('input', function() {
            let v = d3.select(this).node().value;
            d3.select(this).attr('value', v);
            loadData()
    });
    d3.select('#btnPlay').on('click', function() {
        var cnt = +d3.select('#date-slider').attr('value');
        var total = +d3.select('#date-slider').attr('max');
        setInterval(function() {
            cnt += 1;
            if (cnt > total) return false;
            d3.select('#date-slider').property('value', cnt).attr('value', cnt);
            loadData();
            return true;
        }, 500);
    });
    d3.select('#dataType').on('change', function(v) {
        var v = d3.select(this).property('value');
        loadData(DATA[v], 0);
    });
}

function formatData(data) {
    let common_keys = ['Province/State', 'Country/Region', 'Lat', 'Long'];
    let ret = {};
    data.forEach(function(d) {
        let id = ''+d['Lat']+':'+d['Long'];
        let tmp = {};
        tmp.dates = d;
         common_keys.forEach(k => { 
            tmp[k] = d[k];
            delete tmp.dates[k];
        });
        tmp['Lat'] = +tmp['Lat'];
        tmp['Long'] = +tmp['Long'];
        for (k in tmp.dates) {
            tmp.dates[k] = +tmp.dates[k];
        }
        ret[id] = tmp;
    });
    return ret;
}

console.log('Fetching data....');

Promise.all([
    d3.csv(URL_CONFIRMED),
    d3.csv(URL_RECOVERED),
    d3.csv(URL_DEATHS),
    d3.json("countries-50m.json")
]).then(function(data) {
    DATA.dates = data[0].columns.slice(4, data[0].columns.length);
    map.world = data[3];

    DATA.confirmed = formatData(data[0]);
    DATA.active = JSON.parse(JSON.stringify(DATA.confirmed)); // Deep copy the data
    DATA.recovered = formatData(data[1]);
    DATA.deaths = formatData(data[2]); 

    for (let k in DATA.active) {
        let e = DATA.active[k];
        for (let d in e.dates) {
            DATA.active[k].dates[d] -= (DATA.recovered[k].dates[d] + DATA.deaths[k].dates[d]);
        }
    }

    setupUI();
    renderMap();
    loadData();
});

window.addEventListener("resize", function() {
    svg.text('');
    renderMap();
    loadData();
});
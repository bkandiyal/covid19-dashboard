var URL_CONFIRMED="COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";
var URL_RECOVERED="COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv";
var URL_DEATHS="COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv";

var DATA = {
    confirmed: {},
    recovered: {},
    active: {},
    dates: [],
    summary: {},
}

var svg = d3.select('#globalmap');

const width = function() {
    return window.innerWidth;
};

const height = function() {
    return window.innerHeight;
};

var timer = null;

function stepTimer() {
    let cnt = parseInt($('#date-slider').val());
    let total = parseInt($('#date-slider').attr('max'));
    cnt += 1;
    if (cnt > total) {
        clearInterval(timer);
        $('#btnPlay').text('Play');
    }
    else
        $('#date-slider').val(cnt).trigger('change');
}

function processPoints(data, key) {
    let ret = {type: 'FeatureCollection', features:[]};
    let total = 0;

    for (k in data) {
        total += data[k].dates[key];
    }

    for (k in data) {
        let e = data[k];
        if (e.dates[key] == 0) continue;
        ret.features.push({
            type: 'Feature',
            properties: {
                'State':e['Province/State'],
                'Country':e['Country/Region'],
                'Value':e.dates[key],
                'Date':key,
                'Percentage':+((e.dates[key]/total)*100).toFixed(2)
            },
            geometry: {
                type: 'Point',
                coordinates: [e['Long'], e['Lat']]
            }
        });
    }
    //console.log('Points:');
    // console.log(ret);
    return ret;
}

function loadData() {
    var date = DATA.dates[$('#date-slider').val()];
    $('#date').text(date);

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

    map.getSource('confirmed').setData(processPoints(DATA.confirmed, date));
    map.getSource('recovered').setData(processPoints(DATA.recovered, date));
    map.getSource('deaths').setData(processPoints(DATA.deaths, date));
    map.getSource('active').setData(processPoints(DATA.active, date));

    $('#total-confirmed').html(totalConfirmed);
    $('#total-recovered').html(totalRecovered);
    $('#total-deaths').html(totalDeaths);
    $('#total-active').html(totalActive);
    $('#mortality-rate').html(((totalDeaths/totalConfirmed) * 100).toFixed(2)+'%');

    // d3.select('#date').text('Date: ' + date);
    // d3.select('#total-confirmed').text(totalConfirmed);
    // d3.select('#total-recovered').text(totalRecovered);
    // d3.select('#total-deaths').text(totalDeaths);
    // d3.select('#total-active').text(totalActive);
    // d3.select('#mortality-rate').text(((totalDeaths/totalConfirmed) * 100).toFixed(2)+'%');
}

// UI Stuff
function setupUI() {
    map.setLayoutProperty('confirmed-bubbles', 'visibility', 'visible');
    map.setLayoutProperty('recovered-bubbles', 'visibility', 'none');
    map.setLayoutProperty('deaths-bubbles', 'visibility', 'none');
    map.setLayoutProperty('active-bubbles', 'visibility', 'none');

    $('#total-confirmed').parent().removeClass('active');
    $('#total-recovered').parent().removeClass('active');
    $('#total-confirmed').parent().removeClass('active');
    $('#total-deaths').parent().removeClass('active');
    $('#total-active').parent().removeClass('active');

    $('#total-confirmed').parent().button('toggle');

    $('#date-slider').attr('max', DATA.dates.length-1);

    $('#btnPlay').on('click', function() {
        if ($(this).attr('data-playing')) {
            $(this).attr('data-playing', 0).text('Play');
            clearInterval(timer);
        } else {
            $(this).attr('data-playing', 1).text('Pause');
            timer = setInterval(stepTimer, 500);
        }
    });

    $(document).on('input change', '#date-slider', function() {
        loadData();
    });

    $('#type-buttons-container input[type=checkbox]').change(function() {
        let t = $(this).attr('value');
        if(this.checked) {
            map.setLayoutProperty(t+'-bubbles', 'visibility', 'visible');
        } else {
            map.setLayoutProperty(t+'-bubbles', 'visibility', 'none');
        }
    });

    $('#date-slider').val(DATA.dates.length-1).trigger('change');

    //d3.select('#date').attr('data-cols', DATA.dates.length);
    // d3.select('#date-slider')
    //     .attr('max', DATA.dates.length-1)
    //     .on('input', function() {
    //         let v = d3.select(this).node().value;
    //         d3.select(this).attr('value', v);
    //         loadData()
    // });
    // d3.select('#btnPlay').on('click', function() {
    //     var cnt = +d3.select('#date-slider').attr('value');
    //     var total = +d3.select('#date-slider').attr('max');
    //     setInterval(function() {
    //         cnt += 1;
    //         if (cnt > total) return false;
    //         d3.select('#date-slider').property('value', cnt).attr('value', cnt);
    //         loadData();
    //         return true;
    //     }, 500);
    // });
    // d3.select('#dataType').on('change', function(v) {
    //     var v = d3.select(this).property('value');
    //     loadData(DATA[v], 0);
    // });
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

var map = new mapboxgl.Map({
    container: 'globalmap', // container id
    style: 'mapbox-style.json', // stylesheet location
    center: [0, 25], // starting position [lng, lat]
    zoom: 2 // starting zoom
});

$(document).ready(function() {   
    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    
    console.log('Fetching data....');
    
    // Download the required data
    Promise.all([
        d3.csv(URL_CONFIRMED),
        d3.csv(URL_RECOVERED),
        d3.csv(URL_DEATHS),
    ]).then(function(data) {
        DATA.dates = data[0].columns.slice(4, data[0].columns.length);
    
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
    
        let totalConfirmed = 0;
        let date = DATA.dates[DATA.dates.length-1];
        console.log(date);
    
        for (c in DATA.confirmed) {
            totalConfirmed += DATA.confirmed[c].dates[date];
        }
    
        map.on('load', function() {
            console.log('Map loaded');
    
            map.addSource('confirmed', {
                type: 'geojson',
                data: processPoints(DATA.confirmed, date),
            });
    
            map.addSource('recovered', {
                type: 'geojson',
                data: processPoints(DATA.recovered, date),
            });
    
            map.addSource('deaths', {
                type: 'geojson',
                data: processPoints(DATA.deaths, date),
            });
    
            map.addSource('active', {
                type: 'geojson',
                data: processPoints(DATA.active, date),
            });
    
            map.addLayer({
                id: 'confirmed-bubbles',
                type: 'circle',
                source: 'confirmed',
                paint: {
                    'circle-radius': [
                        'step',
                        ['get', 'Percentage'],
                        6,2,
                        12,5,
                        50,
                        100,100
                    ],
                    'circle-color': 'rgb(255, 0, 0)',
                    'circle-opacity': 0.6,
                    'circle-blur': [
                        'interpolate', ['linear'], ['get', 'Percentage'],
                        0, 0.5,
                        100, 0.1
                    ]
                }
            });
    
            map.addLayer({
                id: 'recovered-bubbles',
                type: 'circle',
                source: 'recovered',
                paint: {
                    'circle-radius': [
                        'step',
                        ['get', 'Percentage'],
                        6,2,
                        12,5,
                        50,
                        100,100
                    ],
                    'circle-color': 'rgb(0, 110, 20)',
                    'circle-opacity': 0.6,
                    'circle-blur': [
                        'interpolate', ['linear'], ['get', 'Percentage'],
                        0, 0.5,
                        100, 0.1
                    ]
                }
            });
    
            map.addLayer({
                id: 'deaths-bubbles',
                type: 'circle',
                source: 'deaths',
                paint: {
                    'circle-radius': [
                        'step',
                        ['get', 'Percentage'],
                        6,2,
                        12,5,
                        50,
                        100,100
                    ],
                    'circle-color': 'rgb(100, 0, 0)',
                    'circle-opacity': 0.8,
                    'circle-blur': [
                        'interpolate', ['linear'], ['get', 'Percentage'],
                        0, 0.5,
                        100, 0.1
                    ]
                }
            });
    
            map.addLayer({
                id: 'active-bubbles',
                type: 'circle',
                source: 'active',
                paint: {
                    'circle-radius': [
                        'step',
                        ['get', 'Percentage'],
                        6,2,
                        12,5,
                        50,
                        100,100
                    ],
                    'circle-color': 'rgb(255, 208, 20)',
                    'circle-opacity': 0.8,
                    'circle-blur': [
                        'interpolate', ['linear'], ['get', 'Percentage'],
                        0, 0.5,
                        100, 0.1
                    ]
                }
            });
    
            setupUI();
        });
    });
});




// window.addEventListener("resize", function() {
//     svg.text('');
//     renderMap();
//     loadData();
// });
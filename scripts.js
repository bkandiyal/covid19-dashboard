var DATA = {
    all: [],
    dates: [],
    header: {}
};

var map = null;

function getDataForDate(data, date) {
    let ret = [{}];
    let idx = data[0].indexOf('date');
    if (idx == -1) return null;

    let obj = {date: date, total_cases: 0, total_recovered:0, total_deaths: 0, total_active: 0};

    for (i in data) {
        if (i == 0) continue;
        if (data[i][idx] == date) {
            ret.push(data[i]);
            let c = data[i][data[0].indexOf('cases')];
            let r = data[i][data[0].indexOf('recovered')];
            let d = data[i][data[0].indexOf('deaths')];

            obj.total_cases += (c == null)?0:c;
            obj.total_recovered += (r == null)?0:r;
            obj.total_deaths += (d == null)?0:d;
        }
    }
    obj.total_active = obj.total_cases - obj.total_recovered - obj.total_deaths;
    ret[0] = obj;
    return ret;
}

function getDates(data) {
    let ret = [];
    let idx = data[0].indexOf('date');
    for (i in data) {
        let d = data[i][idx];
        if (ret.indexOf(d) == -1) ret.push(d);
    }
    return ret;
}

function setupMap() {
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox-style.json', // stylesheet location
        center: [0, 25], // starting position [lng, lat]
        zoom: 2 // starting zoom
    });
    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    map.on('load', function() {
        console.log('Map loaded');

        // let data = getDataForDate(DATA.all, DATA.dates[DATA.dates.length-1]);

        map.addSource('confirmed', {
            type: 'geojson',
            data: processPoints(DATA.all, DATA.dates[DATA.dates.length-2], 'Confirmed'),
        });

        map.addSource('recovered', {
            type: 'geojson',
            data: processPoints(DATA.all, DATA.dates[DATA.dates.length-2], 'Recovered'),
        });

        map.addSource('deaths', {
            type: 'geojson',
            data: processPoints(DATA.all, DATA.dates[DATA.dates.length-2], 'Deaths'),
        });

        // map.addSource('active', {
        //     type: 'geojson',
        //     data: processPoints(data, 'active'),
        // });

        map.addLayer({
            id: 'confirmed-bubbles',
            type: 'circle',
            source: 'confirmed',
            paint: {
                'circle-radius': [
                    /* 'step',
                    ['get', 'percentage'],
                    8,2,
                    16,5,
                    64,
                    100,100 */
                    'interpolate', ['linear'],
                    ['get', 'percentage'],
                    0.01, 6,
                    100, 200
                ],
                'circle-color': 'rgb(255, 0, 0)',
                'circle-opacity': 0.6,
                'circle-blur': [
                    'interpolate', ['linear'], ['get', 'percentage'],
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
                    ['get', 'percentage'],
                    6,2,
                    12,5,
                    50,
                    100,100
                ],
                'circle-color': 'rgb(0, 110, 20)',
                'circle-opacity': 0.6,
                'circle-blur': [
                    'interpolate', ['linear'], ['get', 'percentage'],
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
                    ['get', 'percentage'],
                    6,2,
                    12,5,
                    50,
                    100,100
                ],
                'circle-color': 'rgb(100, 0, 0)',
                'circle-opacity': 0.8,
                'circle-blur': [
                    'interpolate', ['linear'], ['get', 'percentage'],
                    0, 0.5,
                    100, 0.1
                ]
            }
        });

        /* map.addLayer({
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
                    'interpolate', ['linear'], ['get', 'percentage'],
                    0, 0.5,
                    100, 0.1
                ]
            }
        }); */

        let popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on('mouseenter', 'confirmed-bubbles', function(e) {
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';
            
            var coordinates = e.features[0].geometry.coordinates.slice();
            var description = `
                <ul class="list list-unstyled">
                    <li class="${(e.features[0].properties.name.length==0)?'d-none':''}">
                        <strong>State:</strong> ${e.features[0].properties.name}
                    </li>
                    <li class="">
                        <strong>Country:</strong> ${e.features[0].properties.country}
                    </li>
                    <li>
                        <strong>Confirmed:</strong> ${e.features[0].properties.confirmed}
                        <strong>Percentage:</strong> ${e.features[0].properties.percentage}
                    </li>
                    <li>
                        <strong>Coordinates:</strong> ${e.features[0].properties.lat} : ${e.features[0].properties.long}
                    </li>
                </ul>
            `;
            
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            
            // Populate the popup and set its coordinates
            // based on the feature found.
            popup
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
        });

        map.on('mouseleave', 'confirmed-bubbles', function() {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });

        setupUI();
    });
}

$(document).ready(function() {
    $.ajax({
        type: 'GET',
        url: 'data/timeseries_global.json',
        dataType: 'text',
        success: function(resp) {
            console.log('Getting CSV...');
            DATA.all = JSON.parse(resp);
            for (d in DATA.all.Dates) {
                DATA.dates.push(d);
            }
            DATA.dates.sort(function(a, b) {
                return new Date(a) - new Date(b);
            });
            setupMap();
        }
    });
});

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

function processPoints(data, date, type) {
    console.log('Processing points for ' + type);
    let ret = {type: 'FeatureCollection', features:[]};
    if (!data.Dates.hasOwnProperty(date)) return null;

    let summary = {total_confirmed:0, total_recovered:0, total_deaths:0}
    for (let d in data.Dates[date]) {
        let e = data.Dates[date][d];
        if (e.hasOwnProperty('Confirmed'))
            summary.total_confirmed += e.Confirmed;
        if (e.hasOwnProperty('Recovered'))
            summary.total_recovered += e.Recovered;
        if (e.hasOwnProperty('Deaths'))
            summary.total_deaths += e.Deaths;
    }

    for (let d in data.Dates[date]) {
        let e = data.Dates[date][d];
        if (e[type] == 0) continue;
        ret.features.push({
            type: 'Feature',
            properties: {
                'type':type,
                'name':data.Meta.Locations[d].Name,
                'country':data.Meta.Locations[d].Country,
                'confirmed':e['Confirmed'],
                'recovered':e['Recovered'],
                'deaths':e['Deaths'],
                'active':e['Confirmed']-e['Recovered']-e['Deaths'],
                'date':date,
                'percentage':+((e[type]/summary['total_'+type.toLowerCase()])*100).toFixed(2),
                'lat': +data.Meta.Locations[d].Lat,
                'long': +data.Meta.Locations[d].Long
            },
            geometry: {
                type: 'Point',
                coordinates: [+data.Meta.Locations[d].Long, +data.Meta.Locations[d].Lat]
            }
        });
    }
    return ret;
}

function loadData() {
    var date = DATA.dates[$('#date-slider').val()];
    $('#date').text(date);

    // let data = getDataForDate(DATA.all, date);

    // let totalConfirmed = data[0].total_cases;
    // let totalRecovered = data[0].total_recovered;
    // let totalDeaths = data[0].total_deaths;
    // let totalActive = data[0].total_active;

    map.getSource('confirmed').setData(processPoints(DATA.all, date, 'Confirmed'));
    //map.getSource('recovered').setData(processPoints(data, 'Recovered'));
    //map.getSource('deaths').setData(processPoints(data, 'Deaths'));
    // map.getSource('active').setData(processPoints(data, 'active'));

    // $('#total-confirmed').html(totalConfirmed);
    // $('#total-recovered').html(totalRecovered);
    // $('#total-deaths').html(totalDeaths);
    // $('#total-active').html(totalActive);
    // $('#mortality-rate').html(((totalDeaths/totalConfirmed) * 100).toFixed(2)+'%');
}

// UI Stuff
function setupUI() {
    console.log('Setting up UI');

    map.setLayoutProperty('confirmed-bubbles', 'visibility', 'visible');
    map.setLayoutProperty('recovered-bubbles', 'visibility', 'none');
    map.setLayoutProperty('deaths-bubbles', 'visibility', 'none');
    // map.setLayoutProperty('active-bubbles', 'visibility', 'none');

    $('#total-confirmed').parent().removeClass('active');
    $('#total-recovered').parent().removeClass('active');
    $('#total-confirmed').parent().removeClass('active');
    $('#total-deaths').parent().removeClass('active');
    $('#total-active').parent().removeClass('active');

    $('#total-confirmed').parent().button('toggle');

    $('#date-slider').attr('max', DATA.dates.length-1);

    $('#btnPlay').on('click', function() {
        if ($(this).attr('data-playing') == 'true') {
            $(this).attr('data-playing', 'false').text('Play');
            clearInterval(timer);
        } else {
            $(this).attr('data-playing', 'true').text('Pause');
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

    //$('#date-slider').val(DATA.dates.length-1).trigger('change');
}
"use strict";
// Narrative and KPI values are calculated from the currently selected year.
// Calculate the selected year's summary cards and supporting narrative.
function updateKpis() {
    var d = nationalByYear[state.year],
        prior = nationalByYear[state.year - 1];
    setText('overview-hosp', formatted(d.hosp));
    setHTML('overview-hosp-change', change(d.hosp, prior && prior.hosp));
    setText('overview-days', formatted(d.days));
    setHTML('overview-days-change', change(d.days, prior && prior.days));
    setText('overview-ratio', decimals(ratio(d)));
    setHTML('overview-ratio-change', change(ratio(d), prior && ratio(prior)));
    setText('burden-days', formatted(d.days));
    setText('burden-average', decimals(ratio(d)));
    var best = filterRows('national', 'road_user', state.year)
        .filter(verified)
        .sort(function(a, b) {
            return ratio(b) - ratio(a);
        })[0];
    setText('burden-peak', best ? decimals(ratio(best)) : 'N/A');
    setText('burden-peak-label', best ? best.category + ' · bed-days / case' : 'No data available');
    var base = nationalByYear[2011],
        changeTotal = (d.hosp - base.hosp) / base.hosp * 100;
    setText('overview-insight-title', state.year === 2011 ? 'The baseline year' : (changeTotal >= 0 ? 'Higher than the 2011 baseline' : 'Below the 2011 baseline'));
    setText('overview-insight-body', state.year === 2011 ? 'In 2011, Australia recorded ' + formatted(d.hosp) + ' road injury hospitalisations and ' + formatted(d.days) + ' hospital bed-days. Select a later year to compare changes.' : 'In ' + state.year + ', Australia recorded ' + formatted(d.hosp) + ' hospitalisations — ' + Math.abs(changeTotal)
        .toFixed(1) + '% ' + (changeTotal >= 0 ? 'above' : 'below') + ' the 2011 total. The data describes hospital care, not all crashes or injury risk.');
    var stateRows = filterRows('state_territory', 'total', state.year)
        .filter(verified)
        .sort(function(a, b) {
            return b.hosp - a.hosp;
        });
    var first = stateRows[0],
        second = stateRows[1];
    setText('people-headline', first ? first.geography + ' recorded the most hospitalisations in ' + state.year + '.' : 'Explore geographic differences.');
    setText('people-summary', first && second ? 'The leading locations were ' + first.geography + ' (' + formatted(first.hosp) + ') and ' + second.geography + ' (' + formatted(second.hosp) + '). Compare counts cautiously: population sizes vary by state.' : 'Select a year to explore different state and demographic patterns.');
    var users = filterRows('national', 'road_user', state.year)
        .filter(verified),
        ped = users.filter(function(x) {
            return x.category === 'Pedestrian';
        })[0],
        car = users.filter(function(x) {
            return x.category === 'Car driver';
        })[0];
    if (ped && car) {
        setText('burden-insight-title', 'Hospitalisation volume is not the whole story');
        setText('burden-insight-body', 'In ' + state.year + ', pedestrians averaged ' + decimals(ratio(ped)) + ' bed-days per case, compared with ' + decimals(ratio(car)) + ' for car drivers. Longer stays indicate more hospital resource use, not a definitive clinical severity rating.');
    }
}
// Show the selected road user's counts and bed-days per case.
function updateRoadUserDetail() {
    var users = filterRows('national', 'road_user', state.year)
        .filter(verified)
        .filter(d => d.hosp > 0),
        selected = users.filter(function(d) {
            return d.category === state.roadUser;
        })[0] || users[0];
    const select = document.getElementById('road-user-select');
    select.replaceChildren();
    users.forEach(function(row) {
        const option = document.createElement('option');
        option.value = row.category;
        option.textContent = row.category;
        select.appendChild(option);
    });
    select.disabled = !selected;
    if (!selected) {
        state.roadUser = null;
        setText('detail-name', 'No verified road-user data');
        ['detail-average', 'detail-cases', 'detail-days', 'detail-national']
            .forEach(id => setText(id, 'N/A'));
        return;
    }
    state.roadUser = selected.category;
    document.getElementById('road-user-select')
        .value = state.roadUser;
    setText('detail-name', selected.category);
    setText('detail-average', decimals(ratio(selected)));
    setText('detail-cases', formatted(selected.hosp));
    setText('detail-days', formatted(selected.days));
    setText('detail-national', decimals(ratio(nationalByYear[state.year])) + ' days');
}

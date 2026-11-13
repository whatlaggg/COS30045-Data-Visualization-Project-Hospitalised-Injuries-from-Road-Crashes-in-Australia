"use strict";
// Summary cards use the published national total and keep breakdowns separate.
function updateKpis() {
    const current = nationalByYear[state.year], prior = nationalByYear[state.year - 1];
    setText('overview-hosp', formatted(current.hosp));
    setHTML('overview-hosp-change', prior ? change(current.hosp, prior.hosp) : '');
    setText('overview-days', formatted(current.days));
    setHTML('overview-days-change', prior ? change(current.days, prior.days) : '');
    setText('overview-ratio', decimals(ratio(current)));
    setHTML('overview-ratio-change', prior ? change(ratio(current), ratio(prior)) : '');
    setText('burden-days', formatted(current.days));
    setText('burden-average', decimals(ratio(current)));
    const best = filterRows('national','road_user',state.year)
        .filter(d => verified(d) && d.hosp > 0)
        .sort((a,b) => ratio(b) - ratio(a))[0];
    setText('burden-peak', best ? decimals(ratio(best)) : 'N/A');
    setText('burden-peak-label', best ? best.category : '');
}
// The selected category links the ranked chart, scatter plot and detail card.
function updateRoadUserDetail() {
    const users = filterRows('national','road_user',state.year).filter(d => verified(d) && d.hosp > 0);
    const selected = users.find(d => d.category === state.roadUser) || users[0];
    const select = document.getElementById('road-user-select');
    select.replaceChildren();
    users.forEach(row => {
        const option = document.createElement('option');
        option.value = row.category; option.textContent = row.category; select.appendChild(option);
    });
    select.disabled = !selected;
    if (!selected) {
        state.roadUser = null;
        ['detail-name','detail-average','detail-cases','detail-days','detail-national'].forEach(id => setText(id,'N/A'));
        return;
    }
    state.roadUser = selected.category;
    select.value = state.roadUser;
    setText('detail-name',selected.category);
    setText('detail-average',decimals(ratio(selected)));
    setText('detail-cases',formatted(selected.hosp));
    setText('detail-days',formatted(selected.days));
    setText('detail-national',decimals(ratio(nationalByYear[state.year])));
}

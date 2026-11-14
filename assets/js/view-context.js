"use strict";

function updateViewContext() {
    const current = nationalByYear[state.year];
    if (!current) return;

    const users = filterRows('national', 'road_user', state.year).filter(verified);
    const largest = [...users].sort((a, b) => b.hosp - a.hosp)[0];
    const longest = users.filter(d => d.hosp > 0).sort((a, b) => ratio(b) - ratio(a))[0];
    setText('insight-overview', `${state.year}: ${formatted(current.hosp)} hospitalisations required ${formatted(current.days)} bed-days, averaging ${decimals(ratio(current))} bed-days per case. Use People & places to examine how the counts are distributed.`);
    setText('insight-people', `${state.year}: ${largest.category} has the highest national road-user count (${formatted(largest.hosp)}). The state selector affects the sex-share chart only; age and road-user bars remain national. Compare hospital burden next to see whether the highest counts also mean the longest stays.`);
    setText('insight-burden', `${state.year}: ${longest.category} has the highest road-user average (${decimals(ratio(longest))} bed-days per case), compared with ${decimals(ratio(current))} nationally. Select a bar, point or road-user option to examine its count alongside the average.`);

    const fnRows = data.filter(d =>
        d.source === 'first_nations' &&
        d.population === 'First Nations people' &&
        d.breakdown === 'remoteness' &&
        d.year === state.year
    );
    const complete = fnRows.length === 3 && fnRows.every(d => d.hosp !== null);
    const top = [...fnRows].filter(d => d.hosp !== null).sort((a, b) => b.hosp - a.hosp)[0];
    setText(
        'insight-first-nations',
        complete
            ? `${state.year}: ${top.category} has the largest published count among the three residence categories (${formatted(top.hosp)}). This is a distribution of recorded hospitalisations, not evidence of higher per-person risk.`
            : `${state.year}: one or more residence counts are unavailable. No overall ranking or total is inferred from incomplete data.`
    );

    const host = document.getElementById('view-data-table');
    host.replaceChildren();
    const appendTable = (caption, headers, rows) => {
        const table = document.createElement('table');
        const cap = document.createElement('caption');
        cap.textContent = caption;
        table.appendChild(cap);

        const head = table.createTHead().insertRow();
        headers.forEach(label => {
            const th = document.createElement('th');
            th.scope = 'col';
            th.textContent = label;
            head.appendChild(th);
        });

        const body = table.createTBody();
        rows.forEach(values => {
            const tr = body.insertRow();
            values.forEach((value, i) => {
                const cell = document.createElement(i === 0 ? 'th' : 'td');
                if (i === 0) cell.scope = 'row';
                cell.textContent = value;
                tr.appendChild(cell);
            });
        });
        host.appendChild(table);
    };

    if (state.page === 'overview') {
        appendTable(
            'National annual totals',
            ['Year', 'Hospitalisations', 'Bed-days', 'Bed-days per case', 'Cases: change from prior year', 'Bed-days: change from prior year'],
            nationalTotals.map(d => {
                const prior = nationalByYear[d.year - 1];
                const pct = (v, p) => p ? d3.format('+.1f')(100 * (v - p) / p) + '%' : 'No prior year';
                return [d.year, formatted(d.hosp), formatted(d.days), decimals(ratio(d)), pct(d.hosp, prior?.hosp), pct(d.days, prior?.days)];
            })
        );
    } else if (state.page === 'people') {
        const states = data.filter(d =>
            d.source === 'state_territory' &&
            d.breakdown === 'total' &&
            d.population === 'All persons'
        );
        appendTable(
            'State hospitalisations, 2011–2021',
            ['State', ...years],
            ['NSW', 'Vic', 'Qld', 'WA', 'SA', 'Tas', 'ACT', 'NT'].map(region => [
                region,
                ...years.map(year => formatted(states.find(d => d.geography === region && d.year === year)?.hosp))
            ])
        );

        const region = document.getElementById('sex-state-select').value;
        appendTable(
            `${region}: shares among published male + female cases only`,
            ['Year', 'Male count', 'Female count', 'Male share', 'Female share'],
            years.map(year => {
                const r = data.filter(d =>
                    d.source === 'state_territory' &&
                    d.breakdown === 'sex' &&
                    d.geography === region &&
                    d.year === year
                );
                const male = r.find(d => d.category === 'Male')?.hosp;
                const female = r.find(d => d.category === 'Female')?.hosp;
                const valid = male != null && female != null && male + female > 0;
                return [
                    year,
                    formatted(male),
                    formatted(female),
                    valid ? (100 * male / (male + female)).toFixed(1) + '%' : 'Unavailable',
                    valid ? (100 * female / (male + female)).toFixed(1) + '%' : 'Unavailable'
                ];
            })
        );
        appendTable(
            `National age groups, ${state.year}; unequal age-band widths`,
            ['Age group', 'Hospitalisations'],
            filterRows('national', 'age_group', state.year).map(d => [d.category, formatted(d.hosp)])
        );
        appendTable(
            `All national road-user categories, ${state.year}; chart shows top six`,
            ['Road user', 'Hospitalisations'],
            [...users].sort((a, b) => b.hosp - a.hosp).map(d => [d.category, formatted(d.hosp)])
        );
    } else if (state.page === 'burden') {
        appendTable(
            'National bed-days per case over time',
            ['Year', 'Bed-days per case'],
            nationalTotals.map(d => [d.year, decimals(ratio(d))])
        );
        appendTable(
            `All road users, ${state.year}; ranked chart shows top eight`,
            ['Road user', 'Hospitalisations', 'Bed-days', 'Bed-days per case'],
            users.map(d => [d.category, formatted(d.hosp), formatted(d.days), decimals(ratio(d))])
        );
    } else {
        appendTable(
            `First Nations people: residence remoteness, ${state.year}`,
            ['Residence category', 'Hospitalisations', 'Bed-days', 'Bed-days per case'],
            fnRows.map(d => [d.category, formatted(d.hosp), formatted(d.days), decimals(ratio(d))])
        );
    }
}

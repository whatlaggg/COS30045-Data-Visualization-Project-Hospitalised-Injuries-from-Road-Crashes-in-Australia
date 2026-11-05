"use strict";

function parseInjuryRow(r) {
    // Empty cells stay unavailable. Suppression flags decide which measures can be displayed.
    const numberOrNull = value => value == null || String(value)
        .trim() === '' ? null : Number(value);
    const hospFlag = numberOrNull(r.hospitalisations_suppressed);
    const daysFlag = numberOrNull(r.bed_days_suppressed);
    const hosp = numberOrNull(r.hospitalisations),
        days = numberOrNull(r.bed_days);
    if (!Number.isInteger(+r.year) ||
        +r.year < 2011 ||
        +r.year > 2021 ||
        [hospFlag, daysFlag].some(n => n === null ||
        !Number.isInteger(n) ||
        n < 0) ||
        [hosp, days].some(n => n !== null && (!Number.isFinite(n) ||
        n < 0)) ||
        !r.source_dataset ||
        !r.breakdown ||
        !r.population ||
        !r.geography ||
        !r.category) {
        throw new Error('Invalid CSV row: ' + JSON.stringify(r));
    }
    return {
        year: +r.year,
        geography: r.geography,
        category: r.category,
        hosp: hospFlag > 0 ? null : hosp,
        days: daysFlag > 0 ? null : days,
        suppressed: hospFlag,
        daysSuppressed: daysFlag,
        breakdown: r.breakdown,
        source: r.source_dataset,
        population: r.population,
        raw: r
    };
}
// Load the CSV, check its structure, prepare national totals and start the dashboard.
async function loadCSV(path) {
    try {

        // Fetch the CSV through the local or hosted web server.
        const rows = await d3.csv(path);

        // Validate column names before parsing any chart data.
        const required = [
            'year',
            'geography',
            'category',
            'hospitalisations',
            'bed_days',
            'hospitalisations_suppressed',
            'bed_days_suppressed',
            'breakdown',
            'source_dataset',
            'population'
        ];
        if (required.some(column => !rows.columns.includes(column))) throw new Error('CSV columns do not match the KNIME export.');

        // Parse numeric measures and prepare the national yearly lookup.
        data = rows.map(parseInjuryRow);
        nationalTotals = data.filter(d => d.source === 'national' && d.breakdown === 'total' && d.population === 'All persons')
            .sort((a, b) => a.year - b.year);
        if (nationalTotals.length !== 11 || new Set(nationalTotals.map(d => d.year))
            .size !== 11 || nationalTotals.some(d => !verified(d))) throw new Error('Expected 11 complete national annual totals.');
        nationalByYear = Object.fromEntries(nationalTotals.map(d => [d.year, d]));

        document.getElementById('loading-status')
            .remove();

        // Initialise controls after the data is ready.
        initialiseInteractions();
        // Display loading or validation failures in the page.
    } catch (error) {
        console.error(error);
        const status = document.getElementById('loading-status');
        status.textContent = 'Unable to load the CSV. Open this site through VS Code Live Server or Mercury, and check data/dashboard_injuries.csv. ' + error.message;
        status.setAttribute('role', 'alert');
        document.querySelectorAll('button,select')
            .forEach(el => el.disabled = true);
    }
}
loadCSV('data/dashboard_injuries.csv');

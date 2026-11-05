"use strict";

function redrawWithChartFocus(draw) {
    const active = document.activeElement;
    const chart = active && active.closest('.chart');
    const row = active && active.__data__;
    draw();
    if (!chart || !row) return;
    const replacement = Array.from(chart.querySelectorAll('[role="button"]'))
        .find(mark => mark.__data__.year === row.year && mark.__data__.category === row.category);
    if (replacement) replacement.focus({ preventScroll: true });
}

// All three road-user controls update the same selection and linked views.
function selectRoadUser(category) {
    hideTip();
    state.roadUser = category;
    redrawWithChartFocus(function() {
        updateRoadUserDetail();
        drawRatioGroups();
        drawScatterplot();
    });
}

// Show the requested chapter, update navigation and redraw its charts.
function setPage(page) {
    if (['overview', 'people', 'burden'].indexOf(page) < 0) page = 'overview';
    state.page = page;
    hideTip();
    document.querySelectorAll('.page')
        .forEach(function(el) {
            el.classList.toggle('active', el.id === 'page-' + page);
        });
    document.querySelectorAll('.nav-item')
        .forEach(function(el) {
            el.classList.toggle('active', el.dataset.page === page);
            if (el.dataset.page === page) el.setAttribute('aria-current', 'page');
            else el.removeAttribute('aria-current');
        });
    setText('breadcrumb-page', {
        overview: 'National overview',
        people: 'People & places',
        burden: 'Hospital burden'
    } [page]);
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + page);
    } else window.location.hash = page;
    document.querySelector('.sidebar')
        .classList.remove('mobile-open');
    window.scrollTo(0, 0);
    requestAnimationFrame(render);
}
// Update the selected year, arrow buttons and visible charts.
function setYear(year) {
    if (!years.includes(+year)) return;
    hideTip();
    state.year = Math.min(2021, Math.max(2011, +year));
    document.getElementById('year-select')
        .value = state.year;
    document.getElementById('year-prev')
        .disabled = state.year <= 2011;
    document.getElementById('year-next')
        .disabled = state.year >= 2021;
    document.querySelectorAll('.selected-year-text')
        .forEach(function(el) {
            el.textContent = state.year;
        });
    redrawWithChartFocus(render);
}
// Export original CSV fields, including both suppression flags, for this year.
// Download all source rows for the selected year with their suppression flags.
function exportYear() {
    const subset = data.filter(d => d.year === state.year)
        .map(d => d.raw);
    const blob = new Blob([d3.csvFormat(subset)], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob),
        a = document.createElement('a');
    a.href = url;
    a.download = 'road_injuries_' + state.year + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Populate controls and attach navigation, selection and resize events once.
function initialiseInteractions() {
    years.forEach(function(y) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        document.getElementById('year-select')
            .appendChild(opt);
    });
    document.getElementById('year-select')
        .addEventListener('change', function() {
            setYear(this.value);
        });
    document.getElementById('year-prev')
        .addEventListener('click', function() {
            setYear(state.year - 1);
        });
    document.getElementById('year-next')
        .addEventListener('click', function() {
            setYear(state.year + 1);
        });
    document.getElementById('download-btn')
        .addEventListener('click', exportYear);
    document.querySelectorAll('[data-page]')
        .forEach(function(btn) {
            btn.addEventListener('click', function() {
                setPage(btn.dataset.page);
            });
        });
    document.querySelectorAll('[data-go]')
        .forEach(function(btn) {
            btn.addEventListener('click', function() {
                setPage(btn.dataset.go);
            });
        });
    document.getElementById('road-user-select')
        .addEventListener('change', function() {
            selectRoadUser(this.value);
        });
    document.getElementById('menu-toggle')
        .addEventListener('click', function() {
            document.querySelector('.sidebar')
                .classList.toggle('mobile-open');
        });
    document.getElementById('brand-link')
        .addEventListener('click', function(e) {
            e.preventDefault();
            setPage('overview');
        });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') document.querySelector('.sidebar')
            .classList.remove('mobile-open');
    });
    window.addEventListener('hashchange', function() {
        var p = location.hash.replace('#', '');
        if (p !== state.page && ['overview', 'people', 'burden'].indexOf(p) >= 0) setPage(p);
    });
    var resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 120);
    });
    state.page = (['overview', 'people', 'burden'].indexOf(location.hash.substring(1)) >= 0 ? location.hash.substring(1) : 'overview');
    setYear(2021);
    setPage(state.page);
}

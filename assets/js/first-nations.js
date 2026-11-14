"use strict";

function drawFirstNations() {
    const panel = d3.select('#chart-first-nations');
    panel.selectAll('*').remove();
    const categories = ['Major Cities', 'Regional', 'Remote'];
    const rows = categories.map(category =>
        data.find(d =>
            d.source === 'first_nations' &&
            d.population === 'First Nations people' &&
            d.breakdown === 'remoteness' &&
            d.year === state.year &&
            d.category === category
        ) || {category, hosp: null, year: state.year}
    );
    const width = panel.node().clientWidth;
    const height = panel.node().clientHeight;
    if (!width || !height) return;
    const margin = {top: 18, right: 66, bottom: 48, left: 100};
    const W = width - margin.left - margin.right, H = height - margin.top - margin.bottom;
    const svg = panel.append('svg').attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width).attr('height', height);
    svg.append('title').text('First Nations hospitalisations by remoteness of usual residence');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, d3.max(rows, d => d.hosp) || 1]).nice().range([0, W]);
    const y = d3.scaleBand().domain(categories).range([0, H]).padding(0.3);
    const barHeight = Math.min(56, y.bandwidth());
    xGrid(g, x, H, 4);
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${H})`)
        .call(d3.axisBottom(x).ticks(4).tickFormat(compact));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSize(0));
    const bars = g.selectAll('.residence-bar').data(rows.filter(d => d.hosp !== null))
        .join('rect').attr('class', 'residence-bar').attr('x', 0)
        .attr('y', d => y(d.category) + (y.bandwidth() - barHeight) / 2)
        .attr('width', d => x(d.hosp)).attr('height', barHeight).attr('fill', C.ink);
    bindTip(bars, d => tip(
        d.category + ' · ' + d.year,
        formatted(d.hosp) + ' hospitalisations',
        'First Nations people; usual residence, not crash location'
    ));
    g.selectAll('.count-label').data(rows).join('text').attr('class', 'count-label chart-label-strong')
        .attr('x', d => d.hosp === null ? 4 : x(d.hosp) + 7)
        .attr('y', d => y(d.category) + y.bandwidth()/2 + 4)
        .text(d => d.hosp === null ? 'Unavailable' : formatted(d.hosp));
    g.append('text').attr('class', 'chart-label').attr('x', W/2).attr('y', H+40)
        .attr('text-anchor', 'middle').text('Hospitalisations (counts)');
}

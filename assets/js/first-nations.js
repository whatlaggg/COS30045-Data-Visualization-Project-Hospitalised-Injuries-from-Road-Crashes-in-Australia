"use strict";
function drawFirstNations() {
    const selector = '#chart-first-nations';
    const panel = d3.select(selector);
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

    const isFirstRender = panel.select('svg').empty();

    const margin = {top: 25, right: 66, bottom: 48, left: 100}; 
    const W = width - margin.left - margin.right, H = height - margin.top - margin.bottom;
    
    const x = d3.scaleLinear().domain([0, d3.max(rows, d => d.hosp) || 1]).nice().range([0, W]);
    const y = d3.scaleBand().domain(categories).range([0, H]).padding(0.3);
    const barHeight = Math.min(56, y.bandwidth());

    let g, svg, gridGroup;

    if (isFirstRender) {
        panel.selectAll('*').remove();
        svg = panel.append('svg').attr('viewBox', `0 0 ${width} ${height}`)
            .attr('width', width).attr('height', height);
        svg.append('title').text('First Nations hospitalisations by remoteness of usual residence');
        g = svg.append('g').attr('class', 'chart-content').attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Dedicated grid group to prevent duplicate lines
        gridGroup = g.append('g').attr('class', 'grid-group');
        g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${H})`);
        g.append('g').attr('class', 'y-axis').call(d3.axisLeft(y).tickSize(0));
        
        g.append('text').attr('class', 'chart-label').attr('x', W/2).attr('y', H+40)
            .attr('text-anchor', 'middle').text('Hospitalisations (counts)');
    } else {
        svg = panel.select('svg');
        g = panel.select('.chart-content');
        gridGroup = g.select('.grid-group');
    }

    gridGroup.selectAll('*').remove();
    xGrid(gridGroup, x, H, 4);
    
    g.select('.x-axis').transition().duration(800).call(d3.axisBottom(x).ticks(4).tickFormat(compact));

    const t = d3.transition().duration(800).ease(d3.easeCubicOut);

    const bars = g.selectAll('.residence-bar').data(rows.filter(d => d.hosp !== null), d => d.category)
        .join(
            enter => enter.append('rect')
                .attr('class', 'residence-bar')
                .attr('x', 0)
                .attr('y', d => y(d.category) + (y.bandwidth() - barHeight) / 2)
                .attr('height', barHeight)
                .attr('fill', C.ink)
                .attr('width', 0)
                .call(e => e.transition(t).attr('width', d => x(d.hosp))),
            update => update.call(u => u.transition(t).attr('width', d => x(d.hosp))),
            exit => exit.call(e => e.transition(t).attr('width', 0).remove())
        );

    bindTip(bars, d => tip(
        d.category + ' · ' + d.year,
        formatted(d.hosp) + ' hospitalisations',
        'First Nations people; usual residence, not crash location'
    ));

    g.selectAll('.count-label').data(rows, d => d.category)
        .join(
            enter => enter.append('text')
                .attr('class', 'count-label chart-label-strong')
                .attr('y', d => y(d.category) + y.bandwidth()/2 + 4)
                .text(d => d.hosp === null ? 'Unavailable' : formatted(d.hosp))
                .attr('x', 4)
                .call(e => e.transition(t).attr('x', d => d.hosp === null ? 4 : x(d.hosp) + 7)),
            update => update.call(u => u.transition(t)
                .attr('x', d => d.hosp === null ? 4 : x(d.hosp) + 7)
                .text(d => d.hosp === null ? 'Unavailable' : formatted(d.hosp))),
            exit => exit.call(e => e.transition(t).style('opacity', 0).remove())
        );
}
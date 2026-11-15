"use strict";
// State-by-year counts: one cell per published state total, with a shared count scale.
function drawStateHeatmap() {
    const el = d3.select('#chart-state-heatmap');
    el.selectAll('*').remove();
    const width = Math.max(270, el.node().clientWidth);
    const height = Math.max(320, el.node().clientHeight);
    const m = {top: 9, right: 10, bottom: 72, left: 36};
    const W = Math.max(10, width - m.left - m.right);
    const H = Math.max(10, height - m.top - m.bottom);
    const svg = el.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    const rows = data.filter(d =>
        d.source === 'state_territory' &&
        d.breakdown === 'total' &&
        d.population === 'All persons' &&
        d.hosp != null
    );
    const regions = ['NSW', 'Vic', 'Qld', 'WA', 'SA', 'Tas', 'ACT', 'NT'];
    const x = d3.scaleBand().domain(years).range([0, W]).padding(.06);
    const y = d3.scaleBand().domain(regions).range([0, H]).padding(.07);
    const color = d3.scaleSequential([0, d3.max(rows, d => d.hosp) || 1], d3.interpolateBlues);
    const marks = g.selectAll('rect').data(rows).join('rect')
        .attr('x', d => x(d.year))
        .attr('y', d => y(d.geography))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .attr('rx', 2)
        .attr('fill', d => color(d.hosp))
        .attr('stroke', d => d.year === state.year ? '#173a63' : 'none')
        .attr('stroke-width', 1.5)
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', d => `${d.geography}, ${d.year}: ${formatted(d.hosp)} hospitalisations`)
        .on('click', (event, d) => {
            if (state.year === d.year) return; // Prevent same-click redraw
            setYear(d.year);
        })
        .on('keydown', (event, d) => {
            if (event.key === 'Enter' || event.key === ' ') {
                if (state.year === d.year) return; // Prevent same-click redraw
                event.preventDefault();
                setYear(d.year);
            }
        });
        
    bindTip(marks, d => tip(
        `${d.geography} · ${d.year}`,
        formatted(d.hosp) + ' hospitalisations',
        'State total; counts, not rates'
    ));
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${H})`)
        .call(d3.axisBottom(x).tickValues(years.filter(d => d % 2 === 1)).tickSize(0).tickPadding(6));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSize(0).tickPadding(6));
    // All states use one count scale; this does not normalise population size.
    const legendWidth = Math.min(W, 300);
    const legendX = (W - legendWidth) / 2;
    const legendScale = d3.scaleLinear().domain(color.domain()).range([0, legendWidth]);
    const legend = g.append('g').attr('transform', `translate(${legendX},${H + 31})`);
    legend.selectAll('rect').data(d3.range(80)).join('rect')
        .attr('x', i => i * legendWidth / 80)
        .attr('width', legendWidth / 80 + 0.5)
        .attr('height', 10)
        .attr('fill', i => color(color.domain()[1] * i / 79));
    legend.append('g').attr('class', 'axis').attr('transform', 'translate(0,10)')
        .call(d3.axisBottom(legendScale).ticks(3).tickFormat(compact));
    svg.append('title').text('Hospitalisation counts. Darker blue means more cases; counts are not population-adjusted rates.');
}

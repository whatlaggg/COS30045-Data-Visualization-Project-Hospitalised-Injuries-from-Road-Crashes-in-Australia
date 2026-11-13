"use strict";
// Compare annual shares within one state. Missing counts break both lines.
function drawSexTrend() {
    const region = document.getElementById('sex-state-select').value;
    const panel = d3.select('#chart-sex-trend');
    panel.selectAll('*').remove();
    const rows = data.filter(d => d.source === 'state_territory' && d.breakdown === 'sex' && d.geography === region);
    const points = years.map(year => {
        const male = rows.find(d => d.year === year && d.category === 'Male');
        const female = rows.find(d => d.year === year && d.category === 'Female');
        const valid = male && female && male.hosp != null && female.hosp != null && male.hosp + female.hosp > 0;
        const total = valid ? male.hosp + female.hosp : null;
        return {year, total, Male: valid ? 100 * male.hosp / total : null,
            Female: valid ? 100 * female.hosp / total : null,
            maleCount: male?.hosp, femaleCount: female?.hosp};
    });
    if (!points.some(d => d.total != null)) {
        panel.append('div').attr('class', 'chart-empty').text('No paired male and female counts available for this state.');
        return;
    }
    const width = Math.max(170, panel.node().clientWidth), height = Math.max(100, panel.node().clientHeight);
    const m = {top: 27, right: 12, bottom: 27, left: 35};
    const W = Math.max(10, width - m.left - m.right), H = Math.max(10, height - m.top - m.bottom);
    const svg = panel.append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, W]);
    const y = d3.scaleLinear().domain([0, 100]).range([H, 0]);
    yGrid(g, y, W, 4);
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickFormat(d => d + '%'));
    const ticks = W < 230 ? [years[0], years[Math.floor(years.length / 2)], years[years.length - 1]] : years.filter(d => d % 2 === 1);
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${H})`)
        .call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('d')));
    g.append('line').attr('class', 'focus-line').attr('x1', x(state.year)).attr('x2', x(state.year)).attr('y1', 0).attr('y2', H);
    for (const [i, sex] of ['Male', 'Female'].entries()) {
        const color = sex === 'Male' ? '#0d47a1' : '#2196f3';
        const dash = sex === 'Female' ? '6 3' : null;
        const line = d3.line().defined(d => d[sex] != null).x(d => x(d.year)).y(d => y(d[sex]));
        g.append('path').datum(points).attr('class', 'sex-trend-line').attr('d', line)
            .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5).attr('stroke-dasharray', dash);
        const legendX = i * 83;
        g.append('line').attr('x1', legendX).attr('x2', legendX + 18).attr('y1', -13).attr('y2', -13)
            .attr('stroke', color).attr('stroke-width', 2.5).attr('stroke-dasharray', dash);
        g.append('text').attr('class', 'chart-label').attr('x', legendX + 23).attr('y', -10).text(sex);
        const marks = g.selectAll('.sex-point-' + sex).data(points.filter(d => d[sex] != null).map(d => ({...d, category: sex})))
            .join('circle').attr('class', 'sex-point-' + sex).attr('cx', d => x(d.year)).attr('cy', d => y(d[sex]))
            .attr('r', d => d.year === state.year ? 5 : 3.5).attr('fill', d => d.year === state.year ? 'white' : color)
            .attr('stroke', color).attr('stroke-width', 2).attr('role', 'button')
            .attr('aria-pressed', d => d.year === state.year).style('cursor', 'pointer')
            .on('click.year', (event, d) => setYear(d.year))
            .on('keydown.year', (event, d) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setYear(d.year); }
            });
        bindTip(marks, d => tip(`${region} · ${sex} · ${d.year}`, `${d[sex].toFixed(1)}%`,
            `${formatted(sex === 'Male' ? d.maleCount : d.femaleCount)} of ${formatted(d.total)} published male + female cases`));
    }
    axisStyles(svg);
}

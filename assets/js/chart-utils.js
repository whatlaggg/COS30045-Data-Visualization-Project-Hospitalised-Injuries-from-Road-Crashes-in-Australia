"use strict";
// Shared canvas, axes and text formatting only; chart marks live in chart files.
function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}
function setHTML(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = val;
}
// Format the percentage change from the previous year for a summary card.
function change(curr, prev) {
    if (!prev) return 'No previous-year comparison';
    var pct = (curr - prev) / prev * 100;
    return '<span class="' + (pct >= 0 ? 'delta-up' : 'delta-down') + '">' + (pct >= 0 ? '↑ +' : '↓ −') + Math.abs(pct)
        .toFixed(1) + '%</span> vs ' + (state.year - 1);
}
// Draw horizontal grid lines using the chart's vertical scale.
function yGrid(g, y, W, ticks) {
    g.append('g')
        .attr('class', 'grid-lines')
        .call(d3.axisLeft(y)
            .ticks(ticks || 4)
            .tickSize(-W)
            .tickFormat(''));
}
// Draw vertical grid lines using the chart's horizontal scale.
function xGrid(g, x, H, ticks) {
    g.append('g')
        .attr('class', 'grid-lines')
        .attr('transform', 'translate(0,' + H + ')')
        .call(d3.axisBottom(x)
            .ticks(ticks || 4)
            .tickSize(-H)
            .tickFormat(''));
}
function axisStyles(svg) {
    svg.selectAll('.axis .domain')
        .style('stroke', '#d7e0ea');
}

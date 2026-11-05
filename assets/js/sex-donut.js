"use strict";
/* ========================================================
   Composition of available counts by sex
   ======================================================== */
function drawSexDonut() {
    const selector = '#chart-sex',
        rows = filterRows('national', 'sex', state.year)
        .filter(d => d.hosp !== null);

    var el = document.querySelector(selector),
        w = Math.max(265, el.getBoundingClientRect()
            .width || 320),
        h = 310;
    d3.select(selector)
        .selectAll('*')
        .remove();

    var svg = d3.select(selector)
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('viewBox', '0 0 ' + w + ' ' + h),
        cx = w / 2,
        cy = h / 2 - 4,
        r = Math.min(w, h) * .33;
    var colors = ['#4778de', '#f0a265', '#a5b5c8'];
    var sorted = rows.slice()
        .sort(function(a, b) {
            return b.hosp - a.hosp;
        });

    // Define arc radii and convert each count into a slice angle.
    var arc = d3.arc()
        .outerRadius(r)
        .innerRadius(r * .7),
        pie = d3.pie()
        .value(function(d) {
            return d.hosp;
        })
        .sort(null),
        total = d3.sum(sorted, function(d) {
            return d.hosp;
        });

    var wedges = svg.append('g')
        .attr('transform', 'translate(' + cx + ',' + cy + ')')
        .selectAll('path')
        .data(pie(sorted))
        .join('path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
            return colors[i % colors.length];
        })
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('cursor', 'crosshair');

    bindTip(wedges, function(d) {
        return tip(d.data.category, formatted(d.data.hosp), (d.data.hosp / total * 100)
            .toFixed(1) + '% of available published counts');
    });
    var male = sorted.filter(function(d) {
            return d.category === 'Male';
        })[0],
        share = male ? male.hosp / total * 100 : 0;
    svg.append('text')
        .attr('x', cx)
        .attr('y', cy - 2)
        .attr('text-anchor', 'middle')
        .attr('fill', C.ink)
        .attr('font-size', '28px')
        .attr('font-weight', '850')
        .text(share.toFixed(1) + '%');
    svg.append('text')
        .attr('x', cx)
        .attr('y', cy + 19)
        .attr('text-anchor', 'middle')
        .attr('fill', C.muted)
        .attr('font-size', '11px')
        .text('Male share of available counts');

    // Build the legend with source labels, counts and percentages.
    var legend = document.getElementById('sex-legend');
    legend.innerHTML = sorted.map(function(d, i) {
            return '<div class="legend-row"><span class="label"><span class="donut-color" style="background:' + colors[i % colors.length] + '"></span>' + escapeHTML(d.category) + '</span><strong>' + formatted(d.hosp) + ' <span style="font-weight:500;color:#91a1b4">(' + (d.hosp / total * 100)
                .toFixed(1) + '%)</span></strong></div>';
        })
        .join('');
    // Retain suppressed categories in the legend, without estimating their counts.
    const unavailable = filterRows('national', 'sex', state.year)
        .filter(d => d.hosp === null);
    unavailable.forEach(d => {
        const row = document.createElement('div');
        row.className = 'legend-row';
        row.textContent = d.category + ': not published / unavailable';
        legend.appendChild(row);
    });
}

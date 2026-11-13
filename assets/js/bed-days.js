"use strict";
/* ========================================================
   Annual hospital bed-days
   ======================================================== */
function drawBedDays() {
    const selector = '#chart-bed-days',
        rows = nationalTotals;
    const opt = {
        color: C.blue,
        key: d => d.year,
        value: d => d.days,
        selectedKey: state.year,
        selectedColor: '#0d47a1',
        tooltipLabel: 'Total hospital bed-days',
        left: 54,
        compactYears: true
    };

    var height = opt.height || 235,
        margin = {
            top: 22,
            right: 10,
            bottom: opt.bottom || 34,
            left: opt.left || 55
        };

    const panel = d3.select(selector);
    panel.selectAll('*')
        .remove();
    const width = Math.max(300, panel.node()
        .getBoundingClientRect()
        .width);
    const W = Math.max(10, width - margin.left - margin.right);
    const H = height - margin.top - margin.bottom;
    const svg = panel.append('svg')
        .attr('viewBox', [0, 0, width, height].join(' '))
        .attr('width', width)
        .attr('height', height);
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.scaleBand()
        .domain(rows.map(function(d) {
            return String(opt.key(d));
        }))
        .rangeRound([0, W])
        .padding(0.24);
    var max = d3.max(rows, function(d) {
            return opt.value(d) || 0;
        }) || 1,
        y = d3.scaleLinear()
        .domain([0, max * 1.12])
        .range([H, 0]);

    // Draw grid lines and axes to support value comparison.
    yGrid(g, y, W, 4);
    g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y)
            .ticks(4)
            .tickFormat(compact));
    var a = g.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + H + ')')
        .call(d3.axisBottom(x)
            .tickSize(0)
            .tickPadding(12)
            .tickFormat(function(d) {
                return opt.compactYears && width < 480 && (+d % 2 === 0) ? '' : d;
            }));
    if (opt.rotateLabels) {
        a.selectAll('text')
            .attr('transform', 'rotate(-35)')
            .style('text-anchor', 'end');
    }

    var bars = g.selectAll('rect.data-bar')
        .data(rows)
        .join('rect')
        .attr('class', 'data-bar')
        .attr('x', function(d) {
            return x(String(opt.key(d)));
        })
        .attr('width', x.bandwidth())
        .attr('y', function(d) {
            return y(opt.value(d) || 0);
        })
        .attr('height', function(d) {
            return H - y(opt.value(d) || 0);
        })
        .attr('rx', 3)
        .attr('fill', function(d) {
            return opt.selectedKey && String(opt.key(d)) === String(opt.selectedKey) ? opt.selectedColor || C.orange : opt.color;
        })
        .style('opacity', function(d) {
            return opt.selectedKey && String(opt.key(d)) !== String(opt.selectedKey) ? .62 : .93;
        })
        .attr('aria-pressed', d => d.year === state.year)
        .style('cursor', 'pointer');
    // Choose a focus year directly from an annual mark.
    bars.attr('role', 'button')
        .on('click.year', (event, row) => setYear(row.year))
        .on('keydown.year', (event, row) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setYear(row.year);
            }
        });

    bindTip(bars, function(d) {
        return tip(String(opt.key(d)), formatted(opt.value(d)), opt.tooltipLabel || '');
    });
    axisStyles(svg);
}

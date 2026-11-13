"use strict";
/* ========================================================
   Road users ranked by bed-days per case
   ======================================================== */
function drawRatioGroups() {
    const selector = '#chart-ratio-groups',
        rows = filterRows('national', 'road_user', state.year)
        .filter(verified)
        .filter(d => d.hosp > 0)
        .sort((a, b) => ratio(b) - ratio(a))
        .slice(0, 8);
    const opt = {
        height: 235,
        key: d => d.category,
        value: ratio,
        valueFormat: decimals,
        axisFormat: n => n.toFixed(0),
        color: C.blue,
        left: 166,
        right: 45,
        truncate: 29,
        tipDetail: d => formatted(d.hosp) + ' cases · ' + formatted(d.days) + ' bed-days',
        onClick: d => selectRoadUser(d.category)
    };

    var el = document.querySelector(selector),
        h = opt.height || el.clientHeight || 280;
    var margin = {
        top: opt.top || 12,
        right: opt.right || 55,
        bottom: 26,
        left: opt.left || 145
    };

    const panel = d3.select(selector);
    panel.selectAll('*')
        .remove();
    const width = Math.max(300, panel.node()
        .getBoundingClientRect()
        .width);
    const W = Math.max(10, width - margin.left - margin.right);
    const H = h - margin.top - margin.bottom;
    const svg = panel.append('svg')
        .attr('viewBox', [0, 0, width, h].join(' '))
        .attr('width', width)
        .attr('height', h);
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    if (!rows.length) {
        d3.select(selector)
            .html('<div class="chart-empty">No verified data for this view</div>');
        return;
    }

    var x = d3.scaleLinear()
        .domain([0, (d3.max(rows, function(d) {
            return opt.value(d) || 0;
        }) || 1) * 1.12])
        .range([0, W]);
    var y = d3.scaleBand()
        .domain(rows.map(function(d) {
            return opt.key(d);
        }))
        .rangeRound([0, H])
        .padding(0.24);

    // Draw grid lines and axes to support value comparison.
    xGrid(g, x, H, 4);
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + H + ')')
        .call(d3.axisBottom(x)
            .ticks(4)
            .tickFormat(opt.axisFormat || compact));
    g.selectAll('.bar-label')
        .data(rows)
        .join('text')
        .attr('class', 'chart-label')
        .attr('x', -10)
        .attr('y', function(d) {
            return y(opt.key(d)) + y.bandwidth() / 2 + 3.5;
        })
        .attr('text-anchor', 'end')
        .text(function(d) {
            var s = opt.key(d);
            return s.length > (opt.truncate || 25) ? s.slice(0, (opt.truncate || 25) - 1) + '…' : s;
        });

    var bars = g.selectAll('.value-bar')
        .data(rows)
        .join('rect')
        .attr('class', 'value-bar')
        .attr('x', 0)
        .attr('y', function(d) {
            return y(opt.key(d));
        })
        .attr('width', function(d) {
            return x(opt.value(d) || 0);
        })
        .attr('height', y.bandwidth())
        .attr('rx', 4)
        .style('fill', function(d, i) {
            return d.category === state.roadUser ? C.ink : opt.color;
        })
        .attr('aria-pressed', d => d.category === state.roadUser)
        .style('cursor', opt.onClick ? 'pointer' : 'crosshair');
    g.selectAll('.value-label')
        .data(rows)
        .join('text')
        .attr('class', 'chart-label-strong')
        .attr('x', function(d) {
            return x(opt.value(d) || 0) + 7;
        })
        .attr('y', function(d) {
            return y(opt.key(d)) + y.bandwidth() / 2 + 3.5;
        })
        .text(function(d) {
            return opt.valueFormat ? opt.valueFormat(opt.value(d)) : formatted(opt.value(d));
        });

    bindTip(bars, function(d) {
        return tip(opt.key(d), opt.valueFormat ? opt.valueFormat(opt.value(d)) : formatted(opt.value(d)), opt.tipDetail ? opt.tipDetail(d) : opt.tooltipLabel || '');
    });

    // Connect category selection to the detail panel and linked chart.
    if (opt.onClick) {
        bars.attr('role', 'button')
            .on('keydown.activate', function(event, d) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    opt.onClick(d);
                }
            });
        bars.on('click', function(event, d) {
            opt.onClick(d);
        });
    }
    axisStyles(svg);
}

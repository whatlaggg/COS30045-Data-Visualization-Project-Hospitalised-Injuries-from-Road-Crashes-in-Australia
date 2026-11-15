"use strict";
/* ========================================================
   Road users ranked by hospitalisations
   ======================================================== */
function drawRoadUsers() {
    const selector = '#chart-road-users',
        rows = filterRows('national', 'road_user', state.year)
        .filter(d => d.hosp !== null)
        .sort((a, b) => b.hosp - a.hosp)
        .slice(0, 6);
    const opt = {
        height: 275,
        color: C.orange,
        left: 152,
        right: 58,
        key: d => d.category,
        value: d => d.hosp,
        truncate: 24,
        tipDetail: d => d.category + ' · ' + state.year
    };

    var el = document.querySelector(selector),
        h = Math.max(110, el.clientHeight);
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
        .attr('height', y.bandwidth())
        .attr('rx', 4)
        .style('fill', function(d, i) {
            return opt.dynamicColor ? opt.dynamicColor(d, i) : opt.color;
        })
        .style('cursor', opt.onClick ? 'pointer' : 'crosshair')
        .attr('width', 0); // Animation start: 0 width

    // Animate the bars growing from left to right
    bars.transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('width', function(d) {
            return x(opt.value(d) || 0);
        });

    g.selectAll('.value-label')
        .data(rows)
        .join('text')
        .attr('class', 'chart-label-strong')
        .attr('y', function(d) {
            return y(opt.key(d)) + y.bandwidth() / 2 + 3.5;
        })
        .text(function(d) {
            return opt.valueFormat ? opt.valueFormat(opt.value(d)) : formatted(opt.value(d));
        })
        .attr('x', 7) // Animation start: start at the very left edge of the bar
        .transition() // Animate the labels sliding right along with the bars
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('x', function(d) {
            return x(opt.value(d) || 0) + 7;
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
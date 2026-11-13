"use strict";
/* ========================================================
   National hospitalisations over time
   ======================================================== */
function drawNationalTrend() {
    const selector = '#chart-national-trend',
        rows = nationalTotals;
    const opt = {
        color: C.blue,
        value: d => d.hosp,
        tooltipLabel: 'National hospitalisations'
    };

    var height = Math.max(110, document.querySelector(selector).clientHeight),
        margin = {
            top: 22,
            right: 22,
            bottom: 34,
            left: opt.left || 53
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
    var values = rows.map(function(d) {
            return opt.value(d);
        })
        .filter(function(v) {
            return v != null && isFinite(v);
        });
    if (!values.length) return;
    var minimum = (opt.min != null ? opt.min : 0),
        maximum = (opt.max != null ? opt.max : d3.max(values) * 1.12);

    var x = d3.scaleLinear()
        .domain([2011, 2021])
        .range([0, W]);
    var y = d3.scaleLinear()
        .domain([minimum, maximum])
        .range([H, 0]);
    var ticks = [2011, 2013, 2015, 2017, 2019, 2021];

    // Draw grid lines and axes to support value comparison.
    yGrid(g, y, W, 4);
    g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y)
            .ticks(4)
            .tickFormat(opt.tickFormat || compact));
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + H + ')')
        .call(d3.axisBottom(x)
            .tickValues(ticks)
            .tickFormat(d3.format('d')));

    // Define the line and shaded area from annual data points.
    var line = d3.line()
        .curve(d3.curveLinear)
        .defined(function(d) {
            return opt.value(d) != null;
        })
        .x(function(d) {
            return x(d.year);
        })
        .y(function(d) {
            return y(opt.value(d));
        });
    var area = d3.area()
        .curve(d3.curveLinear)
        .defined(function(d) {
            return opt.value(d) != null;
        })
        .x(function(d) {
            return x(d.year);
        })
        .y0(H)
        .y1(function(d) {
            return y(opt.value(d));
        });
    var gradId = 'gradient-' + selector.replace(/[^a-z0-9]/gi, '');
    var defs = svg.append('defs'),
        gradient = defs.append('linearGradient')
        .attr('id', gradId)
        .attr('x1', '0')
        .attr('y1', '0')
        .attr('x2', '0')
        .attr('y2', '1');
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', opt.color)
        .attr('stop-opacity', .18);
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', opt.color)
        .attr('stop-opacity', .01);
    g.append('path')
        .datum(rows)
        .attr('d', area)
        .style('fill', 'url(#' + gradId + ')');
    g.append('path')
        .datum(rows)
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', opt.color)
        .style('stroke-width', 2.8)
        .style('stroke-linejoin', 'round');

    // Highlight the selected year on the trend.
    var selected = rows.filter(function(d) {
        return d.year === state.year;
    })[0];
    if (selected && opt.value(selected) != null) {
        var px = x(selected.year),
            py = y(opt.value(selected));
        g.append('line')
            .attr('class', 'focus-line')
            .attr('x1', px)
            .attr('x2', px)
            .attr('y1', py)
            .attr('y2', H);
        g.append('circle')
            .attr('cx', px)
            .attr('cy', py)
            .attr('r', 7)
            .attr('fill', 'white')
            .attr('stroke', opt.color)
            .attr('stroke-width', 3);
        g.append('text')
            .attr('class', 'chart-selected-text')
            .attr('x', Math.max(36, Math.min(W - 27, px)))
            .attr('y', Math.max(10, py - 15))
            .attr('text-anchor', 'middle')
            .text(opt.markFormat ? opt.markFormat(opt.value(selected)) : formatted(opt.value(selected)));
    }
    var circles = g.selectAll('.line-hit')
        .data(rows.filter(function(d) {
            return opt.value(d) != null;
        }))
        .join('circle')
        .attr('class', 'line-hit')
        .attr('cx', function(d) {
            return x(d.year);
        })
        .attr('cy', function(d) {
            return y(opt.value(d));
        })
        .attr('r', d => d.year === state.year ? 7 : 4.5)
        .attr('fill', d => d.year === state.year ? 'white' : opt.color)
        .attr('stroke', opt.color)
        .attr('stroke-width', d => d.year === state.year ? 3 : 1.5)
        .attr('aria-pressed', d => d.year === state.year)
        .style('cursor', 'pointer');
    // Choose a focus year directly from an annual mark.
    circles.attr('role', 'button')
        .on('click.year', (event, row) => setYear(row.year))
        .on('keydown.year', (event, row) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setYear(row.year);
            }
        });

    bindTip(circles, function(d) {
        return tip(String(d.year), opt.tipFormat ? opt.tipFormat(opt.value(d)) : formatted(opt.value(d)), opt.tooltipLabel);
    });
    axisStyles(svg);
}

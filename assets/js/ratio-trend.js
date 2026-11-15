"use strict";
/* ========================================================
   Bed-days per hospitalisation over time
   ======================================================== */
function drawRatioTrend() {
    const selector = '#chart-ratio-trend',
        rows = nationalTotals;
    const opt = {
        color: C.teal,
        value: ratio,
        min: 0,
        left: 42,
        tickFormat: n => n.toFixed(1),
        markFormat: decimals,
        tipFormat: decimals,
        tooltipLabel: 'Bed-days per hospitalisation'
    };

    var height = Math.max(110, document.querySelector(selector).clientHeight),
        margin = {
            top: 22,
            right: 22,
            bottom: 34,
            left: opt.left || 53
        };

    const panel = d3.select(selector);

    // Track whether the year changed to differentiate between a year click and a chapter switch
    const previousYear = panel.node().dataset.lastRenderedYear;
    const currentYear = String(state.year);
    
    // It's a year update ONLY if the SVG exists AND the year actually changed.
    const isYearUpdateOnly = !panel.select('svg').empty() && previousYear !== currentYear && previousYear !== undefined;

    const width = Math.max(300, panel.node().getBoundingClientRect().width);
    const W = Math.max(10, width - margin.left - margin.right);
    const H = height - margin.top - margin.bottom;

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

    let g;

    // ==========================================
    // 1. FULL RENDER (Initial load or Chapter Switch)
    // ==========================================
    if (!isYearUpdateOnly) {
        panel.selectAll('*').remove();

        let svg = panel.append('svg')
            .attr('viewBox', [0, 0, width, height].join(' '))
            .attr('width', width)
            .attr('height', height);
        g = svg.append('g')
            .attr('class', 'chart-content')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        yGrid(g, y, W, 4);
        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(y).ticks(4).tickFormat(opt.tickFormat || compact));
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0,' + H + ')')
            .call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('d')));

        var line = d3.line()
            .curve(d3.curveLinear)
            .defined(d => opt.value(d) != null)
            .x(d => x(d.year))
            .y(d => y(opt.value(d)));
            
        var area = d3.area()
            .curve(d3.curveLinear)
            .defined(d => opt.value(d) != null)
            .x(d => x(d.year))
            .y0(H)
            .y1(d => y(opt.value(d)));
            
        var gradId = 'gradient-' + selector.replace(/[^a-z0-9]/gi, '');
        var defs = svg.append('defs'),
            gradient = defs.append('linearGradient')
            .attr('id', gradId)
            .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', opt.color).attr('stop-opacity', .18);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', opt.color).attr('stop-opacity', .01);
            
        g.append('path')
            .datum(rows)
            .attr('d', area)
            .style('fill', 'url(#' + gradId + ')')
            .style('opacity', 0)
            .transition().duration(1500).style('opacity', 1);
            
        var linePath = g.append('path')
            .datum(rows)
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', opt.color)
            .style('stroke-width', 2.8)
            .style('stroke-linejoin', 'round');
            
        var totalLength = linePath.node().getTotalLength();
        linePath
            .attr('stroke-dasharray', totalLength + " " + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1500)
            .ease(d3.easeSinInOut)
            .attr('stroke-dashoffset', 0);

        g.append('line').attr('class', 'focus-line').style('opacity', 0);
        g.append('circle').attr('class', 'focus-circle').attr('r', 7).attr('fill', 'white').attr('stroke', opt.color).attr('stroke-width', 3).style('opacity', 0);
        g.append('text').attr('class', 'chart-selected-text').attr('text-anchor', 'middle').style('opacity', 0);

        var circles = g.selectAll('.line-hit')
            .data(rows.filter(d => opt.value(d) != null))
            .join('circle')
            .attr('class', 'line-hit')
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(opt.value(d)))
            .attr('stroke', opt.color)
            .style('cursor', 'pointer')
            .style('opacity', 0);
            
        circles.transition().duration(1500).style('opacity', 1);

        circles.attr('role', 'button')
        .on('click.year', (event, row) => {
            if (state.year === row.year) return; // Prevent same-click redraw
            setYear(row.year);
        })
        .on('keydown.year', (event, row) => {
            if (event.key === 'Enter' || event.key === ' ') {
                if (state.year === row.year) return; // Prevent same-click redraw
                event.preventDefault();
                setYear(row.year);
            }
        });

        bindTip(circles, d => tip(String(d.year), opt.tipFormat ? opt.tipFormat(opt.value(d)) : formatted(opt.value(d)), opt.tooltipLabel));
        axisStyles(svg);

    } else {
        g = panel.select('.chart-content');
    }

    // ==========================================
    // 2. YEAR UPDATE PHASE: Move active states
    // ==========================================
    var selected = rows.filter(d => d.year === state.year)[0];
    
    if (selected && opt.value(selected) != null) {
        var px = x(selected.year),
            py = y(opt.value(selected));
            
        g.select('.focus-line')
            .attr('x1', px).attr('x2', px).attr('y1', py).attr('y2', H)
            .style('opacity', 1);
            
        g.select('.focus-circle')
            .attr('cx', px).attr('cy', py)
            .style('opacity', 1);
            
        g.select('.chart-selected-text')
            .attr('x', Math.max(36, Math.min(W - 27, px)))
            .attr('y', py - 15)
            .text(opt.markFormat ? opt.markFormat(opt.value(selected)) : formatted(opt.value(selected)))
            .style('opacity', 1);
    }

    g.selectAll('.line-hit')
        .attr('r', d => d.year === state.year ? 7 : 4.5)
        .attr('fill', d => d.year === state.year ? 'white' : opt.color)
        .attr('stroke-width', d => d.year === state.year ? 3 : 1.5)
        .attr('aria-pressed', d => d.year === state.year);
        
    panel.node().dataset.lastRenderedYear = currentYear;
}
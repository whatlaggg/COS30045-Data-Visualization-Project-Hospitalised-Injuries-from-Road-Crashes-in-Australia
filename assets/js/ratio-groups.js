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
        .slice(0, 8); // Top 8 
    const opt = {
        height: 235,
        key: d => d.category,
        value: ratio,
        valueFormat: decimals,
        axisFormat: n => n.toFixed(0),
        color: C.blue,
        left: 220, 
        right: 45,
        truncate: 35, 
        tipDetail: d => formatted(d.hosp) + ' cases · ' + formatted(d.days) + ' bed-days',
        onClick: d => selectRoadUser(d.category)
    };

    var el = document.querySelector(selector),
        h = Math.max(110, el.clientHeight);
    var margin = {
        top: 25, 
        right: opt.right || 55,
        bottom: 26,
        left: opt.left || 145
    };

    const panel = d3.select(selector);
    
    const width = Math.max(300, panel.node().clientWidth);
    const W = Math.max(10, width - margin.left - margin.right);
    const H = h - margin.top - margin.bottom;

    // --- NEW UPDATE LOGIC ---
    const previousYear = panel.node().dataset.lastRenderedYear;
    const currentYear = String(state.year);
    
    const isFirstRender = panel.select('svg').empty();
    const previousWidth = isFirstRender ? null : panel.select('svg').attr('width');
    const isResized = previousWidth !== null && previousWidth !== String(width);
    
    // 1. If only the road user was clicked (year and size are identical)
    const isRoadUserClickOnly = !isFirstRender && (previousYear === currentYear) && !isResized;
    // 2. If the year changed from the dropdown/timeline
    const isYearUpdateOnly = !isFirstRender && (previousYear !== currentYear) && !isResized;

    // INSTANT EXIT: Just update colors and stop. No transitions!
    if (isRoadUserClickOnly) {
        panel.selectAll('.value-bar')
            .style('fill', d => d.category === state.roadUser ? C.ink : opt.color)
            .attr('aria-pressed', d => d.category === state.roadUser);
        return; 
    }

    if (!rows.length) {
        d3.select(selector).html('<div class="chart-empty">No verified data for this view</div>');
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

    let g, svg, gridGroup;

    if (!isYearUpdateOnly) {
        panel.selectAll('*').remove();
        svg = panel.append('svg')
            .attr('viewBox', [0, 0, width, h].join(' '))
            .attr('width', width)
            .attr('height', h);
        g = svg.append('g')
            .attr('class', 'chart-content')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        gridGroup = g.append('g').attr('class', 'grid-group'); 
        g.append('g').attr('class', 'x-axis').attr('transform', 'translate(0,' + H + ')');
    } else {
        svg = panel.select('svg');
        g = panel.select('.chart-content');
        gridGroup = g.select('.grid-group');
    }

    gridGroup.selectAll('*').remove();
    xGrid(gridGroup, x, H, 4); 

    g.select('.x-axis').transition().duration(800)
        .call(d3.axisBottom(x).ticks(4).tickFormat(opt.axisFormat || compact));

    const t = d3.transition().duration(800).ease(d3.easeCubicOut);

    // Y-Axis Labels
    g.selectAll('.bar-label')
        .data(rows, opt.key)
        .join(
            enter => enter.append('text')
                .attr('class', 'bar-label chart-label')
                .attr('x', -10)
                .attr('y', d => y(opt.key(d)) + y.bandwidth() / 2 + 3.5)
                .attr('text-anchor', 'end')
                .text(d => {
                    var s = opt.key(d);
                    return s.length > (opt.truncate || 25) ? s.slice(0, (opt.truncate || 25) - 1) + '…' : s;
                })
                .style('opacity', 0)
                .call(e => e.transition(t).style('opacity', 1)),
            update => update.call(u => u.transition(t)
                .style('opacity', 1) 
                .attr('y', d => y(opt.key(d)) + y.bandwidth() / 2 + 3.5)),
            exit => exit.call(e => e.transition(t).style('opacity', 0).remove())
        );

    // Bars
    var bars = g.selectAll('.value-bar')
        .data(rows, opt.key)
        .join(
            enter => enter.append('rect')
                .attr('class', 'value-bar')
                .attr('x', 0)
                .attr('y', d => y(opt.key(d)))
                .attr('height', y.bandwidth())
                .attr('rx', 4)
                .attr('width', 0)
                .style('opacity', 0)
                .style('fill', d => d.category === state.roadUser ? C.ink : opt.color)
                .style('cursor', opt.onClick ? 'pointer' : 'crosshair')
                .call(e => e.transition(t).style('opacity', 1).attr('width', d => x(opt.value(d) || 0))),
            update => update.call(u => u.transition(t)
                .style('opacity', 1) 
                .attr('y', d => y(opt.key(d)))
                .attr('width', d => x(opt.value(d) || 0))
                .style('fill', d => d.category === state.roadUser ? C.ink : opt.color)),
            exit => exit.call(e => e.transition(t).style('opacity', 0).attr('width', 0).remove())
        );

    // Value Labels
    g.selectAll('.value-label')
        .data(rows, opt.key)
        .join(
            enter => enter.append('text')
                .attr('class', 'value-label chart-label-strong')
                .attr('y', d => y(opt.key(d)) + y.bandwidth() / 2 + 3.5)
                .text(d => opt.valueFormat ? opt.valueFormat(opt.value(d)) : formatted(opt.value(d)))
                .attr('x', 7) 
                .style('opacity', 0)
                .call(e => e.transition(t).style('opacity', 1).attr('x', d => x(opt.value(d) || 0) + 7)),
            update => update.call(u => u.transition(t)
                .style('opacity', 1) 
                .attr('y', d => y(opt.key(d)) + y.bandwidth() / 2 + 3.5)
                .attr('x', d => x(opt.value(d) || 0) + 7)
                .text(d => opt.valueFormat ? opt.valueFormat(opt.value(d)) : formatted(opt.value(d)))),
            exit => exit.call(e => e.transition(t).style('opacity', 0).attr('x', 0).remove())
        );

    // Rebind tooltips and clicks on updates
    bindTip(bars, function(d) {
        return tip(opt.key(d), opt.valueFormat ? opt.valueFormat(opt.value(d)) : formatted(opt.value(d)), opt.tipDetail ? opt.tipDetail(d) : opt.tooltipLabel || '');
    });

    if (opt.onClick) {
        bars.attr('role', 'button')
            .on('keydown.activate', function(event, d) {
                if (event.key === 'Enter' || event.key === ' ') {
                    if (state.roadUser === d.category) return;
                    event.preventDefault();
                    opt.onClick(d);
                }
            })
            .on('click', function(event, d) {
                if (state.roadUser === d.category) return;
                opt.onClick(d);
            });
    }

    bars.attr('aria-pressed', d => d.category === state.roadUser);
    
    if (!isYearUpdateOnly) axisStyles(svg);
    panel.node().dataset.lastRenderedYear = currentYear;
}
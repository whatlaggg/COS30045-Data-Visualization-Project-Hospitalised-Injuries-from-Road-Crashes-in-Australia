"use strict";
/* ========================================================
   Hospitalisations compared with hospital bed-days
   ======================================================== */
function drawScatterplot() {
    const selector = '#chart-scatter',
        rows = filterRows('national', 'road_user', state.year)
        .filter(verified)
        .filter(d => d.hosp > 0);

    var margin = {
        top: 22,
        right: 18,
        bottom: 49,
        left: 70
    };

    const panel = d3.select(selector);
    panel.selectAll('*')
        .remove();
    const width = Math.max(300, panel.node()
        .getBoundingClientRect()
        .width);
    const height = Math.max(130, panel.node().clientHeight);
    const W = Math.max(10, width - margin.left - margin.right);
    const H = height - margin.top - margin.bottom;
    const svg = panel.append('svg')
        .attr('viewBox', [0, 0, width, height].join(' '))
        .attr('width', width)
        .attr('height', height);
    const g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.scaleLinear()
        .domain([0, d3.max(rows, function(d) {
            return d.hosp;
        }) * 1.12])
        .range([0, W]);
    var y = d3.scaleLinear()
        .domain([0, d3.max(rows, function(d) {
            return d.days;
        }) * 1.13])
        .range([H, 0]);

    // Draw grid lines and axes to support value comparison.
    yGrid(g, y, W, 4);
    xGrid(g, x, H, 5);
    g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y)
            .ticks(4)
            .tickFormat(compact));
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + H + ')')
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(compact));
    g.append('text')
        .attr('x', W / 2)
        .attr('y', H + 40)
        .attr('fill', C.muted)
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .text('Number of hospitalisations');
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -H / 2)
        .attr('y', -54)
        .attr('fill', C.muted)
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .text('Hospital bed-days');

    var bubbles = g.selectAll('.bubble')
        .data(rows)
        .join('circle')
        .attr('class', 'bubble')
        .attr('role', 'button')
        .attr('aria-pressed', d => d.category === state.roadUser)
        .attr('cx', function(d) {
            return x(d.hosp);
        })
        .attr('cy', function(d) {
            return y(d.days);
        })
        .attr('fill', function(d) {
            return d.category === state.roadUser ? C.orange : C.blue;
        })
        .attr('fill-opacity', function(d) {
            return d.category === state.roadUser ? .94 : .63;
        })
        .attr('stroke', function(d) {
            return d.category === state.roadUser ? '#0d47a1' : 'white';
        })
        .attr('stroke-width', function(d) {
            return d.category === state.roadUser ? 2 : 1.5;
        })
        .style('cursor', 'pointer')
        .attr('tabindex', 0)
        .attr('aria-label', function(d) {
            return d.category + ': ' + formatted(d.hosp) + ' hospitalisations, ' + formatted(d.days) + ' bed-days';
        })
        .attr('r', 0); // Animation start: radius 0

    // Animate the bubbles popping in with an elastic bounce
    bubbles.transition()
        .duration(800)
        .ease(d3.easeElasticOut)
        .attr('r', function(d) {
            return d.category === state.roadUser ? 10 : 7;
        });

    bindTip(bubbles, function(d) {
        return tip(d.category, formatted(d.hosp) + ' cases', formatted(d.days) + ' bed-days · ' + decimals(ratio(d)) + ' days/case');
    });

    // Connect category selection to the detail panel and linked chart.
    bubbles.on('click', function(event, d) {
        selectRoadUser(d.category);
    });
    bubbles.on('keydown', function(event, d) {
        if (event.keyCode === 13 || event.keyCode === 32) {
            event.preventDefault();
            selectRoadUser(d.category);
        }
    });
    
    // Keep the selected mark visible above overlapping small-count categories.
    bubbles.filter(d => d.category === state.roadUser).raise();
    
    var chosen = rows.filter(function(d) {
        return d.category === state.roadUser;
    })[0];
    
    if (chosen) {
        var bx = x(chosen.hosp),
            by = y(chosen.days);
        g.append('text')
            .attr('x', Math.max(35, Math.min(W - 35, bx)))
            .attr('y', Math.max(12, by - 17))
            .attr('text-anchor', 'middle')
            .attr('class', 'chart-selected-text')
            .text(chosen.category.length > 19 ? chosen.category.slice(0, 18) + '…' : chosen.category)
            .style('opacity', 0) // Animation start: invisible text
            .transition() // Fade in the label
            .duration(800)
            .style('opacity', 1);
    }
}
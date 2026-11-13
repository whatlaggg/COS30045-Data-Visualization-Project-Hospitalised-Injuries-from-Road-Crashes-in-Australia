"use strict";
/* ========================================================
   Hospitalisations by age group
   ======================================================== */
function drawAgeGroups() {
    const selector = '#chart-age';
    const order = ['0-7', '8-16', '17-25', '26-39', '40-64', '65-74', '75+', 'Missing'];
    const rows = filterRows('national', 'age_group', state.year)
        .filter(d => d.hosp !== null)
        .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
    const opt = {
        height: 275,
        color: C.teal,
        key: d => d.category,
        value: d => d.hosp,
        left: 44,
        bottom: 40,
        tooltipLabel: 'Hospitalisations; age bands have unequal widths'
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
        .style('cursor', 'crosshair');

    bindTip(bars, function(d) {
        return tip(String(opt.key(d)), formatted(opt.value(d)), opt.tooltipLabel || '');
    });
    axisStyles(svg);
}

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

    const panel = d3.select(selector);

    // 1. Detect if this is a year change or a chapter change
    const previousYear = panel.node().dataset.lastRenderedYear;
    const currentYear = String(state.year);
    
    // If the year is the same but the chart is being redrawn (e.g., chapter change), this is false.
    const isYearUpdateOnly = !panel.select('svg').empty() && previousYear !== currentYear && previousYear !== undefined;

    var height = Math.max(110, document.querySelector(selector).clientHeight),
        margin = {
            top: 35, // Headroom for tooltips
            right: 10,
            bottom: opt.bottom || 34,
            left: opt.left || 55
        };

    const width = Math.max(300, panel.node().getBoundingClientRect().width);
    const W = Math.max(10, width - margin.left - margin.right);
    const H = height - margin.top - margin.bottom;

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

    let g;

    if (!isYearUpdateOnly) {
        // ==========================================
        // FULL RENDER (Chapter Switch or Initial Load)
        // ==========================================
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
            .call(d3.axisLeft(y).ticks(4).tickFormat(compact));
            
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
            .attr('rx', 3)
            .attr('fill', function(d) {
                return String(opt.key(d)) === currentYear ? opt.selectedColor || C.orange : opt.color;
            })
            .style('opacity', function(d) {
                return String(opt.key(d)) !== currentYear ? .62 : .93;
            })
            .attr('aria-pressed', d => String(opt.key(d)) === currentYear)
            .style('cursor', 'pointer')
            .attr('y', H) 
            .attr('height', 0); // Animation start: flat on the x-axis

        // Animate the bars growing upwards
        bars.transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr('y', function(d) {
                return y(opt.value(d) || 0);
            })
            .attr('height', function(d) {
                return H - y(opt.value(d) || 0);
            });

        bars.attr('role', 'button')
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

        bindTip(bars, function(d) {
            return tip(String(opt.key(d)), formatted(opt.value(d)), opt.tooltipLabel || '');
        });
        
        axisStyles(svg);
        
    } else {
        // ==========================================
        // YEAR UPDATE ONLY (Clicking a bar / dropdown)
        // ==========================================
        g = panel.select('.chart-content');
        
        g.selectAll('.data-bar')
            .attr('fill', function(d) {
                return String(opt.key(d)) === currentYear ? opt.selectedColor || C.orange : opt.color;
            })
            .style('opacity', function(d) {
                return String(opt.key(d)) !== currentYear ? .62 : .93;
            })
            .attr('aria-pressed', d => String(opt.key(d)) === currentYear);
    }

    // Save current year so the next render knows if it's a chapter switch or a year switch
    panel.node().dataset.lastRenderedYear = currentYear;
}
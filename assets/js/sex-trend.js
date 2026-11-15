"use strict";

function drawSexTrend() {
    const selectEl = document.getElementById('sex-state-select');
    if (!selectEl) return; // Failsafe if the DOM isn't ready
    const region = selectEl.value;
    
    const selector = '#chart-sex-trend';
    const panel = d3.select(selector);
    if (panel.empty()) return; // Failsafe if the chart div isn't found
    
    // 1. Calculate current dimensions
    const panelNode = panel.node();
    const width = Math.max(170, panelNode.clientWidth);
    const height = Math.max(100, panelNode.clientHeight);
    
    // 2. Check previous state
    const svgSelection = panel.select('svg');
    const isFirstRender = svgSelection.empty();
    
    const previousRegion = panelNode.dataset.lastRenderedRegion;
    const previousWidth = isFirstRender ? null : svgSelection.attr('width');
    
    // Check if the chart size physically changed (e.g., revealed from a hidden background tab)
    const isResized = (previousWidth !== null && previousWidth !== String(width));
    
    // 3. We only do a smooth point transition if it's the exact same region and exact same box size
    const isYearChangeOnly = !isFirstRender && (previousRegion === region) && !isResized;

    const rows = data.filter(d => d.source === 'state_territory' && d.breakdown === 'sex' && d.geography === region);
    const points = years.map(year => {
        const male = rows.find(d => d.year === year && d.category === 'Male');
        const female = rows.find(d => d.year === year && d.category === 'Female');
        const valid = male && female && male.hosp != null && female.hosp != null && male.hosp + female.hosp > 0;
        const total = valid ? male.hosp + female.hosp : null;
        return {
            year, total, Male: valid ? 100 * male.hosp / total : null,
            Female: valid ? 100 * female.hosp / total : null,
            maleCount: male?.hosp, femaleCount: female?.hosp
        };
    });

    if (!points.some(d => d.total != null)) {
        if (!isYearChangeOnly) {
            panel.selectAll('*').remove();
            panel.append('div').attr('class', 'chart-empty').text('No paired male and female counts available for this state.');
        }
        return;
    }

    const m = {top: 27, right: 12, bottom: 27, left: 35};
    const W = Math.max(10, width - m.left - m.right);
    const H = Math.max(10, height - m.top - m.bottom);
    
    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, W]);
    const y = d3.scaleLinear().domain([0, 100]).range([H, 0]);

    let g, svg;

    // ==========================================
    // 1. FULL RENDER (Region Switch, Chapter Switch, Initial Load, or Resize)
    // ==========================================
    if (!isYearChangeOnly) {
        panel.selectAll('*').remove();
        svg = panel.append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);
        
        const clipId = 'sex-trend-clip';
        svg.append('defs').append('clipPath')
            .attr('id', clipId)
            .append('rect')
            .attr('width', 0)
            .attr('height', height)
            .transition()
            .duration(1500)
            .ease(d3.easeSinInOut)
            .attr('width', width);

        g = svg.append('g').attr('class', 'chart-content').attr('transform', `translate(${m.left},${m.top})`);
        
        yGrid(g, y, W, 4);
        g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickValues([0, 25, 50, 75, 100]).tickFormat(d => d + '%'));
        const ticks = W < 230 ? [years[0], years[Math.floor(years.length / 2)], years[years.length - 1]] : years.filter(d => d % 2 === 1);
        g.append('g').attr('class', 'axis').attr('transform', `translate(0,${H})`)
            .call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('d')));
            
        g.append('line').attr('class', 'focus-line')
            .attr('x1', x(state.year)).attr('x2', x(state.year))
            .attr('y1', 0).attr('y2', H)
            .style('opacity', 0)
            .transition().duration(1500).style('opacity', 1);
            
        for (const [i, sex] of ['Male', 'Female'].entries()) {
            const color = sex === 'Male' ? '#0d47a1' : '#2196f3';
            const dash = sex === 'Female' ? '6 3' : null;
            const line = d3.line().defined(d => d[sex] != null).x(d => x(d.year)).y(d => y(d[sex]));
            
            g.append('path').datum(points).attr('class', 'sex-trend-line').attr('d', line)
                .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5).attr('stroke-dasharray', dash)
                .attr('clip-path', `url(#${clipId})`);
                
            const legendX = i * 83;
            g.append('line').attr('x1', legendX).attr('x2', legendX + 18).attr('y1', -13).attr('y2', -13)
                .attr('stroke', color).attr('stroke-width', 2.5).attr('stroke-dasharray', dash);
            g.append('text').attr('class', 'chart-label').attr('x', legendX + 23).attr('y', -10).text(sex);
            
            const marks = g.selectAll('.sex-point-' + sex).data(points.filter(d => d[sex] != null).map(d => ({...d, category: sex})))
                .join('circle').attr('class', 'sex-point-' + sex).attr('cx', d => x(d.year)).attr('cy', d => y(d[sex]))
                .attr('r', d => d.year === state.year ? 5 : 3.5).attr('fill', d => d.year === state.year ? 'white' : color)
                .attr('stroke', color).attr('stroke-width', 2).attr('role', 'button')
                .attr('aria-pressed', d => d.year === state.year).style('cursor', 'pointer')
                .style('opacity', 0)
                .on('click.year', (event, d) => {
                    if (state.year === d.year) return; // Prevent same-click redraw
                    setYear(d.year);
                })
                .on('keydown.year', (event, d) => {
                    if (event.key === 'Enter' || event.key === ' ') { 
                        if (state.year === d.year) return; // Prevent same-click redraw
                        event.preventDefault(); 
                        setYear(d.year); 
                    }
                });
                
            marks.transition().duration(1500).style('opacity', 1);

            bindTip(marks, d => tip(`${region} · ${sex} · ${d.year}`, `${d[sex].toFixed(1)}%`,
                `${formatted(sex === 'Male' ? d.maleCount : d.femaleCount)} of ${formatted(d.total)} published male + female cases`));
        }
        axisStyles(svg);
        
    } else {
        // ==========================================
        // 2. YEAR UPDATE ONLY (Updates existing markers)
        // ==========================================
        g = panel.select('.chart-content');
        
        // Snap the focus vertical line to the new year
        g.select('.focus-line')
            .attr('x1', x(state.year))
            .attr('x2', x(state.year));
            
        // Snap the sizes and colors of the data points for the selected year
        for (const sex of ['Male', 'Female']) {
            const color = sex === 'Male' ? '#0d47a1' : '#2196f3';
            g.selectAll('.sex-point-' + sex)
                .attr('r', d => d.year === state.year ? 5 : 3.5)
                .attr('fill', d => d.year === state.year ? 'white' : color)
                .attr('aria-pressed', d => d.year === state.year);
        }
    }
    
    // Save the current region so the next render knows what to compare against
    panelNode.dataset.lastRenderedRegion = region;
}
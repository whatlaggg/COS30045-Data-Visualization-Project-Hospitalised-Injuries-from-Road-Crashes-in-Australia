"use strict";
// Heatmap of annual percentage changes. Each measure has its own annual denominator.
function drawYearChange() {
    const el = d3.select('#chart-year-change'); el.selectAll('*').remove();
    const width = Math.max(250, el.node().clientWidth), height = Math.max(100, el.node().clientHeight);
    const m = {top: 13, right: 12, bottom: 28, left: 104}, W = Math.max(10,width-m.left-m.right), H = Math.max(10,height-m.top-m.bottom);
    const svg = el.append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('width',width).attr('height',height);
    const g = svg.append('g').attr('transform',`translate(${m.left},${m.top})`);
    const years = nationalTotals.slice(1).map(d=>d.year), measures = [
        {key:'Hospitalisations',field:'hosp'}, {key:'Bed-days',field:'days'}
    ];
    const x = d3.scaleBand().domain(years).range([0,W]).padding(.07), y = d3.scaleBand().domain(measures.map(d=>d.key)).range([0,H]).padding(.13);
    const cells = measures.flatMap(measure => years.map(year => {
        const now = nationalByYear[year][measure.field], prev = nationalByYear[year-1][measure.field];
        return {year, key:measure.key, pct:prev ? 100*(now-prev)/prev : null};
    }));
    const extent = d3.max(cells,d=>Math.abs(d.pct)) || 1;
    const color = d3.scaleDiverging([-extent,0,extent], d3.interpolateRdBu);
    const marks = g.selectAll('rect').data(cells).join('rect').attr('x',d=>x(d.year)).attr('y',d=>y(d.key))
        .attr('width',x.bandwidth()).attr('height',y.bandwidth()).attr('rx',3).attr('fill',d=>color(d.pct))
        .attr('stroke',d=>d.year===state.year?'#173a63':'none').attr('stroke-width',2)
        .attr('role','button').attr('tabindex',0)
        .attr('aria-label',d=>`${d.key}, ${d.year}: ${d.pct>=0?'+':''}${d.pct.toFixed(1)}% from prior year`)
        .on('click',(event,d)=>setYear(d.year)).on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setYear(d.year)}});
    bindTip(marks,d=>tip(`${d.key} · ${d.year}`,`${d.pct>=0?'+':''}${d.pct.toFixed(1)}%`, 'Change from previous year'));
    if(x.bandwidth()>48 && y.bandwidth()>25) g.selectAll('.cell-value').data(cells).join('text').attr('class','cell-value')
        .attr('x',d=>x(d.year)+x.bandwidth()/2).attr('y',d=>y(d.key)+y.bandwidth()/2+4).attr('text-anchor','middle')
        .attr('fill',d=>Math.abs(d.pct)>extent*.45?'#fff':'#173a63').attr('font-size',11).attr('font-weight',700)
        .attr('pointer-events','none').text(d=>`${d.pct>0?'+':''}${d.pct.toFixed(1)}%`);
    g.append('g').attr('class','axis').attr('transform',`translate(0,${H})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0).tickPadding(8));
}

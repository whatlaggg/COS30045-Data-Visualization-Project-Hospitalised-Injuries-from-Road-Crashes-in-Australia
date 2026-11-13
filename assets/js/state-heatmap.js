"use strict";
// State-by-year counts: one cell per published state total, with a shared count scale.
function drawStateHeatmap() {
    const el=d3.select('#chart-state-heatmap');el.selectAll('*').remove();
    const width=Math.max(270,el.node().clientWidth),height=Math.max(120,el.node().clientHeight);
    const m={top:9,right:10,bottom:25,left:36},W=Math.max(10,width-m.left-m.right),H=Math.max(10,height-m.top-m.bottom);
    const svg=el.append('svg').attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height);
    const g=svg.append('g').attr('transform',`translate(${m.left},${m.top})`);
    const rows=data.filter(d=>d.source==='state_territory'&&d.breakdown==='total'&&d.population==='All persons'&&d.hosp!=null);
    const regions=['NSW','Vic','Qld','WA','SA','Tas','ACT','NT'];
    const x=d3.scaleBand().domain(years).range([0,W]).padding(.06),y=d3.scaleBand().domain(regions).range([0,H]).padding(.07);
    const color=d3.scaleSequential([0,d3.max(rows,d=>d.hosp)||1],d3.interpolateBlues);
    const marks=g.selectAll('rect').data(rows).join('rect').attr('x',d=>x(d.year)).attr('y',d=>y(d.geography))
        .attr('width',x.bandwidth()).attr('height',y.bandwidth()).attr('rx',2).attr('fill',d=>color(d.hosp))
        .attr('stroke',d=>d.year===state.year?'#173a63':'none').attr('stroke-width',1.5)
        .attr('role','button').attr('tabindex',0)
        .attr('aria-label',d=>`${d.geography}, ${d.year}: ${formatted(d.hosp)} hospitalisations`)
        .on('click',(event,d)=>setYear(d.year)).on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setYear(d.year)}});
    bindTip(marks,d=>tip(`${d.geography} · ${d.year}`,formatted(d.hosp)+' hospitalisations','State total; counts, not rates'));
    g.append('g').attr('class','axis').attr('transform',`translate(0,${H})`).call(d3.axisBottom(x).tickValues(years.filter(d=>d%2===1)).tickSize(0).tickPadding(6));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0).tickPadding(6));
}

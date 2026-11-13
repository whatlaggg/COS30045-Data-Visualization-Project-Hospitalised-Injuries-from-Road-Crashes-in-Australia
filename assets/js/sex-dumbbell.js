"use strict";
// A paired-dot chart compares within-state shares; excluded or suppressed categories remain outside the denominator.
function drawSexDumbbell() {
    const el=d3.select('#chart-sex-dumbbell');el.selectAll('*').remove();
    const width=Math.max(230,el.node().clientWidth),height=Math.max(120,el.node().clientHeight);
    const m={top:17,right:12,bottom:26,left:39},W=Math.max(10,width-m.left-m.right),H=Math.max(10,height-m.top-m.bottom);
    const svg=el.append('svg').attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height);
    const g=svg.append('g').attr('transform',`translate(${m.left},${m.top})`);
    const rows=filterRows('state_territory','sex',state.year).filter(d=>d.hosp!==null&&(d.category==='Male'||d.category==='Female'));
    const pairs=d3.groups(rows,d=>d.geography).map(([geography,items])=>{
        const male=items.find(d=>d.category==='Male'),female=items.find(d=>d.category==='Female');
        const total=(male?.hosp||0)+(female?.hosp||0);
        return {geography,male:total?100*male.hosp/total:null,female:total?100*female.hosp/total:null,total};
    }).filter(d=>d.male!=null&&d.female!=null).sort((a,b)=>b.male-a.male);
    const x=d3.scaleLinear().domain([0,100]).range([0,W]),y=d3.scaleBand().domain(pairs.map(d=>d.geography)).range([0,H]).padding(.28);
    g.selectAll('.pair-line').data(pairs).join('line').attr('x1',d=>x(d.female)).attr('x2',d=>x(d.male))
        .attr('y1',d=>y(d.geography)+y.bandwidth()/2).attr('y2',d=>y(d.geography)+y.bandwidth()/2).attr('stroke','#a8cbe8').attr('stroke-width',3);
    for(const sex of ['female','male']) {
        const marks=g.selectAll('.dot-'+sex).data(pairs).join('circle').attr('cx',d=>x(d[sex]))
            .attr('cy',d=>y(d.geography)+y.bandwidth()/2).attr('r',Math.min(5,Math.max(3,y.bandwidth()*.3)))
            .attr('fill',sex==='male'?'#0d47a1':'#45a9e9');
        bindTip(marks,d=>tip(`${d.geography} · ${sex==='male'?'Male':'Female'}`,d[sex].toFixed(1)+'% of male + female published counts',formatted(d.total)+' combined cases'));
    }
    g.append('g').attr('class','axis').attr('transform',`translate(0,${H})`).call(d3.axisBottom(x).tickValues([0,25,50,75,100]).tickFormat(d=>d+'%').tickSize(0).tickPadding(5));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0).tickPadding(5));
    g.append('circle').attr('cx',W-86).attr('cy',-7).attr('r',4).attr('fill','#45a9e9');
    g.append('text').attr('x',W-78).attr('y',-4).attr('class','chart-label').text('Female');
    g.append('circle').attr('cx',W-34).attr('cy',-7).attr('r',4).attr('fill','#0d47a1');
    g.append('text').attr('x',W-26).attr('y',-4).attr('class','chart-label').text('Male');
}

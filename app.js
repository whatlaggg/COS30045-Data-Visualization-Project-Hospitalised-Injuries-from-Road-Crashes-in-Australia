/* RoadLens: offline D3.js dashboard. All charts use the bundled D3.js v3.5.6. */
(function () {
  'use strict';
  if (!window.d3 || !Array.isArray(window.ROAD_ROWS)) {
    document.querySelector('#main-content').innerHTML = '<p style="padding:40px">Unable to load the dashboard. Keep index.html, app.js, assets/ and vendor/ together in the same folder.</p>';
    return;
  }

  var C = {blue:'#4778de',blue2:'#6a9bfa',teal:'#16a18c',orange:'#ed9950',ink:'#213957',muted:'#7c8da4',grid:'#e9eef5'};
  var N = d3.format(',d'), F = d3.format(',.2f');
  var years = d3.range(2011,2022);
  var data = window.ROAD_ROWS.map(function (r) {
    return {year:r[0], geography:r[1],category:r[2],hosp:r[3],days:r[4],breakdown:r[5],source:r[6],population:r[7],suppressed:r[8]};
  });
  var state = {year:2021,page:'overview',roadUser:'Pedestrian'};
  var tooltip = d3.select('#chart-tooltip');
  var nationalTotals = data.filter(function (d) {return d.source==='national' && d.breakdown==='total' && d.population==='All persons';}).sort(function(a,b){return a.year-b.year;});
  var nationalByYear = {};
  nationalTotals.forEach(function(d){nationalByYear[d.year]=d;});
  var compact = function(n){if(n>=1000000)return d3.format('.1f')(n/1000000)+'m';if(n>=1000)return d3.format('.0f')(n/1000)+'k';return N(n);};
  var formatted = function(n){return n==null||!isFinite(n)?'N/A':N(Math.round(n));};
  var decimals = function(n){return n==null||!isFinite(n)?'N/A':F(n);};
  var ratio = function(r){return r && r.hosp>0 && r.days!=null ? r.days/r.hosp:null;};
  var filterRows = function(source,breakdown,year){return data.filter(function(d){return d.source===source && d.breakdown===breakdown && d.year===year && d.population==='All persons';});};
  var verified = function(d){return d.hosp!==null && d.days!==null;};
  var escapeHTML = function(str){return String(str).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};

  function showTip(html){tooltip.html(html).style('opacity',1);moveTip();}
  function moveTip(){var e=d3.event;if(!e)return;var box=tooltip.node().getBoundingClientRect(),x=Math.min(e.clientX+15,window.innerWidth-box.width-12),y=Math.min(e.clientY+15,window.innerHeight-box.height-12);tooltip.style('left',Math.max(10,x)+'px').style('top',Math.max(10,y)+'px');}
  function hideTip(){tooltip.style('opacity',0);}
  function bindTip(selection,makeHTML){selection.on('mouseover',function(d){showTip(makeHTML(d));}).on('mousemove',moveTip).on('mouseout',hideTip);}
  function tip(title,value,detail){return '<div class="tip-header">'+escapeHTML(title)+'</div><div class="tip-value">'+escapeHTML(value)+'</div><div class="tip-detail">'+escapeHTML(detail||'')+'</div>';}
  function setText(id,val){var el=document.getElementById(id);if(el)el.textContent=val;}
  function setHTML(id,val){var el=document.getElementById(id);if(el)el.innerHTML=val;}
  function change(curr,prev){if(!prev)return 'No previous-year comparison';var pct=(curr-prev)/prev*100;return '<span class="'+(pct>=0?'delta-up':'delta-down')+'">'+(pct>=0?'↑ +':'↓ −')+Math.abs(pct).toFixed(1)+'%</span> vs '+(state.year-1);}
  function svgCanvas(selector,height,margin){var el=document.querySelector(selector);d3.select(selector).selectAll('*').remove();var width=Math.max(260,el.getBoundingClientRect().width||450);var svg=d3.select(selector).append('svg').attr('width',width).attr('height',height).attr('viewBox','0 0 '+width+' '+height).attr('aria-hidden','true');var plot=svg.append('g').attr('transform','translate('+margin.left+','+margin.top+')');return {svg:svg,g:plot,width:width,height:height,W:Math.max(10,width-margin.left-margin.right),H:height-margin.top-margin.bottom};}
  function yGrid(g,y,W,ticks){g.append('g').attr('class','grid-lines').call(d3.svg.axis().scale(y).orient('left').ticks(ticks||4).tickSize(-W,0,0).tickFormat(''));}
  function xGrid(g,x,H,ticks){g.append('g').attr('class','grid-lines').attr('transform','translate(0,'+H+')').call(d3.svg.axis().scale(x).orient('bottom').ticks(ticks||4).tickSize(-H,0,0).tickFormat(''));}
  function axisStyles(svg){svg.selectAll('.axis .domain').style('stroke','#d7e0ea');}

  // D3 line chart with shaded area and a year-focus marker.
  function lineChart(selector,rows,opt){
    var height=opt.height||235, margin={top:22,right:22,bottom:34,left:opt.left||53};var b=svgCanvas(selector,height,margin),g=b.g,W=b.W,H=b.H;
    var values=rows.map(function(d){return opt.value(d);}).filter(function(v){return v!=null&&isFinite(v);});if(!values.length)return;
    var minimum=(opt.min!=null?opt.min:0),maximum=(opt.max!=null?opt.max:d3.max(values)*1.12);
    var x=d3.scale.linear().domain([2011,2021]).range([0,W]);var y=d3.scale.linear().domain([minimum,maximum]).range([H,0]);
    var ticks=[2011,2013,2015,2017,2019,2021];
    yGrid(g,y,W,4);
    g.append('g').attr('class','axis').call(d3.svg.axis().scale(y).orient('left').ticks(4).tickFormat(opt.tickFormat||compact));
    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.svg.axis().scale(x).orient('bottom').tickValues(ticks).tickFormat(d3.format('d')));
    var line=d3.svg.line().interpolate('monotone').defined(function(d){return opt.value(d)!=null;}).x(function(d){return x(d.year);}).y(function(d){return y(opt.value(d));});
    var area=d3.svg.area().interpolate('monotone').defined(function(d){return opt.value(d)!=null;}).x(function(d){return x(d.year);}).y0(H).y1(function(d){return y(opt.value(d));});
    var gradId='gradient-'+selector.replace(/[^a-z0-9]/gi,'');var defs=b.svg.append('defs'),gradient=defs.append('linearGradient').attr('id',gradId).attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1');gradient.append('stop').attr('offset','0%').attr('stop-color',opt.color).attr('stop-opacity',.18);gradient.append('stop').attr('offset','100%').attr('stop-color',opt.color).attr('stop-opacity',.01);
    g.append('path').datum(rows).attr('d',area).style('fill','url(#'+gradId+')');
    g.append('path').datum(rows).attr('d',line).style('fill','none').style('stroke',opt.color).style('stroke-width',2.8).style('stroke-linejoin','round');
    var selected=rows.filter(function(d){return d.year===state.year;})[0];
    if(selected&&opt.value(selected)!=null){var px=x(selected.year),py=y(opt.value(selected));g.append('line').attr('class','focus-line').attr('x1',px).attr('x2',px).attr('y1',py).attr('y2',H);g.append('circle').attr('cx',px).attr('cy',py).attr('r',7).attr('fill','white').attr('stroke',opt.color).attr('stroke-width',3);g.append('text').attr('class','chart-selected-text').attr('x',Math.max(36,Math.min(W-27,px))).attr('y',Math.max(10,py-15)).attr('text-anchor','middle').text(opt.markFormat?opt.markFormat(opt.value(selected)):formatted(opt.value(selected)));}
    var circles=g.selectAll('.line-hit').data(rows.filter(function(d){return opt.value(d)!=null;})).enter().append('circle').attr('class','line-hit').attr('cx',function(d){return x(d.year);}).attr('cy',function(d){return y(opt.value(d));}).attr('r',9).style('fill','transparent').style('cursor','crosshair');
    bindTip(circles,function(d){return tip(String(d.year),opt.tipFormat?opt.tipFormat(opt.value(d)):formatted(opt.value(d)),opt.tooltipLabel);});axisStyles(b.svg);
  }

  // D3 column chart: years or categories.
  function columnChart(selector,rows,opt){
    var height=opt.height||235,margin={top:22,right:10,bottom:opt.bottom||34,left:opt.left||55},b=svgCanvas(selector,height,margin),g=b.g,W=b.W,H=b.H;
    var x=d3.scale.ordinal().domain(rows.map(function(d){return String(opt.key(d));})).rangeRoundBands([0,W],.24);
    var max=d3.max(rows,function(d){return opt.value(d)||0;})||1,y=d3.scale.linear().domain([0,max*1.12]).range([H,0]);
    yGrid(g,y,W,4);
    g.append('g').attr('class','axis').call(d3.svg.axis().scale(y).orient('left').ticks(4).tickFormat(compact));
    var a=g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.svg.axis().scale(x).orient('bottom').tickSize(0).tickPadding(12).tickFormat(function(d){return opt.compactYears && b.width<480 && (+d%2===0)?'':d;}));
    if(opt.rotateLabels){a.selectAll('text').attr('transform','rotate(-35)').style('text-anchor','end');}
    var bars=g.selectAll('rect.data-bar').data(rows).enter().append('rect').attr('class','data-bar').attr('x',function(d){return x(String(opt.key(d)));}).attr('width',x.rangeBand()).attr('y',function(d){return y(opt.value(d)||0);}).attr('height',function(d){return H-y(opt.value(d)||0);}).attr('rx',3).attr('fill',function(d){return opt.selectedKey&&String(opt.key(d))===String(opt.selectedKey)?opt.selectedColor||'#ed9950':opt.color;}).style('opacity',function(d){return opt.selectedKey&&String(opt.key(d))!==String(opt.selectedKey)?.62:.93;}).style('cursor','crosshair');
    bindTip(bars,function(d){return tip(String(opt.key(d)),formatted(opt.value(d)),opt.tooltipLabel||'');});
    axisStyles(b.svg);
  }

  // D3 ranked horizontal bars. Supports keyboard and clickable road-user charts.
  function horizontalBars(selector,rows,opt){
    var el=document.querySelector(selector),h=opt.height||el.clientHeight||280;
    var margin={top:opt.top||12,right:opt.right||55,bottom:26,left:opt.left||145};
    var b=svgCanvas(selector,h,margin),g=b.g,W=b.W,H=b.H;
    if(!rows.length){d3.select(selector).html('<div class="chart-empty">No verified data for this view</div>');return;}
    var x=d3.scale.linear().domain([0,(d3.max(rows,function(d){return opt.value(d)||0;})||1)*1.12]).range([0,W]);
    var y=d3.scale.ordinal().domain(rows.map(function(d){return opt.key(d);})).rangeRoundBands([0,H],.24);
    xGrid(g,x,H,4);
    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.svg.axis().scale(x).orient('bottom').ticks(4).tickFormat(opt.axisFormat||compact));
    g.selectAll('.bar-label').data(rows).enter().append('text').attr('class','chart-label').attr('x',-10).attr('y',function(d){return y(opt.key(d))+y.rangeBand()/2+3.5;}).attr('text-anchor','end').text(function(d){var s=opt.key(d);return s.length>(opt.truncate||25)?s.slice(0,(opt.truncate||25)-1)+'…':s;});
    var bars=g.selectAll('.value-bar').data(rows).enter().append('rect').attr('class','value-bar').attr('x',0).attr('y',function(d){return y(opt.key(d));}).attr('width',function(d){return x(opt.value(d)||0);}).attr('height',y.rangeBand()).attr('rx',4).style('fill',function(d,i){return opt.dynamicColor?opt.dynamicColor(d,i):opt.color;}).style('cursor',opt.onClick?'pointer':'crosshair');
    g.selectAll('.value-label').data(rows).enter().append('text').attr('class','chart-label-strong').attr('x',function(d){return x(opt.value(d)||0)+7;}).attr('y',function(d){return y(opt.key(d))+y.rangeBand()/2+3.5;}).text(function(d){return opt.valueFormat?opt.valueFormat(opt.value(d)):formatted(opt.value(d));});
    bindTip(bars,function(d){return tip(opt.key(d),opt.valueFormat?opt.valueFormat(opt.value(d)):formatted(opt.value(d)),opt.tipDetail?opt.tipDetail(d):opt.tooltipLabel||'');});
    if(opt.onClick){bars.on('click',function(d){opt.onClick(d);});}
    axisStyles(b.svg);
  }

  function donutChart(selector,rows){
    var el=document.querySelector(selector),w=Math.max(265,el.getBoundingClientRect().width||320),h=310;d3.select(selector).selectAll('*').remove();
    var svg=d3.select(selector).append('svg').attr('width',w).attr('height',h).attr('viewBox','0 0 '+w+' '+h),cx=w/2,cy=h/2-4,r=Math.min(w,h)*.33;
    var colors=['#4778de','#f0a265','#a5b5c8'];var sorted=rows.slice().sort(function(a,b){return b.hosp-a.hosp;});
    var arc=d3.svg.arc().outerRadius(r).innerRadius(r*.7),pie=d3.layout.pie().value(function(d){return d.hosp;}).sort(null),total=d3.sum(sorted,function(d){return d.hosp;});
    var wedges=svg.append('g').attr('transform','translate('+cx+','+cy+')').selectAll('path').data(pie(sorted)).enter().append('path').attr('d',arc).attr('fill',function(d,i){return colors[i%colors.length];}).style('stroke','#fff').style('stroke-width',2).style('cursor','crosshair');
    bindTip(wedges,function(d){return tip(d.data.category,formatted(d.data.hosp),(d.data.hosp/total*100).toFixed(1)+'% of national sex breakdown');});
    var male=sorted.filter(function(d){return d.category==='Male';})[0],share=male?male.hosp/total*100:0;
    svg.append('text').attr('x',cx).attr('y',cy-2).attr('text-anchor','middle').attr('fill',C.ink).attr('font-size','28px').attr('font-weight','850').text(share.toFixed(1)+'%');
    svg.append('text').attr('x',cx).attr('y',cy+19).attr('text-anchor','middle').attr('fill',C.muted).attr('font-size','11px').text('Male share');
    var legend=document.getElementById('sex-legend');legend.innerHTML=sorted.map(function(d,i){return '<div class="legend-row"><span class="label"><span class="donut-color" style="background:'+colors[i%colors.length]+'"></span>'+escapeHTML(d.category==='intersex or indeterminate or missing'?'Other / missing':d.category)+'</span><strong>'+formatted(d.hosp)+' <span style="font-weight:500;color:#91a1b4">('+ (d.hosp/total*100).toFixed(1)+'%)</span></strong></div>';}).join('');
  }

  function scatterChart(selector,rows){
    var margin={top:22,right:18,bottom:49,left:70},b=svgCanvas(selector,340,margin),g=b.g,W=b.W,H=b.H;
    var x=d3.scale.linear().domain([0,d3.max(rows,function(d){return d.hosp;})*1.12]).range([0,W]);
    var y=d3.scale.linear().domain([0,d3.max(rows,function(d){return d.days;})*1.13]).range([H,0]);
    yGrid(g,y,W,4);xGrid(g,x,H,5);
    g.append('g').attr('class','axis').call(d3.svg.axis().scale(y).orient('left').ticks(4).tickFormat(compact));
    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.svg.axis().scale(x).orient('bottom').ticks(5).tickFormat(compact));
    g.append('text').attr('x',W/2).attr('y',H+40).attr('fill',C.muted).attr('font-size','10px').attr('text-anchor','middle').text('Number of hospitalisations');
    g.append('text').attr('transform','rotate(-90)').attr('x',-H/2).attr('y',-54).attr('fill',C.muted).attr('font-size','10px').attr('text-anchor','middle').text('Hospital bed-days');
    var bubbles=g.selectAll('.bubble').data(rows).enter().append('circle').attr('class','bubble').attr('cx',function(d){return x(d.hosp);}).attr('cy',function(d){return y(d.days);}).attr('r',function(d){return d.category===state.roadUser?10:7;}).attr('fill',function(d){return d.category===state.roadUser?C.orange:C.blue;}).attr('fill-opacity',function(d){return d.category===state.roadUser?.94:.63;}).attr('stroke',function(d){return d.category===state.roadUser?'#d77d37':'white';}).attr('stroke-width',function(d){return d.category===state.roadUser?2:1.5;}).style('cursor','pointer').attr('tabindex',0).attr('aria-label',function(d){return d.category+': '+formatted(d.hosp)+' hospitalisations, '+formatted(d.days)+' bed-days';});
    bindTip(bubbles,function(d){return tip(d.category,formatted(d.hosp)+' cases',formatted(d.days)+' bed-days · '+decimals(ratio(d))+' days/case');});
    bubbles.on('click',function(d){state.roadUser=d.category;document.getElementById('road-user-select').value=d.category;updateRoadUserDetail();scatterChart(selector,rows);});
    bubbles.on('keydown',function(d){if(d3.event.keyCode===13||d3.event.keyCode===32){d3.event.preventDefault();state.roadUser=d.category;document.getElementById('road-user-select').value=d.category;updateRoadUserDetail();scatterChart(selector,rows);}});
    var chosen=rows.filter(function(d){return d.category===state.roadUser;})[0];
    if(chosen){var bx=x(chosen.hosp),by=y(chosen.days);g.append('text').attr('x',Math.max(35,Math.min(W-35,bx))).attr('y',Math.max(12,by-17)).attr('text-anchor','middle').attr('class','chart-selected-text').text(chosen.category.length>19?chosen.category.slice(0,18)+'…':chosen.category);}
  }

  function updateKpis(){
    var d=nationalByYear[state.year],prior=nationalByYear[state.year-1];
    setText('overview-hosp',formatted(d.hosp));setHTML('overview-hosp-change',change(d.hosp,prior&&prior.hosp));
    setText('overview-days',formatted(d.days));setHTML('overview-days-change',change(d.days,prior&&prior.days));
    setText('overview-ratio',decimals(ratio(d)));setHTML('overview-ratio-change',change(ratio(d),prior&&ratio(prior)));
    setText('burden-days',formatted(d.days));setText('burden-average',decimals(ratio(d)));
    var best=filterRows('national','road_user',state.year).filter(verified).sort(function(a,b){return ratio(b)-ratio(a);})[0];
    setText('burden-peak',best?decimals(ratio(best)):'N/A');setText('burden-peak-label',best?best.category+' · bed-days / case':'No data available');
    var base=nationalByYear[2011],changeTotal=(d.hosp-base.hosp)/base.hosp*100;
    setText('overview-insight-title',state.year===2011?'The baseline year':(changeTotal>=0?'Higher than the 2011 baseline':'Below the 2011 baseline'));
    setText('overview-insight-body',state.year===2011?'In 2011, Australia recorded '+formatted(d.hosp)+' road injury hospitalisations and '+formatted(d.days)+' hospital bed-days. Select a later year to compare changes.':'In '+state.year+', Australia recorded '+formatted(d.hosp)+' hospitalisations — '+Math.abs(changeTotal).toFixed(1)+'% '+(changeTotal>=0?'above':'below')+' the 2011 total. The data describes hospital care, not all crashes or injury risk.');
    var stateRows=filterRows('state_territory','total',state.year).filter(verified).sort(function(a,b){return b.hosp-a.hosp;});
    var first=stateRows[0],second=stateRows[1];
    setText('people-headline',first?first.geography+' recorded the most hospitalisations in '+state.year+'.':'Explore geographic differences.');
    setText('people-summary',first&&second?'The leading locations were '+first.geography+' ('+formatted(first.hosp)+') and '+second.geography+' ('+formatted(second.hosp)+'). Compare counts cautiously: population sizes vary by state.':'Select a year to explore different state and demographic patterns.');
    var users=filterRows('national','road_user',state.year).filter(verified),ped=users.filter(function(x){return x.category==='Pedestrian';})[0],car=users.filter(function(x){return x.category==='Car driver';})[0];
    if(ped&&car){setText('burden-insight-title','Hospitalisation volume is not the whole story');setText('burden-insight-body','In '+state.year+', pedestrians averaged '+decimals(ratio(ped))+' bed-days per case, compared with '+decimals(ratio(car))+' for car drivers. Longer stays indicate more hospital resource use, not a definitive clinical severity rating.');}
  }

  function updateRoadUserDetail(){
    var users=filterRows('national','road_user',state.year).filter(verified),selected=users.filter(function(d){return d.category===state.roadUser;})[0]||users[0];if(!selected)return;
    state.roadUser=selected.category;document.getElementById('road-user-select').value=state.roadUser;
    setText('detail-name',selected.category);setText('detail-average',decimals(ratio(selected)));setText('detail-cases',formatted(selected.hosp));setText('detail-days',formatted(selected.days));setText('detail-national',decimals(ratio(nationalByYear[state.year]))+' days');
  }

  function drawOverview(){
    lineChart('#chart-national-trend',nationalTotals,{color:C.blue,value:function(d){return d.hosp;},tooltipLabel:'National hospitalisations'});
    columnChart('#chart-bed-days',nationalTotals,{color:C.orange,key:function(d){return d.year;},value:function(d){return d.days;},selectedKey:state.year,selectedColor:'#cc7441',tooltipLabel:'Total hospital bed-days',left:54,compactYears:true});
  }
  function drawPeople(){
    var year=state.year;
    var states=filterRows('state_territory','total',year).filter(verified).sort(function(a,b){return b.hosp-a.hosp;});
    horizontalBars('#chart-states',states,{height:310,key:function(d){return d.geography;},value:function(d){return d.hosp;},color:C.blue,left:57,right:62,tipDetail:function(d){return d.geography+' · '+year+' · state total';}});
    var sex=filterRows('national','sex',year).filter(verified);donutChart('#chart-sex',sex);
    var order=['0-7','8-16','17-25','26-39','40-64','65-74','75+','Missing'];
    var ages=filterRows('national','age_group',year).filter(verified).sort(function(a,b){return order.indexOf(a.category)-order.indexOf(b.category);});
    columnChart('#chart-age',ages,{height:275,color:C.teal,key:function(d){return d.category;},value:function(d){return d.hosp;},left:44,bottom:40,tooltipLabel:'Hospitalisations in age group'});
    var users=filterRows('national','road_user',year).filter(verified).sort(function(a,b){return b.hosp-a.hosp;}).slice(0,6);
    horizontalBars('#chart-road-users',users,{height:275,color:C.orange,left:152,right:58,key:function(d){return d.category;},value:function(d){return d.hosp;},truncate:24,tipDetail:function(d){return d.category+' · '+year;}});
  }
  function drawBurden(){
    lineChart('#chart-ratio-trend',nationalTotals,{color:C.teal,value:ratio,min:3.5,max:6.15,left:42,tickFormat:function(n){return n.toFixed(1);},markFormat:decimals,tipFormat:decimals,tooltipLabel:'Bed-days per hospitalisation'});
    var users=filterRows('national','road_user',state.year).filter(verified).filter(function(d){return d.hosp>0;});
    var sorted=users.slice().sort(function(a,b){return ratio(b)-ratio(a);}).slice(0,8);
    horizontalBars('#chart-ratio-groups',sorted,{height:235,key:function(d){return d.category;},value:ratio,valueFormat:decimals,axisFormat:function(n){return n.toFixed(0);},color:C.orange,left:166,right:45,truncate:29,tipDetail:function(d){return formatted(d.hosp)+' cases · '+formatted(d.days)+' bed-days';},onClick:function(d){state.roadUser=d.category;document.getElementById('road-user-select').value=d.category;updateRoadUserDetail();scatterChart('#chart-scatter',users);}});
    updateRoadUserDetail();scatterChart('#chart-scatter',users);
  }
  function render(){updateKpis();if(state.page==='overview')drawOverview();if(state.page==='people')drawPeople();if(state.page==='burden')drawBurden();}

  function setPage(page){
    if(['overview','people','burden'].indexOf(page)<0)page='overview';state.page=page;
    document.querySelectorAll('.page').forEach(function(el){el.classList.toggle('active',el.id==='page-'+page);});
    document.querySelectorAll('.nav-item').forEach(function(el){el.classList.toggle('active',el.dataset.page===page);});
    setText('breadcrumb-page',{overview:'National overview',people:'People & places',burden:'Hospital burden'}[page]);
    if(window.history&&window.history.replaceState){window.history.replaceState(null,'','#'+page);}else window.location.hash=page;
    document.querySelector('.sidebar').classList.remove('mobile-open');window.scrollTo(0,0);requestAnimationFrame(render);
  }
  function setYear(year){state.year=Math.min(2021,Math.max(2011,+year));document.getElementById('year-select').value=state.year;document.getElementById('year-prev').disabled=state.year<=2011;document.getElementById('year-next').disabled=state.year>=2021;document.querySelectorAll('.selected-year-text').forEach(function(el){el.textContent=state.year;});render();}
  function exportYear(){
    var columns=['year','geography','category','hospitalisations_verified','bed_days_verified','hospitalisations_suppressed','breakdown','source_dataset','population'];
    var subset=data.filter(function(d){return d.year===state.year;});
    var quote=function(v){if(v==null)return '';var s=String(v);return /[,"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    var csv=[columns.join(',')].concat(subset.map(function(d){return [d.year,d.geography,d.category,d.hosp,d.days,d.suppressed,d.breakdown,d.source,d.population].map(quote).join(',');})).join('\n');
    var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='road_injuries_verified_'+state.year+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }

  years.forEach(function(y){var opt=document.createElement('option');opt.value=y;opt.textContent=y;document.getElementById('year-select').appendChild(opt);});
  var categories=filterRows('national','road_user',2021).map(function(d){return d.category;}).sort();categories.forEach(function(c){var opt=document.createElement('option');opt.value=c;opt.textContent=c;document.getElementById('road-user-select').appendChild(opt);});
  document.getElementById('year-select').addEventListener('change',function(){setYear(this.value);});
  document.getElementById('year-prev').addEventListener('click',function(){setYear(state.year-1);});
  document.getElementById('year-next').addEventListener('click',function(){setYear(state.year+1);});
  document.getElementById('download-btn').addEventListener('click',exportYear);
  document.querySelectorAll('[data-page]').forEach(function(btn){btn.addEventListener('click',function(){setPage(btn.dataset.page);});});
  document.querySelectorAll('[data-go]').forEach(function(btn){btn.addEventListener('click',function(){setPage(btn.dataset.go);});});
  document.getElementById('road-user-select').addEventListener('change',function(){state.roadUser=this.value;updateRoadUserDetail();scatterChart('#chart-scatter',filterRows('national','road_user',state.year).filter(verified));});
  document.getElementById('menu-toggle').addEventListener('click',function(){document.querySelector('.sidebar').classList.toggle('mobile-open');});
  document.getElementById('brand-link').addEventListener('click',function(e){e.preventDefault();setPage('overview');});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelector('.sidebar').classList.remove('mobile-open');});
  window.addEventListener('hashchange',function(){var p=location.hash.replace('#','');if(p!==state.page&&['overview','people','burden'].indexOf(p)>=0)setPage(p);});
  var resizeTimer;window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(render,120);});
  state.page=(['overview','people','burden'].indexOf(location.hash.substring(1))>=0?location.hash.substring(1):'overview');
  setYear(2021);setPage(state.page);
})();

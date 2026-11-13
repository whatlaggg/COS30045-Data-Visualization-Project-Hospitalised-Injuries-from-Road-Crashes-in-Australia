"use strict";
function render() {
    updateKpis();
    if (state.page === 'overview') {
        drawNationalTrend(); drawBedDays(); drawYearChange();
    } else if (state.page === 'people') {
        drawStateHeatmap(); drawSexTrend(); drawAgeGroups(); drawRoadUsers();
    } else if (state.page === 'burden') {
        drawRatioTrend(); updateRoadUserDetail(); drawRatioGroups(); drawScatterplot();
    }
}

"use strict";

function render() {
    updateKpis();
    if (state.page === 'overview') {
        drawNationalTrend();
        drawBedDays();
    }
    if (state.page === 'people') {
        drawStateComparison();
        drawSexDonut();
        drawAgeGroups();
        drawRoadUsers();
    }
    if (state.page === 'burden') {
        drawRatioTrend();
        updateRoadUserDetail();
        drawRatioGroups();
        drawScatterplot();
    }
}

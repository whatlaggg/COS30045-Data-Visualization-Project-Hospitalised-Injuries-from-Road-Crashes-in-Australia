"use strict";
// Shared palette and application state; chart scales stay inside each chart.
const C = {
    blue: '#2196f3',
    blue2: '#90caf9',
    teal: '#2196f3',
    orange: '#0d47a1',
    ink: '#0d47a1',
    muted: '#416b91',
    grid: '#e3f2fd'
};
const N = d3.format(',d'),
    F = d3.format(',.2f');
const years = d3.range(2011, 2022);
const state = {
    year: 2021,
    page: 'overview',
    roadUser: 'Pedestrian'
};
let data = [];
let nationalTotals = [];
let nationalByYear = {};
const tooltip = d3.select('#chart-tooltip');

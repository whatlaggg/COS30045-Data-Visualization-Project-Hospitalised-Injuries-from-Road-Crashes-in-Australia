"use strict";
// Shared palette and application state; chart scales stay inside each chart.
const C = {
    blue: '#4778de',
    blue2: '#6a9bfa',
    teal: '#16a18c',
    orange: '#ed9950',
    ink: '#213957',
    muted: '#7c8da4',
    grid: '#e9eef5'
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

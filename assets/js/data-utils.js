"use strict";
// Filters select one source and breakdown, preventing double-counting.
var compact = function(n) {
    if (n >= 1000000) return d3.format('.1f')(n / 1000000) + 'm';
    if (n >= 1000) return d3.format('.0f')(n / 1000) + 'k';
    return N(n);
};
var formatted = function(n) {
    return n == null || !isFinite(n) ? 'N/A' : N(Math.round(n));
};
var decimals = function(n) {
    return n == null || !isFinite(n) ? 'N/A' : F(n);
};
var ratio = function(r) {
    return r && r.hosp > 0 && r.days != null && !r.suppressed && !r.daysSuppressed ? r.days / r.hosp : null;
};
var filterRows = function(source, breakdown, year) {
    return data.filter(function(d) {
        return d.source === source && d.breakdown === breakdown && d.year === year && d.population === 'All persons';
    });
};
var verified = function(d) {
    return d.hosp !== null && d.days !== null && !d.suppressed && !d.daysSuppressed;
};
var escapeHTML = function(str) {
    return String(str)
        .replace(/[&<>"']/g, function(c) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            } [c];
        });
};

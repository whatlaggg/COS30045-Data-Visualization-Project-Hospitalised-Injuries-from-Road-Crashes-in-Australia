"use strict";
// Accessibility: every data mark exposes its value on focus as well as hover.
function tip(title, value, detail) {
    return '<div class="tip-header">' + escapeHTML(title) + '</div><div class="tip-value">' + escapeHTML(value) + '</div><div class="tip-detail">' + escapeHTML(detail || '') + '</div>';
}
// Position the tooltip beside the pointer or focused mark within the window.
function moveTip(event) {
    const box = tooltip.node()
        .getBoundingClientRect();
    const target = event.currentTarget.getBoundingClientRect();
    const px = Number.isFinite(event.clientX) ? event.clientX : target.left + target.width / 2;
    const py = Number.isFinite(event.clientY) ? event.clientY : target.top + target.height / 2;
    tooltip.style('left', Math.max(10, Math.min(px + 15, window.innerWidth - box.width - 12)) + 'px')
        .style('top', Math.max(10, Math.min(py + 15, window.innerHeight - box.height - 12)) + 'px');
}
function hideTip() {
    tooltip.style('opacity', 0);
}
// Attach pointer and keyboard tooltip events to the chart marks.
function bindTip(selection, makeHTML) {
    selection.attr('tabindex', 0)
        .attr('aria-label', d => makeHTML(d)
            .replace(/<[^>]*>/g, ' '))
        .on('pointerenter.tooltip focus.tooltip', function(event, d) {
            tooltip.html(makeHTML(d))
                .style('opacity', 1);
            moveTip(event);
        })
        .on('pointermove.tooltip', moveTip)
        .on('pointerleave.tooltip blur.tooltip', hideTip)
        .on('keydown.tooltip', function(event) {
            if (event.key === 'Escape') hideTip();
        });
}

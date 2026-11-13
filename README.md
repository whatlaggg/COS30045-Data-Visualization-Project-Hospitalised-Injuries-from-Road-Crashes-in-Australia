# Australian road injury dashboard

Open `index.html` in Chrome or Edge. All scripts and data are bundled locally; no web server or internet connection is needed. The ZIP contains a multi-file D3 v7 project.

Use the three page buttons and year selector to explore 2011–2021. The overview heatmap and state heatmap allow clicking a year; the hospital burden plots link to the road-user detail card. Hover or focus on marks for exact values.

**Data interpretation:** Hospitalisations and bed-days are published counts, not road-crash totals or population-adjusted rates. The age bands have unequal widths. Sex shares are calculated within each state from published male and female counts only. Suppressed values are excluded from chart calculations. Longer stays measure hospital resource use and are not a direct clinical severity score.

`data/dashboard_injuries.csv` is the source dataset. `data/dashboard-data.js` embeds the same CSV for direct file opening. After editing the CSV, regenerate that file from its contents. The code remains split into chart-specific files under `assets/js`.

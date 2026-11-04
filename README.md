# RoadLens — Australian Road Injury Dashboard

A three-page **interactive D3.js website**, using the supplied KNIME export `dashboard_injuries_ready.csv` (2,793 rows, 2011–2021).

## Run

1. Extract the ZIP archive.
2. Open `index.html` in a desktop browser (Chrome, Edge or Firefox).
3. Select a year in the top-right menu. Use the sidebar to explore three pages. Hover over charts for exact values, and click a road-user circle on Page 3 to inspect the group.
4. Use **Export year CSV** for a downloadable subset of the cleaned data.

**No server or internet connection is needed.** D3.js 3.5.6 is included under `vendor/`, and the processed records are included in `assets/data.js`. The complete source CSV is also available at `assets/dashboard_injuries_ready.csv`.

## Dashboard story

- **01 / National overview** — national hospitalisations and total bed-days, with KPI comparisons and historical charts.
- **02 / People & places** — geographic, age, sex and road-user breakdowns; each uses its own dedicated dataset slice.
- **03 / Hospital burden** — national days-per-case trend, road-user differences, and an interactive bed-days vs hospitalisations scatter plot.

## Source-field mapping and safeguards

Charts use verified numeric measures (`hospitalisations_verified` and `bed_days_verified`) derived from KNIME. Suppressed values are `null`, not zero. The original numeric source columns are retained in the included full CSV for traceability.

- National headline metrics: `source_dataset = national`, `breakdown = total`, `population = All persons`, `category = All`.
- Geographic chart: `source_dataset = state_territory`, `breakdown = total`.
- Demographics: `source_dataset = national`, one `breakdown` at a time (`sex`, `age_group`, `road_user`).
- Road-user burden: `source_dataset = national`, `breakdown = road_user`.
- Multi-year average days per case is calculated as sum of bed-days divided by sum of hospitalisations; per-year totals use that year's numerator/denominator.

**Important:** The chart groups overlap. Do not add values across different breakdowns or sum state figures and national figures together. The dataset describes *hospitalisations due to road injuries*, not all crashes. Absolute counts do not imply risk without an exposure or population denominator. Hospital bed-days per case indicate resource use, not a validated clinical severity score.

## Technology and rights

Charting is provided by **D3.js 3.5.6** (Mike Bostock et al.), an open-source BSD-licensed JavaScript visualization library. Other website code and data processing are included in this download. No third-party web fonts, frameworks or API endpoints are required.

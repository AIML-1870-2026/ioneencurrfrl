# Weather Dashboard — Specification

## Overview

A single-file static webpage (`weather-dashboard.html`) that displays real-time weather data for any city using the OpenWeatherMap API. All logic runs client-side in the browser via the Fetch API. No server or build process required.

---

## API Integration

**Provider:** [OpenWeatherMap](https://openweathermap.org)  
**Authentication:** API key passed as a query parameter (`appid=`) in each request URL.  
**Key location in code:** `const API_KEY = '...'` at the top of the `<script>` block.

### Endpoints Used

| Feature | Endpoint | Notes |
|---|---|---|
| Current weather | `GET /data/2.5/weather` | Queried by city name |
| 5-day forecast | `GET /data/2.5/forecast` | Returns 3-hour intervals; one entry per day is used |
| Air quality | `GET /data/2.5/air_pollution` | Queried by lat/lon from current weather response |

All three requests use the `units` query parameter (`imperial` or `metric`) to control temperature and wind speed units. The current weather and forecast requests fire in parallel via `Promise.all()`; the air quality request fires after, using coordinates returned by the current weather response.

---

## Features

### Main Task

**City search**
- Text input accepts any city name (e.g. Omaha, Paris, Tokyo).
- Triggered by clicking the Search button or pressing Enter.
- Displays an inline error message if the city is not found or the API returns an error.

**Current conditions card**
- Weather icon (emoji mapped from OpenWeatherMap icon codes)
- City name and country code badge
- Temperature (large display) and feels-like temperature
- Weather description (e.g. "light rain", "clear sky")

**Metrics grid**
- Humidity (%)
- Wind speed (mph or m/s depending on selected unit)
- Atmospheric pressure (hPa)
- Visibility (km, converted from meters)
- Cloud cover (%)

**Temperature unit toggle**
- Two buttons: °F (imperial) and °C (metric)
- Switching units re-fetches all data for the current city immediately
- Active unit button is highlighted in accent blue

### Stretch Challenge — Enhancements

**5-day forecast**
- Uses the `/forecast` endpoint which returns data in 3-hour intervals
- The first entry for each calendar date is selected as the representative forecast
- Displays up to 5 days as horizontally scrollable cards, each showing: date, weather icon, temperature, and description

**Air Quality Index (AQI)**
- Uses the `/air_pollution` endpoint with lat/lon from the current weather response
- Displays the AQI value (1–5) and label: Good, Fair, Moderate, Poor, Very Poor
- Renders a gradient bar (green → blue → amber → red → dark red) with a dot indicator showing the current AQI position
- AQI label text color matches the corresponding position on the gradient

**Sunrise & Sunset**
- Derived from `sys.sunrise`, `sys.sunset`, and `timezone` fields in the current weather response
- Times are calculated in the city's local timezone by adding the UTC offset to the Unix timestamps
- Displayed as two side-by-side cards

---

## UI & Design

**Theme:** Dark, deep navy background (`#0b0e17`) with layered surface cards.  
**Fonts:** Syne (headings, body) and Space Mono (monospace labels, values) — loaded from Google Fonts.  
**Color palette:**

| Variable | Value | Used for |
|---|---|---|
| `--bg` | `#0b0e17` | Page background |
| `--surface` | `#13182a` | Cards |
| `--surface2` | `#1b2240` | Inactive toggle buttons |
| `--accent` | `#4e8cff` | Temperature, active elements |
| `--accent2` | `#7ef5d8` | Metric values, country badge |
| `--muted` | `#7886b0` | Labels, secondary text |
| `--warm` | `#ffc96b` | Sunrise/sunset times |
| `--danger` | `#ff6b6b` | Error messages |

**Responsive:** At viewports ≤ 520px, the main card stacks vertically and the sunrise/sunset row becomes a single column.

**Loading state:** A spinning CSS animation is shown while API requests are in flight. The dashboard panel is hidden until all data has loaded successfully.

---

## JavaScript Structure

| Function | Purpose |
|---|---|
| `fetchWeather()` | Entry point; reads city input, fires API calls, orchestrates rendering |
| `renderCurrent(d)` | Populates the main card and metrics grid from `/weather` response |
| `renderForecast(fc)` | Builds forecast cards from `/forecast` response |
| `renderAQI(aqiData)` | Updates AQI bar and label from `/air_pollution` response |
| `setUnit(unit)` | Switches between `imperial`/`metric`, updates UI, re-fetches if a city is loaded |
| `fmtTime(unix, tz)` | Converts a Unix timestamp + UTC offset to a local HH:MM string |
| `showError(msg)` | Displays an error message and hides the dashboard |
| `setLoading(on)` | Shows or hides the loading spinner |

**Weather icon mapping:** A lookup object maps OpenWeatherMap icon codes (e.g. `01d`, `10n`) to emoji characters for display.

---

## File Structure

```
weather-dashboard.html   ← single self-contained file
```

No external JS files, no build step, no server required. Open directly in any modern browser.

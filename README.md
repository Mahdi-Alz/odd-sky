# Odd Sky

Vue 3 weather app. Search cities, add cards, view current conditions + 7-day forecast, and see how today compares to the last 30 years. Weather data by [Open-Meteo](https://open-meteo.com/), no API key needed.

## Features

- City search with debounced autocomplete
- Swipe between saved cities, one full-screen page each
- Current temp, hourly strip, feels-like, humidity, wind, UV
- 7-day forecast with temperature range bars
- "How unusual is today?" fact badges (placeholder data until the real fact engine lands)
- English and Persian (RTL, Jalali dates), metric or imperial units
- Saved cities persist in the browser and can be moved to another device with a transfer link
- Weather-aware gradients by condition and day or night

## Tech Stack

- Vue 3 (`<script setup>`), Pinia, vue-i18n
- Vite
- Tailwind CSS 4
- vite-plugin-pwa (installable, works offline)

## Setup

```sh
npm install
npm run dev
```

Build for production:

```sh
npm run build
npm run preview
```

## Project Structure

```
apps/web/
  src/
    App.vue                  # root layout
    components/              # presentational components (pager, city page, list, settings)
    composables/             # UI logic and state
    stores/                  # Pinia stores (cities, settings)
    services/                # Open-Meteo network calls
    storage/                 # IndexedDB, cache, transfer link
    i18n/                    # fa and en messages
    assets/css/style.css
packages/core/
  dates/ units/ weather/     # pure helpers
  facts/                     # fact contracts and mock
  types.js                   # shared JSDoc contracts
```

Other scripts, all from the repo root: `npm test`, `npm run lint`, `npm run typecheck`, `npm run format`.

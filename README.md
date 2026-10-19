# Odd Sky

Vue 3 weather app. Search cities, add cards, view current conditions + 3-day forecast. Data from [WeatherAPI](https://www.weatherapi.com/).

## Features

- City search with debounced autocomplete
- Multiple saved place cards
- Current temp, feels-like, humidity, wind, UV
- 3-day forecast per place
- Dark theme UI (Tailwind + daisyUI)

## Tech Stack

- Vue 3 (`<script setup>`)
- Vite
- Tailwind CSS 4 + daisyUI

## Setup

```sh
npm install
cp .env.example .env
```

Set `VITE_WEATHER_API_KEY` in `.env` to your [WeatherAPI](https://www.weatherapi.com/) key, then:

```sh
npm run dev
```

Build for production:

```sh
npm run build
npm run preview
```

## Project Structure

```
src/
  App.vue                    # root layout, place list state
  components/
    SearchInput.vue          # city search + autocomplete
    WeatherCard.vue          # weather display card
  assets/css/style.css
```

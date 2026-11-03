const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

const CURRENT_FIELDS = [
  ["temperature_2m", "Temperature"],
  ["relative_humidity_2m", "Relative humidity"],
  ["apparent_temperature", "Feels like"],
  ["is_day", "Daylight"],
  ["precipitation", "Precipitation"],
  ["rain", "Rain"],
  ["showers", "Showers"],
  ["snowfall", "Snowfall"],
  ["weather_code", "Conditions"],
  ["cloud_cover", "Cloud cover"],
  ["pressure_msl", "Sea-level pressure"],
  ["surface_pressure", "Surface pressure"],
  ["wind_speed_10m", "Wind speed"],
  ["wind_direction_10m", "Wind direction"],
  ["wind_gusts_10m", "Wind gusts"],
];

const HOURLY_FIELDS = [
  ["temperature_2m", "Temperature"],
  ["relative_humidity_2m", "Relative humidity"],
  ["dew_point_2m", "Dew point"],
  ["apparent_temperature", "Feels like"],
  ["precipitation_probability", "Precipitation probability"],
  ["precipitation", "Precipitation"],
  ["rain", "Rain"],
  ["showers", "Showers"],
  ["snowfall", "Snowfall"],
  ["snow_depth", "Snow depth"],
  ["weather_code", "Conditions"],
  ["pressure_msl", "Sea-level pressure"],
  ["surface_pressure", "Surface pressure"],
  ["cloud_cover", "Cloud cover"],
  ["cloud_cover_low", "Low cloud cover"],
  ["cloud_cover_mid", "Mid cloud cover"],
  ["cloud_cover_high", "High cloud cover"],
  ["visibility", "Visibility"],
  ["evapotranspiration", "Evapotranspiration"],
  ["vapour_pressure_deficit", "Vapour pressure deficit"],
  ["wind_speed_10m", "Wind speed"],
  ["wind_direction_10m", "Wind direction"],
  ["wind_gusts_10m", "Wind gusts"],
  ["uv_index", "UV index"],
  ["is_day", "Daylight"],
];

const DAILY_FIELDS = [
  ["weather_code", "Conditions"],
  ["temperature_2m_max", "High"],
  ["temperature_2m_min", "Low"],
  ["apparent_temperature_max", "Feels-like high"],
  ["apparent_temperature_min", "Feels-like low"],
  ["sunrise", "Sunrise"],
  ["sunset", "Sunset"],
  ["daylight_duration", "Daylight duration"],
  ["sunshine_duration", "Sunshine duration"],
  ["uv_index_max", "Maximum UV index"],
  ["precipitation_sum", "Precipitation"],
  ["rain_sum", "Rain"],
  ["showers_sum", "Showers"],
  ["snowfall_sum", "Snowfall"],
  ["precipitation_hours", "Precipitation hours"],
  ["precipitation_probability_max", "Precipitation chance"],
  ["wind_speed_10m_max", "Maximum wind"],
  ["wind_gusts_10m_max", "Maximum gusts"],
  ["wind_direction_10m_dominant", "Dominant wind direction"],
];

const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const currentMetrics = document.getElementById("currentMetrics");
const hourlyTableWrap = document.getElementById("hourlyTableWrap");
const dailyForecast = document.getElementById("dailyForecast");
const weatherStatus = document.getElementById("weatherStatus");
const locationLine = document.getElementById("locationLine");
const updatedAt = document.getElementById("updatedAt");
const apiMetadata = document.getElementById("apiMetadata");
const refreshButton = document.getElementById("refreshWeather");
let requestNumber = 0;

function weatherCodeDescription(code) {
  return WEATHER_CODES[code] || `Weather code ${code}`;
}

function formatApiTime(value, options) {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  return date.toLocaleString([], {
    ...options,
    timeZone: hasTimezone ? undefined : "UTC",
  });
}

function compassDirection(degrees) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return `${directions[Math.round(Number(degrees) / 22.5) % 16]} (${Math.round(degrees)}°)`;
}

function formatValue(key, value, unit) {
  if (value === null || value === undefined) return "—";
  if (key === "sunrise" || key === "sunset") {
    return formatApiTime(value, { hour: "numeric", minute: "2-digit" });
  }
  if (!Number.isFinite(Number(value))) return "—";
  if (key === "weather_code") return weatherCodeDescription(Number(value));
  if (key === "is_day") return Number(value) === 1 ? "Day" : "Night";
  if (key.includes("wind_direction")) return compassDirection(value);
  if (key.includes("duration")) {
    const hours = Number(value) / 3600;
    return `${hours.toFixed(1)} h`;
  }
  const number = Number(value);
  const digits = Math.abs(number) < 10 && !Number.isInteger(number) ? 1 : 0;
  return `${number.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderCurrent(weather) {
  currentMetrics.replaceChildren();
  for (const [key, label] of CURRENT_FIELDS) {
    const card = makeElement("article", "metric-card");
    card.append(
      makeElement("span", "metric-label", label),
      makeElement(
        "span",
        "metric-value",
        formatValue(key, weather.current?.[key], weather.current_units?.[key]),
      ),
    );
    currentMetrics.append(card);
  }
}

function renderHourly(weather) {
  const table = makeElement("table", "weather-table");
  const thead = makeElement("thead");
  const headerRow = makeElement("tr");
  headerRow.append(makeElement("th", "", "Local time"));
  for (const [key, label] of HOURLY_FIELDS) {
    const unit = weather.hourly_units?.[key];
    headerRow.append(
      makeElement("th", "", unit ? `${label} (${unit})` : label),
    );
  }
  thead.append(headerRow);

  const tbody = makeElement("tbody");
  const times = weather.hourly?.time || [];
  const currentHour = weather.current?.time?.slice(0, 13);
  let firstIndex = times.findIndex((time) => time.slice(0, 13) >= currentHour);
  if (firstIndex < 0) firstIndex = 0;
  for (
    let index = firstIndex;
    index < Math.min(firstIndex + 24, times.length);
    index++
  ) {
    const row = makeElement("tr");
    const localTime = formatApiTime(times[index], {
      weekday: "short",
      hour: "numeric",
    });
    row.append(makeElement("td", "", localTime));
    for (const [key] of HOURLY_FIELDS) {
      row.append(
        makeElement(
          "td",
          "",
          formatValue(
            key,
            weather.hourly?.[key]?.[index],
            weather.hourly_units?.[key],
          ),
        ),
      );
    }
    tbody.append(row);
  }
  table.append(thead, tbody);
  hourlyTableWrap.replaceChildren(table);
}

function renderDaily(weather) {
  dailyForecast.replaceChildren();
  const dates = weather.daily?.time || [];
  for (let index = 0; index < dates.length; index++) {
    const card = makeElement("article", "daily-card");
    const date = new Date(`${dates[index]}T12:00:00Z`);
    card.append(
      makeElement(
        "h3",
        "",
        date.toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
      ),
      makeElement(
        "p",
        "daily-summary",
        weatherCodeDescription(weather.daily?.weather_code?.[index]),
      ),
    );
    const metrics = makeElement("div", "daily-metrics");
    for (const [key, label] of DAILY_FIELDS) {
      const item = makeElement("div", "daily-metric");
      item.append(
        makeElement("span", "metric-label", label),
        makeElement(
          "span",
          "metric-value",
          formatValue(
            key,
            weather.daily?.[key]?.[index],
            weather.daily_units?.[key],
          ),
        ),
      );
      metrics.append(item);
    }
    card.append(metrics);
    dailyForecast.append(card);
  }
}

async function getLocation() {
  if (!navigator.geolocation)
    throw new Error("This browser does not support location access.");
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () =>
        reject(
          new Error(
            "Location access is needed to show your local forecast. Allow it in your browser and retry.",
          ),
        ),
      { enableHighAccuracy: false, maximumAge: 15 * 60 * 1000, timeout: 12000 },
    );
  });
}

async function loadWeather() {
  const thisRequest = ++requestNumber;
  refreshButton.disabled = true;
  weatherStatus.classList.remove("error");
  weatherStatus.textContent = "Getting your location and latest forecast…";
  try {
    const { latitude, longitude } = await getLocation();
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: CURRENT_FIELDS.map(([key]) => key).join(","),
      hourly: HOURLY_FIELDS.map(([key]) => key).join(","),
      daily: DAILY_FIELDS.map(([key]) => key).join(","),
      forecast_days: "7",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      precipitation_unit: "mm",
      timezone: "auto",
    });
    const response = await fetch(`${WEATHER_API}?${params}`);
    if (!response.ok)
      throw new Error(
        "The weather service could not return a forecast. Please retry shortly.",
      );
    const weather = await response.json();
    if (thisRequest !== requestNumber) return;
    if (!weather.current || !weather.hourly || !weather.daily)
      throw new Error("The weather service returned incomplete forecast data.");

    renderCurrent(weather);
    renderHourly(weather);
    renderDaily(weather);
    const area = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
    locationLine.textContent = weather.timezone
      ? `${weather.timezone} · ${area}`
      : area;
    updatedAt.textContent = `Updated ${formatApiTime(weather.current.time, { hour: "numeric", minute: "2-digit" })}`;
    apiMetadata.textContent = `Elevation ${Math.round(weather.elevation)} m · ${weather.timezone_abbreviation || weather.timezone || "Local time"}`;
    weatherStatus.textContent =
      "Forecast loaded. Data refreshes automatically every 15 minutes.";
    window.clearInterval(window.weatherRefreshInterval);
    window.weatherRefreshInterval = window.setInterval(
      loadWeather,
      15 * 60 * 1000,
    );
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    weatherStatus.classList.add("error");
    weatherStatus.textContent =
      error.message || "Unable to load weather. Please retry.";
  } finally {
    if (thisRequest === requestNumber) refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", loadWeather);
loadWeather();

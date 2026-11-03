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
  const current = weather.current || {};
  const temp = Math.round(Number(current.temperature_2m));
  const temperature = document.getElementById("heroTemperature");
  temperature.replaceChildren(
    document.createTextNode(Number.isFinite(temp) ? String(temp) : "—"),
    makeElement("span", "", "°C"),
  );
  document.getElementById("heroCondition").textContent = weatherCodeDescription(
    current.weather_code,
  );
  document.getElementById("heroIcon").textContent = weatherIcon(
    current.weather_code,
    current.is_day,
  );
  document
    .getElementById("heroFacts")
    .replaceChildren(
      heroFact(
        "Feels like",
        formatValue(
          "apparent_temperature",
          current.apparent_temperature,
          weather.current_units?.apparent_temperature,
        ),
      ),
      heroFact(
        "Humidity",
        formatValue(
          "relative_humidity_2m",
          current.relative_humidity_2m,
          weather.current_units?.relative_humidity_2m,
        ),
      ),
      heroFact(
        "Wind",
        `${formatValue("wind_speed_10m", current.wind_speed_10m, weather.current_units?.wind_speed_10m)} ${compassShort(current.wind_direction_10m)}`,
      ),
    );
  const highlights = document.getElementById("highlights");
  highlights.replaceChildren(
    highlight(
      "🌡️",
      "Feels like",
      formatValue(
        "apparent_temperature",
        current.apparent_temperature,
        weather.current_units?.apparent_temperature,
      ),
    ),
    highlight(
      "💧",
      "Humidity",
      formatValue(
        "relative_humidity_2m",
        current.relative_humidity_2m,
        weather.current_units?.relative_humidity_2m,
      ),
    ),
    highlight(
      "🌬️",
      "Wind",
      formatValue(
        "wind_speed_10m",
        current.wind_speed_10m,
        weather.current_units?.wind_speed_10m,
      ),
    ),
    highlight(
      "☀️",
      "UV index",
      formatValue(
        "uv_index",
        weather.hourly?.uv_index?.[hourIndex(weather)],
        weather.hourly_units?.uv_index,
      ),
    ),
  );
  const details = [
    ["Cloud cover", "cloud_cover"],
    ["Pressure", "pressure_msl"],
    ["Wind gusts", "wind_gusts_10m"],
    ["Precipitation", "precipitation"],
  ];
  details.forEach(([label, key]) => {
    const item = makeElement("div", "detail-item");
    item.append(
      makeElement("span", "metric-label", label),
      makeElement(
        "span",
        "metric-value",
        formatValue(key, current[key], weather.current_units?.[key]),
      ),
    );
    currentMetrics.append(item);
  });
}

function heroFact(label, value) {
  const item = makeElement("div", "hero-fact");
  item.append(makeElement("span", "", label), makeElement("strong", "", value));
  return item;
}

function highlight(icon, label, value) {
  const item = makeElement("article", "highlight-card");
  item.append(makeElement("span", "highlight-icon", icon));
  const copy = makeElement("div");
  copy.append(
    makeElement("span", "highlight-label", label),
    makeElement("strong", "highlight-value", value),
  );
  item.append(copy);
  return item;
}

function compassShort(degrees) {
  if (!Number.isFinite(Number(degrees))) return "";
  return compassDirection(degrees).split(" ")[0];
}

function weatherIcon(code, isDay = 1) {
  const n = Number(code);
  if (n >= 95) return "⛈️";
  if ((n >= 51 && n <= 67) || (n >= 80 && n <= 82)) return "🌧️";
  if ((n >= 71 && n <= 77) || n === 85 || n === 86) return "🌨️";
  if (n === 45 || n === 48) return "🌫️";
  if (n === 0) return Number(isDay) ? "☀️" : "🌙";
  if (n === 1 || n === 2) return Number(isDay) ? "🌤️" : "☁️";
  return "☁️";
}

function hourIndex(weather) {
  const times = weather.hourly?.time || [];
  const hour = weather.current?.time?.slice(0, 13);
  const found = times.findIndex((time) => time.slice(0, 13) >= hour);
  return found < 0 ? 0 : found;
}

function renderHourly(weather) {
  const list = document.getElementById("hourlyForecast");
  list.replaceChildren();
  const times = weather.hourly?.time || [];
  const firstIndex = hourIndex(weather);
  for (
    let index = firstIndex;
    index < Math.min(firstIndex + 8, times.length);
    index++
  ) {
    const item = makeElement("article", "hourly-item");
    const time = formatApiTime(times[index], { hour: "numeric" });
    item.append(
      makeElement("span", "hourly-time", index === firstIndex ? "Now" : time),
      makeElement(
        "span",
        "hourly-icon",
        weatherIcon(
          weather.hourly?.weather_code?.[index],
          weather.hourly?.is_day?.[index],
        ),
      ),
      makeElement(
        "strong",
        "hourly-temp",
        formatValue(
          "temperature_2m",
          weather.hourly?.temperature_2m?.[index],
          weather.hourly_units?.temperature_2m,
        ),
      ),
    );
    const rain = weather.hourly?.precipitation_probability?.[index];
    item.append(
      makeElement(
        "span",
        "hourly-rain",
        Number.isFinite(Number(rain)) && Number(rain) > 0
          ? `${rain}% rain`
          : "",
      ),
    );
    list.append(item);
  }
}

function renderDaily(weather) {
  dailyForecast.replaceChildren();
  const dates = weather.daily?.time || [];
  for (let index = 0; index < dates.length; index++) {
    const card = makeElement("article", "daily-item");
    const date = new Date(`${dates[index]}T12:00:00Z`);
    card.append(
      makeElement(
        "span",
        "daily-day",
        date.toLocaleDateString([], { weekday: "short", timeZone: "UTC" }),
      ),
      makeElement(
        "span",
        "daily-date",
        date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
      ),
      makeElement(
        "span",
        "daily-icon",
        weatherIcon(weather.daily?.weather_code?.[index], 1),
      ),
      makeElement(
        "span",
        "daily-summary",
        weatherCodeDescription(weather.daily?.weather_code?.[index]),
      ),
    );
    const temps = makeElement("div", "daily-temps");
    temps.append(
      makeElement(
        "span",
        "",
        formatValue(
          "temperature_2m_max",
          weather.daily?.temperature_2m_max?.[index],
          weather.daily_units?.temperature_2m_max,
        ),
      ),
      document.createTextNode(" / "),
      makeElement(
        "span",
        "",
        formatValue(
          "temperature_2m_min",
          weather.daily?.temperature_2m_min?.[index],
          weather.daily_units?.temperature_2m_min,
        ),
      ),
    );
    card.append(temps);
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

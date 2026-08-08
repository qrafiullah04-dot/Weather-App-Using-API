const apiKey = "ca3d58223439480bbc180801263107";

// State
let isMetric = true;
let currentWeatherData = null;
let savedFavorites = JSON.parse(localStorage.getItem("weather_favs")) || [];

// DOM Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const unitToggleBtn = document.getElementById("unitToggleBtn");
const favoriteBtn = document.getElementById("favoriteBtn");

const city = document.getElementById("city");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const icon = document.getElementById("icon");
const weatherBox = document.getElementById("weatherBox");

const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const uvIndex = document.getElementById("uvIndex");

const forecastGrid = document.getElementById("forecastGrid");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");

const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesList = document.getElementById("favoritesList");

// Initial Setup
updateFavoritesUI();

// 1. Event Listeners
searchBtn.addEventListener("click", () => {
    let cityName = cityInput.value.trim();
    if (cityName === "") {
        showError("⚠️ Please enter a city name.");
        return;
    }
    getWeather(cityName);
});

unitToggleBtn.addEventListener("click", () => {
    isMetric = !isMetric;
    unitToggleBtn.innerText = isMetric ? "°C" : "°F";
    if (currentWeatherData) displayWeather(currentWeatherData);
});

favoriteBtn.addEventListener("click", () => {
    if (!currentWeatherData) return;
    const name = currentWeatherData.location.name;
    if (!savedFavorites.includes(name)) {
        savedFavorites.push(name);
        localStorage.setItem("weather_favs", JSON.stringify(savedFavorites));
        updateFavoritesUI();
    }
});

const cityButtons = document.querySelectorAll(".city-btn");
cityButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const selectedCity = btn.getAttribute("data-city");
        cityInput.value = selectedCity;
        getWeather(selectedCity);
    });
});

// 2. Error Helpers
function showError(msg) {
    weatherBox.style.display = "none";
    errorText.innerText = msg;
    errorBox.style.display = "block";
}

function hideError() {
    errorBox.style.display = "none";
}

// 3. Fetch Weather & Forecast
async function getWeather(query) {
    hideError();

    if (!navigator.onLine) {
        showError("⚠️ No internet connection.");
        return;
    }

    try {
        const cleanQuery = encodeURIComponent(query);
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${cleanQuery}&days=3&aqi=no`
        );

        if (!response.ok) {
            throw new Error("❌ City not found.");
        }

        const data = await response.json();
        currentWeatherData = data;
        displayWeather(data);

    } catch (err) {
        showError(err.message);
    }
}

// 4. Display Main Weather
function displayWeather(data) {
    hideError();
    weatherBox.style.display = "block";

    city.innerHTML = data.location.name;
    
    const tempVal = isMetric ? Math.round(data.current.temp_c) + "°C" : Math.round(data.current.temp_f) + "°F";
    const feelsVal = isMetric ? Math.round(data.current.feelslike_c) + "°C" : Math.round(data.current.feelslike_f) + "°F";
    const windVal = isMetric ? `${data.current.wind_kph} km/h` : `${data.current.wind_mph} mph`;

    temperature.innerHTML = tempVal;
    condition.innerHTML = data.current.condition.text;
    feelsLike.innerHTML = feelsVal;
    humidity.innerHTML = `${data.current.humidity}%`;
    windSpeed.innerHTML = windVal;
    uvIndex.innerHTML = data.current.uv;

    changeBackground(data.current.condition.text);
    renderForecast(data.forecast.forecastday);
}

// 5. Render Forecast Cards
function renderForecast(days) {
    forecastGrid.innerHTML = "";
    days.forEach((day) => {
        const dateName = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
        const maxTemp = isMetric ? Math.round(day.day.maxtemp_c) + "°" : Math.round(day.day.maxtemp_f) + "°";
        const minTemp = isMetric ? Math.round(day.day.mintemp_c) + "°" : Math.round(day.day.mintemp_f) + "°";

        forecastGrid.innerHTML += `
            <div class="forecast-card">
                <div><strong>${dateName}</strong></div>
                <div>${maxTemp} / ${minTemp}</div>
                <div>${day.day.condition.text}</div>
            </div>
        `;
    });
}

// 6. Favorites List Rendering
function updateFavoritesUI() {
    if (savedFavorites.length === 0) {
        favoritesContainer.style.display = "none";
        return;
    }
    favoritesContainer.style.display = "block";
    favoritesList.innerHTML = "";
    savedFavorites.forEach((favCity) => {
        const btn = document.createElement("button");
        btn.className = "city-btn";
        btn.innerText = favCity;
        btn.onclick = () => {
            cityInput.value = favCity;
            getWeather(favCity);
        };
        favoritesList.appendChild(btn);
    });
}

// 7. Change Background
function changeBackground(conditionText) {
    const hour = new Date().getHours();
    const isNight = hour >= 19 || hour <= 6;
    let image;
    const weather = conditionText.toLowerCase();

    if (weather.includes("clear") || weather.includes("sunny")) {
        image = isNight ? "images/sunny-night.png" : "images/sunny-day.png";
        icon.innerHTML = isNight ? "🌙" : "☀️";
    } else if (weather.includes("cloud") || weather.includes("overcast")) {
        image = isNight ? "images/cloudy-night.png" : "images/cloudy-day.png";
        icon.innerHTML = "☁️";
    } else if (weather.includes("rain") || weather.includes("drizzle")) {
        image = isNight ? "images/rainy-night.png" : "images/rainy-day.png";
        icon.innerHTML = "🌧️";
    } else {
        image = "images/cloudy-day.png";
        icon.innerHTML = "🌤️";
    }

    document.body.style.backgroundImage = `url(${image})`;
}

// 8. Location Button Event
locationBtn.addEventListener("click", () => {
    hideError();

    if (!navigator.onLine) {
        showError("⚠️ No internet connection.");
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            getWeather(`${pos.coords.latitude},${pos.coords.longitude}`);
        }, () => {
            showError("⚠️ Location access denied.");
        });
    } else {
        showError("⚠️ Geolocation not supported.");
    }
});

 
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-button");
const locationButton = document.querySelector(".location-button");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const weatherMoreDiv = document.querySelector(".weather-more");
const hourlyWeatherDiv = document.querySelector(".hourly-weather");

const API_KEY = "93b06439383693a90cc070c8fd588f57"; 

const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h4>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}&deg;C</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                    
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="Weather-icon">
                    <h4> ${weatherItem.weather[0].description}</h4>
                
                </div>`;
    } else {
        return `<li class="card">
              <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
              <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="Weather-icon">
              <h4>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}&deg;C</h4>
              <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
              <h4>Humidity: ${weatherItem.main.humidity}%</h4>
            </li>`;
    }
};

const updateMoreAboutLocation = (cityName, sunrise, sunset, currentTime, clouds, uvIndex, pressure) => {
    weatherMoreDiv.innerHTML = `
        <li class="we-card">
            <h3>${cityName}</h3>
            <h4>Sunrise: ${sunrise}</h4>
            <h4>Sunset: ${sunset}</h4>
        </li>
        <li class="we-card">
            <h3>Date and Time</h3>
            <h4>Date: ${new Date().toLocaleDateString()}</h4>
            <h4>Time: ${currentTime}</h4>
        </li>
        <li class="we-card">
            <h3>Clouds and Pressure</h3>
            <h4>Clouds: ${clouds}%</h4>
            <h4>Pressure: ${pressure} hPa</h4>
        </li>
    `;
};

const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const CURRENT_WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    Promise.all([
        fetch(WEATHER_API_URL).then(res => res.json()),
        fetch(CURRENT_WEATHER_API_URL).then(res => res.json())
    ])
    .then(([forecastData, currentData]) => {
        const uniqueForecastDays = [];
        const fiveDaysForecast = forecastData.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        fiveDaysForecast.forEach((weatherItem, index) => {
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
            }
        });

        
        const currentDayForecast = forecastData.list.filter(forecast => {
            return new Date(forecast.dt_txt).getDate() === new Date().getDate();
        });

        
        hourlyWeatherDiv.innerHTML = ""; 
        hourlyWeatherDiv.insertAdjacentHTML("beforeend", `<h2>Hourly Forecast for Today</h2>`);

        currentDayForecast.slice(0, 5).forEach(hour => {
            const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const temperature = (hour.main.temp - 273.15).toFixed(2);
            const weatherIcon = hour.weather[0].icon;

            hourlyWeatherDiv.insertAdjacentHTML("beforeend", `
                <div class="hourly-item" style="display: inline-block; width: 18%; text-align: center;">
                    <p>${time}</p>
                    <img src="https://openweathermap.org/img/wn/${weatherIcon}.png" alt="Weather Icon" style="width: 50px; height: 50px;">
                    <p>${temperature}&deg;C</p>
                </div>
            `);
        });

    
        const sunrise = new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sunset = new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const currentTime = new Date(currentData.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const clouds = currentData.clouds.all;
        const uvIndex = "N/A"; 
        const pressure = currentData.main.pressure;

        updateMoreAboutLocation(cityName, sunrise, sunset, currentTime, clouds, uvIndex, pressure);
    }).catch(() => {
        alert("An error occurred while fetching the weather details.");
    });
};

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;
    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
    .then(res => res.json())
    .then(data => {
        if (!data.length) return alert(`No coordinates found for ${cityName}`);
        const { name, lat, lon } = data[0];
        getWeatherDetails(name, lat, lon);
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
    });
};

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                .then(response => response.json())
                .then(data => {
                    const cityName = data.locality;
                    getWeatherDetails(cityName, latitude, longitude);
                })
                .catch(error => {
                    alert("An error occurred while fetching your location.");
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Location denied. Please restart to access again.");
            }
        }
    );
};

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());


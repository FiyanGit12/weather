       // Api 
        const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
        const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

        // DOM Elements
        const cityInput = document.getElementById('cityInput');
        const searchBtn = document.getElementById('searchBtn');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const weatherDisplay = document.getElementById('weather-display');
        const appBackground = document.getElementById('app-background');
        const particleContainer = document.getElementById('particle-container');

        // Weather code mapping untuk Open-Meteo
        const weatherCodeMap = {
    0: { main: 'clear', desc: 'Cerah', icon: 'fas fa-sun' },
    1: { main: 'clear', desc: 'Sebagian cerah', icon: 'fas fa-sun' },
    2: { main: 'clouds', desc: 'Berawan sebagian', icon: 'fas fa-cloud-sun' },
    3: { main: 'clouds', desc: 'Berawan', icon: 'fas fa-cloud' },
    45: { main: 'mist', desc: 'Berkabut', icon: 'fas fa-smog' },
    48: { main: 'mist', desc: 'Kabut tebal', icon: 'fas fa-smog' },
    51: { main: 'drizzle', desc: 'Gerimis ringan', icon: 'fas fa-cloud-rain' },
    53: { main: 'drizzle', desc: 'Gerimis sedang', icon: 'fas fa-cloud-rain' },
    55: { main: 'drizzle', desc: 'Gerimis lebat', icon: 'fas fa-cloud-rain' },
    61: { main: 'rain', desc: 'Hujan ringan', icon: 'fas fa-cloud-rain' },
    63: { main: 'rain', desc: 'Hujan sedang', icon: 'fas fa-cloud-rain' },
    65: { main: 'rain', desc: 'Hujan lebat', icon: 'fas fa-cloud-rain' },
    71: { main: 'snow', desc: 'Salju ringan', icon: 'fas fa-snowflake' },
    73: { main: 'snow', desc: 'Salju sedang', icon: 'fas fa-snowflake' },
    75: { main: 'snow', desc: 'Salju lebat', icon: 'fas fa-snowflake' },
    80: { main: 'rain', desc: 'Hujan rintik-rintik', icon: 'fas fa-cloud-rain' },
    81: { main: 'rain', desc: 'Hujan deras', icon: 'fas fa-cloud-rain' },
    82: { main: 'rain', desc: 'Hujan sangat deras', icon: 'fas fa-cloud-rain' },
    95: { main: 'thunderstorm', desc: 'Badai petir', icon: 'fas fa-bolt' },
    96: { main: 'thunderstorm', desc: 'Badai petir dengan hujan es', icon: 'fas fa-bolt' },
    99: { main: 'thunderstorm', desc: 'Badai petir dengan hujan es lebat', icon: 'fas fa-bolt' }
};

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            updateDateTime();
            setInterval(updateDateTime, 60000);
            
            addEventListeners();
            
            // Load default city
            cityInput.value = 'Pati';
            searchWeather();
        });

        function addEventListeners() {
            if (searchBtn) {
                searchBtn.addEventListener('click', searchWeather);
            }
            
            if (cityInput) {
                cityInput.addEventListener('keypress', function(event) {
                    if (event.key === 'Enter') {
                        searchWeather();
                    }
                });
            }
            
            if (searchBtn) {
                searchBtn.addEventListener('mouseenter', function() {
                    this.classList.add('pulse-animation');
                });

                searchBtn.addEventListener('mouseleave', function() {
                    this.classList.remove('pulse-animation');
                });
            }
        }

        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            const dateElement = document.getElementById('current-date');
            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('en-US', options);
            }
        }

        // MAIN SEARCH FUNCTION - Open-Meteo API
        async function searchWeather() {
            const city = cityInput?.value.trim() || 'Jakarta';
            
            if (!city) {
                showError('Tolong pilih nama kota');
                return;
            }

            showLoading();
            
            try {
                // Step 1: Get coordinates from city name
                const geoResponse = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
                const geoData = await geoResponse.json();
                
                if (!geoData.results || geoData.results.length === 0) {
                    showError('Kota tidak ada');
                    return;
                }
                
                const location = geoData.results[0];
                const { latitude, longitude } = location;
                
                // Step 2: Get weather data with all required parameters
                const weatherParams = new URLSearchParams({
                    latitude: latitude,
                    longitude: longitude,
                    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
                    daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
                    timezone: 'auto',
                    forecast_days: 1
                });
                
                const weatherResponse = await fetch(`${WEATHER_URL}?${weatherParams}`);
                const weatherData = await weatherResponse.json();
                
                if (weatherResponse.ok) {
                    displayWeatherOpenMeteo(weatherData, location);
                    const weatherCode = weatherData.current.weather_code;
                    const weatherInfo = weatherCodeMap[weatherCode] || weatherCodeMap[0];
                    updateBackground(weatherInfo.main);
                    updateParticles(weatherInfo.main);
                } else {
                    showError('Failed to fetch weather data');
                }
                
            } catch (err) {
                showError('Network error. Please check your connection.');
                console.error('Error:', err);
            }
        }

        function showLoading() {
            if (loading) loading.classList.remove('hidden');
            if (error) error.classList.add('hidden');
            if (weatherDisplay) weatherDisplay.classList.add('hidden');
        }

        function showError(message) {
            if (loading) loading.classList.add('hidden');
            if (error) error.classList.remove('hidden');
            if (weatherDisplay) weatherDisplay.classList.add('hidden');
            
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }

        function displayWeatherOpenMeteo(data, location) {
            if (loading) loading.classList.add('hidden');
            if (error) error.classList.add('hidden');
            if (weatherDisplay) weatherDisplay.classList.remove('hidden');

            const current = data.current;
            const daily = data.daily;
            const weatherCode = current.weather_code;
            const weatherInfo = weatherCodeMap[weatherCode] || weatherCodeMap[0];

            // Update weather information
            const cityName = document.getElementById('city-name');
            if (cityName) {
                const country = location.country || location.country_code || '';
                cityName.textContent = `${location.name}${country ? ', ' + country : ''}`;
            }
            
            const temperature = document.getElementById('temperature');
            if (temperature) temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
            
            const weatherDescription = document.getElementById('weather-description');
            if (weatherDescription) weatherDescription.textContent = weatherInfo.desc;
            
            const humidity = document.getElementById('humidity');
            if (humidity) humidity.textContent = `${current.relative_humidity_2m}%`;
            
            const windSpeed = document.getElementById('wind-speed');
            if (windSpeed) windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
            
            const feelsLike = document.getElementById('feels-like');
            if (feelsLike) feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
            
            // Min/Max temperature from daily data
            const tempMin = document.getElementById('temp-min');
            if (tempMin && daily.temperature_2m_min) {
                tempMin.textContent = `${Math.round(daily.temperature_2m_min[0])}°C`;
            }
            
            const tempMax = document.getElementById('temp-max');
            if (tempMax && daily.temperature_2m_max) {
                tempMax.textContent = `${Math.round(daily.temperature_2m_max[0])}°C`;
            }
            
            // Pressure
            const pressure = document.getElementById('pressure');
            if (pressure && current.surface_pressure) {
                pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;
            }
            
            // Default visibility (not available in Open-Meteo free tier)
            const visibility = document.getElementById('visibility');
            if (visibility) visibility.textContent = '10.0 km';

            // Update weather icon
            const weatherIcon = document.getElementById('weather-icon');
            if (weatherIcon) {
                weatherIcon.className = `weather-icon ${weatherInfo.icon} text-white mb-4`;
            }

            // Sunrise/Sunset from daily data
            const sunriseElement = document.getElementById('sunrise');
            if (sunriseElement && daily.sunrise) {
                const sunrise = new Date(daily.sunrise[0]);
                sunriseElement.textContent = sunrise.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
            
            const sunsetElement = document.getElementById('sunset');
            if (sunsetElement && daily.sunset) {
                const sunset = new Date(daily.sunset[0]);
                sunsetElement.textContent = sunset.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }

            console.log('Weather data displayed:', data);
        }

        function updateBackground(weatherCondition) {
            if (!appBackground) return;
            
            appBackground.classList.remove('weather-clear', 'weather-cloudy', 'weather-rainy', 'weather-default');
            
            switch(weatherCondition) {
                case 'clear':
                    appBackground.classList.add('weather-clear');
                    break;
                case 'clouds':
                    appBackground.classList.add('weather-cloudy');
                    break;
                case 'rain':
                case 'drizzle':
                case 'thunderstorm':
                    appBackground.classList.add('weather-rainy');
                    break;
                default:
                    appBackground.classList.add('weather-default');
            }
        }

        // PARTICLE SYSTEM (Optimized)
        let particleInterval = null;

        function updateParticles(weatherCondition) {
            if (!particleContainer) return;
            
            clearWeatherParticles();
            
            if (particleInterval) {
                clearInterval(particleInterval);
                particleInterval = null;
            }
            
            switch(weatherCondition) {
                case 'rain':
                case 'drizzle':
                    createRainParticles();
                    break;
                case 'snow':
                    createSnowParticles();
                    break;
                case 'clouds':
                    createCloudParticles();
                    break;
            }
        }

        function clearWeatherParticles() {
            if (!particleContainer) return;
            
            if (particleInterval) {
                clearInterval(particleInterval);
                particleInterval = null;
            }
            
            const existingParticles = particleContainer.querySelectorAll('.rain-particle, .snow-particle, .cloud-particle');
            existingParticles.forEach(particle => particle.remove());
        }

        function createRainParticles() {
            if (!particleContainer) return;
            
            let rainCount = 0;
            particleInterval = setInterval(() => {
                if (rainCount < 25) {
                    const rainDrop = document.createElement('div');
                    rainDrop.className = 'rain-particle';
                    rainDrop.style.cssText = `
                        position: absolute;
                        width: 2px;
                        height: 20px;
                        background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.8));
                        left: ${Math.random() * 100}%;
                        top: -20px;
                        animation: rainfall ${Math.random() * 0.5 + 0.5}s linear infinite;
                        pointer-events: none;
                    `;
                    particleContainer.appendChild(rainDrop);
                    
                    setTimeout(() => {
                        if (rainDrop && rainDrop.parentNode) {
                            rainDrop.remove();
                            rainCount--;
                        }
                    }, 1000);
                    
                    rainCount++;
                }
            }, 120);
        }

        function createSnowParticles() {
            if (!particleContainer) return;
            
            let snowCount = 0;
            particleInterval = setInterval(() => {
                if (snowCount < 15) {
                    const snowFlake = document.createElement('div');
                    const size = Math.random() * 6 + 3;
                    snowFlake.className = 'snow-particle';
                    snowFlake.style.cssText = `
                        position: absolute;
                        width: ${size}px;
                        height: ${size}px;
                        background: white;
                        border-radius: 50%;
                        left: ${Math.random() * 100}%;
                        top: -10px;
                        animation: snowfall ${Math.random() * 2 + 3}s linear infinite;
                        opacity: 0.8;
                        pointer-events: none;
                    `;
                    particleContainer.appendChild(snowFlake);
                    
                    setTimeout(() => {
                        if (snowFlake && snowFlake.parentNode) {
                            snowFlake.remove();
                            snowCount--;
                        }
                    }, 5000);
                    
                    snowCount++;
                }
            }, 400);
        }

     function createCloudParticles() {
            if (!particleContainer) return;
            
            let cloudCount = 0;
            particleInterval = setInterval(() => {
                if (cloudCount < 8) {
                    const cloud = document.createElement('div');
                    const width = Math.random() * 60 + 40;
                    const height = Math.random() * 25 + 15;
                    cloud.className = 'cloud-particle';
                    cloud.style.cssText = `
                        position: absolute;
                        width: ${width}px;
                        height: ${height}px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 50px;
                        top: ${Math.random() * 30 + 10}%;
                        left: -100px;
                        animation: clouddrift ${Math.random() * 10 + 20}s linear infinite;
                        opacity: 0.6;
                        pointer-events: none;
                    `;
                    particleContainer.appendChild(cloud);
                    
                    setTimeout(() => {
                        if (cloud && cloud.parentNode) {
                            cloud.remove();
                            cloudCount--;
                        }
                    }, 30000);
                    
                    cloudCount++;
                }
            }, 3000);
        }

        // Clean up on page unload
        window.addEventListener('beforeunload', function() {
            clearWeatherParticles();
        });

        // Utility function for debugging
        function logWeatherData(data) {
            console.log('Current Weather Data:', {
                temperature: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                windSpeed: data.current.wind_speed_10m,
                weatherCode: data.current.weather_code,
                pressure: data.current.surface_pressure
            });
        }

        // Handle window resize for responsive particles
        window.addEventListener('resize', function() {
            // Restart particle animation on resize to maintain proper positioning
            const currentBackground = appBackground.className;
            if (currentBackground.includes('weather-rainy')) {
                updateParticles('rain');
            } else if (currentBackground.includes('weather-cloudy')) {
                updateParticles('clouds');
            }
        });

        // Additional error handling for network issues
        function handleNetworkError(error) {
            console.error('Network Error:', error);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                showError('Unable to connect to weather service. Please check your internet connection.');
            } else {
                showError('An unexpected error occurred. Please try again.');
            }
        }
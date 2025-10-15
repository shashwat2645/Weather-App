
    const API_KEY = "7169a8d2c0c2b7b3c5982477825173ed";
    const cityInput = document.getElementById("cityInput");
    const searchBtn = document.getElementById("searchBtn");
    const searchIcon = document.getElementById("searchIcon");
    const searchText = document.getElementById("searchText");
    const errorContainer = document.getElementById("errorContainer");
    const currentWeather = document.getElementById("currentWeather");
    const forecast = document.getElementById("forecast");

    // Input validation
    function sanitizeInput(input) {
      return input.trim().replace(/[<>]/g, '').substring(0, 100);
    }

    function validateCity(city) {
      if (!city || city.length === 0) {
        return { valid: false, error: "Please enter a city name" };
      }
      if (city.length > 100) {
        return { valid: false, error: "City name is too long" };
      }
      if (!/^[a-zA-Z\s\-']+$/.test(city)) {
        return { valid: false, error: "Please enter a valid city name" };
      }
      return { valid: true };
    }

    // Toast notification
    function showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <span style="font-size: 20px">${type === 'success' ? '✅' : '❌'}</span>
        <span style="font-weight: 500">${message}</span>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    // Show error
    function showError(message) {
      errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
      currentWeather.style.display = 'none';
      forecast.style.display = 'none';
      setTimeout(() => {
        errorContainer.innerHTML = '';
      }, 5000);
    }

    // Loading state
    function setLoading(isLoading) {
      if (isLoading) {
        searchBtn.disabled = true;
        searchIcon.innerHTML = '<div class="spinner"></div>';
        searchText.textContent = 'Loading...';
      } else {
        searchBtn.disabled = false;
        searchIcon.textContent = '🔍';
        searchText.textContent = 'Search';
      }
    }

    // Fetch weather data
    async function getWeather() {
      const city = sanitizeInput(cityInput.value);
      const validation = validateCity(city);
      
      if (!validation.valid) {
        showError(validation.error);
        return;
      }

      errorContainer.innerHTML = '';
      setLoading(true);

      try {
        // Fetch current weather
        const currentRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );

        if (!currentRes.ok) {
          throw new Error(currentRes.status === 404 ? "City not found" : "Failed to fetch weather data");
        }

        const currentData = await currentRes.json();

        // Display current weather
        document.getElementById("cityName").textContent = `${currentData.name}, ${currentData.sys.country}`;
        document.getElementById("weatherDesc").textContent = currentData.weather[0].description;
        document.getElementById("temperature").textContent = `${Math.round(currentData.main.temp)}°C`;
        document.getElementById("feelsLike").textContent = `${Math.round(currentData.main.feels_like)}°C`;
        document.getElementById("humidity").textContent = `${currentData.main.humidity}%`;
        document.getElementById("windSpeed").textContent = `${currentData.wind.speed} m/s`;
        document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@4x.png`;
        document.getElementById("weatherIcon").alt = currentData.weather[0].description;

        currentWeather.style.display = 'block';

        // Fetch forecast
        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );

        if (!forecastRes.ok) {
          throw new Error("Failed to fetch forecast data");
        }

        const forecastData = await forecastRes.json();

        // Process forecast data
        const today = new Date().toISOString().split("T")[0];
        const seenDates = new Set();
        const forecastList = forecastData.list.filter(item => {
          const [date, time] = item.dt_txt.split(" ");
          if (time === "12:00:00" && !seenDates.has(date) && date !== today) {
            seenDates.add(date);
            return true;
          }
          return false;
        }).slice(0, 5);

        // Display forecast
        const forecastGrid = document.getElementById("forecastGrid");
        forecastGrid.innerHTML = forecastList.map(day => {
          const date = new Date(day.dt_txt);
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          return `
            <div class="forecast-card">
              <div class="forecast-day">${dayName}</div>
              <img 
                class="forecast-icon" 
                src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" 
                alt="${day.weather[0].description}"
              >
              <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
              <div class="forecast-desc">${day.weather[0].description}</div>
            </div>
          `;
        }).join('');

        forecast.style.display = 'block';
        showToast(`Weather data loaded for ${currentData.name}`);

      } catch (error) {
        showError(error.message);
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    }

    // Event listeners
    searchBtn.addEventListener("click", getWeather);
    cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        getWeather();
      }
    });

    // Focus input on load
    cityInput.focus();
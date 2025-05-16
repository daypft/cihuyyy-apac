import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';

const cardContainer = document.getElementById('weather-card-container');
const citySelect = document.getElementById('city-select');
const weatherText = document.getElementById('weather-text');
const weatherIcon = document.getElementById('weather-icon');
const chartCanvas = document.getElementById('weather-chart');
const forecastList = document.getElementById('forecast-list');
const mapFrame = document.getElementById('map-frame');

let weatherChart = null;
const API_KEY = '849aa284b74539f3dc387ca20d358130';

citySelect.addEventListener('change', async () => {
  const city = citySelect.value;
  if (!city) return;

  cardContainer.classList.add('expanded');
  showLoading(); weatherText.textContent = 'Fetching weather data...';
  weatherIcon.src = '';
  forecastList.innerHTML = '';
  mapFrame.src = '';

  try {
    const currentRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city},ID&appid=${API_KEY}&units=metric&lang=en`
    );
    const forecastRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city},ID&appid=${API_KEY}&units=metric&lang=en`
    );

    const current = currentRes.data;
    const forecast = forecastRes.data;

    const iconCode = current.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    hideLoading(); weatherText.textContent = `Weather in ${current.name}: ${current.weather[0].description}, suhu ${current.main.temp}°C`;

    if (weatherChart) weatherChart.destroy();
    weatherChart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: ['Suhu (°C)', 'Kelembaban (%)', 'Angin (m/s)'],
        datasets: [{
          label: 'Informasi Cuaca',
          data: [current.main.temp, current.main.humidity, current.wind.speed],
          backgroundColor: ['#7b2cbf', '#c77dff', '#9d4edd'],
          borderRadius: 10
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } }
      }
    });

    for (let i = 0; i < forecast.list.length; i += 8) {
      const day = forecast.list[i];
      const date = new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: 'long' });
      const desc = day.weather[0].description;
      const temp = day.main.temp;
      const icon = day.weather[0].icon;
      const li = document.createElement('li');
      li.innerHTML = `<img src="https://openweathermap.org/img/wn/${icon}.png" style="vertical-align:middle;"> <strong>${date}:</strong> ${desc}, ${temp}°C`;
      forecastList.appendChild(li);
    }

    const lat = current.coord.lat;
    const lon = current.coord.lon;
    mapFrame.src = `https://maps.google.com/maps?q=${lat},${lon}&z=11&output=embed`;
getGeminiSuggestion(current.name, current.weather[0].description, current.main.temp, current.main.humidity, current.wind.speed);

  } catch (error) {
    hideLoading(); weatherText.textContent = 'Failed to fetch weather data.';
    if (weatherChart) weatherChart.destroy();
  }
});


// DARK MODE TOGGLE
document.getElementById('toggle-theme').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.checked);
});

// Loading indicator
const loadingEl = document.getElementById('loading');

const showLoading = () => loadingEl.classList.remove('hidden');
const hideLoading = () => loadingEl.classList.add('hidden');

document.getElementById("app-title").addEventListener("click", () => {
  document.getElementById("city-select").value = "";
  document.getElementById("weather-card-container").classList.remove("expanded");
  document.getElementById("weather-card").style.display = "none";
});

// Ensure selecting again after reset works
document.getElementById("city-select").addEventListener("change", () => {
  const card = document.getElementById("weather-card");
  if (card.style.display === "none") {
    card.style.display = "grid"; // matches grid style
  }
});

async function getGeminiSuggestion(city, description, temp, humidity, wind) {
  const prompt = `Current weather in ${city}: ${description}, temperature ${temp}°C, humidity ${humidity}%, wind speed ${wind} m/s. Explain this weather condition and suggest appropriate activities.`;

  try {
    const geminiRes = await fetch(
      "/api/gemini",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();
    const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    document.getElementById("gemini-response").textContent = response;
  } catch (error) {
    document.getElementById("gemini-response").textContent = "Gagal mengambil saran dari Gemini.";
  }
}

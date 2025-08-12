const btn = document.getElementById('btn');
const cityInput = document.getElementById('city');
const errorEl = document.getElementById('error');

btn.addEventListener('click', fetchWeather);
cityInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') fetchWeather(); });

async function fetchWeather(){
  const city = cityInput.value.trim();
  if(!city){ showError('Please enter a city'); return; }

  showError('');
  try{
    const res = await fetch(`/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    if(!res.ok){ showError(data.message || data.error || JSON.stringify(data)); return; }

    // Current
    const cur = data.current;
    document.getElementById('c-city').textContent = `${cur.name}, ${cur.sys?.country || ''}`;
    document.getElementById('c-temp').textContent = `${Math.round(cur.main.temp)}°C`;
    document.getElementById('c-desc').textContent = cur.weather[0].description;
    document.getElementById('c-details').textContent = `Feels like ${Math.round(cur.main.feels_like)}°C • Humidity ${cur.main.humidity}%`;
    document.getElementById('c-icon').src = `https://openweathermap.org/img/wn/${cur.weather[0].icon}@2x.png`;

    document.getElementById('current').classList.remove('hidden');

    // Forecast
    const cards = document.getElementById('cards');
    cards.innerHTML = '';
    data.forecast.forEach(f => {
      const div = document.createElement('div');
      div.className = 'fday';
      div.innerHTML = `<div>${f.date}</div>
                       <img src="https://openweathermap.org/img/wn/${f.icon}@2x.png" alt="icon" />
                       <div class="big">${Math.round(f.temp)}°C</div>
                       <div>${f.description}</div>`;
      cards.appendChild(div);
    });

    document.getElementById('forecast').classList.remove('hidden');
  }catch(err){
    console.error(err);
    showError('Network or server error');
  }
}

function showError(msg){ errorEl.textContent = msg; if(msg) errorEl.scrollIntoView({behavior:'smooth'}); }

// Optional: prefill with an example city
cityInput.value = 'Delhi';
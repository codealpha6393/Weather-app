 const express = require('express');
 const fetch = global.fetch || require('node-fetch'); // Replit / Node 18+ has fetch; fallback if needed
 const path = require('path');
 const app = express();
 const PORT = process.env.PORT || 3000;

 app.use(express.static(path.join(__dirname, 'public')));

 // Helper: group forecast by date and pick midday points
 function simplifyForecast(list) {
   // list is array of 3-hour forecasts
   const days = {};
   list.forEach(item => {
     const date = new Date(item.dt * 1000);
     const dayKey = date.toISOString().slice(0,10); // YYYY-MM-DD
     if (!days[dayKey]) days[dayKey] = [];
     days[dayKey].push(item);
   });

   // For each day pick an item closest to 12:00 local (no timezone conversion here; this is approximate)
   return Object.keys(days).slice(0,5).map(dayKey => {
     const items = days[dayKey];
     // find item with hour closest to 12
     let best = items.reduce((a,b) => Math.abs(new Date(a.dt*1000).getUTCHours()-12) < Math.abs(new Date(b.dt*1000).getUTCHours()-12) ? a : b);
     return {
       date: dayKey,
       temp: best.main.temp,
       description: best.weather[0].description,
       icon: best.weather[0].icon
     };
   });
 }

 app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'city query parameter required' });

  const apiKey = 'dd34e307b0aa8339b5182b5514aaecbf' 
  if (!apiKey) return res.status(500).json({ error: 'WEATHER_API_KEY not configured on server' });

  try {
    // Current weather
    const curUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const curResp = await fetch(curUrl);
    const curData = await curResp.json();
    if (curData.cod && curData.cod !== 200) return res.status(400).json(curData);

    // Forecast
    const fUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const fResp = await fetch(fUrl);
    const fData = await fResp.json();
    if (fData.cod && fData.cod !== '200') {
      return res.status(400).json(fData);
    }

    const simplified = simplifyForecast(fData.list);

    res.json({ current: curData, forecast: simplified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Weather app server running on port ${PORT}`);
});

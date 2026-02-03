const axios = require("axios");
const config = require("../../config.json");

async function getContactInfo(bot, jid) {
    try {
        const contact = await bot.onWhatsApp(jid);
        if (contact && contact[0] && contact[0].name) {
            return {
                jid: jid,
                name: contact[0].name,
                number: jid.split('@')[0]
            };
        }
        return {
            jid: jid,
            name: jid.split('@')[0],
            number: jid.split('@')[0]
        };
    } catch (error) {
        return {
            jid: jid,
            name: jid.split('@')[0],
            number: jid.split('@')[0]
        };
    }
}

function getWeatherEmoji(weatherCode) {
    const emojiMap = {
        'clear': '☀️',
        'partly-cloudy': '⛅',
        'cloudy': '☁️',
        'rain': '🌧️',
        'snow': '❄️',
        'thunderstorm': '⛈️',
        'fog': '🌫️',
        'wind': '💨',
        'default': '🌈'
    };
    
    if (weatherCode === 0) return '☀️'; // Clear sky
    if (weatherCode >= 1 && weatherCode <= 3) return '⛅'; // Partly cloudy
    if (weatherCode >= 45 && weatherCode <= 48) return '🌫️'; // Fog
    if (weatherCode >= 51 && weatherCode <= 67) return '🌦️'; // Drizzle/Rain
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️'; // Snow
    if (weatherCode >= 80 && weatherCode <= 82) return '🌧️'; // Rain showers
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️'; // Thunderstorm
    return emojiMap.default;
}

function getWindDirection(degrees) {
    const directions = ['↑ Utara', '↗ Timur Laut', '→ Timur', '↘ Tenggara', '↓ Selatan', '↙ Barat Daya', '← Barat', '↖ Barat Laut'];
    const index = Math.round((degrees % 360) / 45) % 8;
    return directions[index];
}

function formatTime(timestamp, timezone) {
    return new Date(timestamp * 1000).toLocaleTimeString('id-ID', { 
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
    });
}

module.exports = {
    command: ["weather", "cuaca"],
    category: "utility",
    description: "Cek cuaca di lokasi tertentu",
    
    async execute(bot, m, args) {
        try {
            let location = args.join(" ").trim();
            
            // Default location jika tidak ada input
            if (!location) {
                location = "Jakarta";
            }
            
            // Step 1: Geocoding - Get coordinates from location name
            const geoResponse = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
                params: {
                    name: location,
                    count: 1,
                    language: "id",
                    format: "json"
                }
            });
            
            if (!geoResponse.data || !geoResponse.data.results || geoResponse.data.results.length === 0) {
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ Lokasi tidak ditemukan. Coba gunakan nama kota yang lebih spesifik." },
                    { quoted: m }
                );
            }
            
            const geoData = geoResponse.data.results[0];
            const { latitude, longitude, name, admin1, country, timezone } = geoData;
            
            // Step 2: Get weather data
            const weatherResponse = await axios.get("https://api.open-meteo.com/v1/forecast", {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
                    timezone: timezone,
                    forecast_days: 1
                }
            });
            
            if (!weatherResponse.data || !weatherResponse.data.current) {
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ Gagal mengambil data cuaca. Coba lagi nanti." },
                    { quoted: m }
                );
            }
            
            const current = weatherResponse.data.current;
            const weatherEmoji = getWeatherEmoji(current.weather_code);
            const windDirection = getWindDirection(current.wind_direction_10m);
            const localTime = formatTime(current.time, timezone);
            
            // Step 3: Format beautiful response
            const locationText = `📍 ${name}${admin1 ? `, ${admin1}` : ''}, ${country}`;
            
            const caption = `
╭━━━━━━━━━━━━━━━━━━━━━╮
       🌤️  𝐂𝐔𝐀𝐂𝐀 𝐇𝐀𝐑𝐈 𝐈𝐍𝐈  🌤️
╰━━━━━━━━━━━━━━━━━━━━━╯

${locationText}
🕒 Waktu lokal: ${localTime}

${weatherEmoji} *Kondisi:* ${getWeatherCondition(current.weather_code)}
🌡️ *Suhu:* ${current.temperature_2m}°C
🔥 *Terasa seperti:* ${current.apparent_temperature}°C
💧 *Kelembaban:* ${current.relative_humidity_2m}%
💨 *Angin:* ${(current.wind_speed_10m * 3.6).toFixed(1)} km/jam
🧭 *Arah:* ${windDirection}

━━━━━━━━━━━━━━━━━━━━━━━
📡 *Sumber:* Open-Meteo API
⚡ *Diproses oleh:* ${config.botName || "Bot"}

_📍 Ketik .cuaca [kota] untuk cek kota lain_
━━━━━━━━━━━━━━━━━━━━━━━
            `.trim();

            // Send message
            await bot.sendMessage(
                m.key.remoteJid,
                { text: caption },
                { quoted: m }
            );

        } catch (err) {
            console.error("[WEATHER ERROR]", err);
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "❌ Terjadi kesalahan saat memproses permintaan cuaca." },
                { quoted: m }
            );
        }
    }
};

function getWeatherCondition(weatherCode) {
    const conditions = {
        0: "Cerah",
        1: "Cerah Berawan",
        2: "Berawan",
        3: "Mendung",
        45: "Kabut",
        48: "Kabut Beku",
        51: "Gerimis Ringan",
        53: "Gerimis Sedang",
        55: "Gerimis Lebat",
        56: "Gerimis Beku Ringan",
        57: "Gerimis Beku Lebat",
        61: "Hujan Ringan",
        63: "Hujan Sedang",
        65: "Hujan Lebat",
        66: "Hujan Beku Ringan",
        67: "Hujan Beku Lebat",
        71: "Salju Ringan",
        73: "Salju Sedang",
        75: "Salju Lebat",
        77: "Butiran Salju",
        80: "Hujan Lokal Ringan",
        81: "Hujan Lokal Sedang",
        82: "Hujan Lokal Lebat",
        85: "Hujan Salju Ringan",
        86: "Hujan Salju Lebat",
        95: "Badai Petir",
        96: "Badai Petir dengan Hujan Es Ringan",
        99: "Badai Petir dengan Hujan Es Lebat"
    };
    
    return conditions[weatherCode] || "Tidak Diketahui";
}
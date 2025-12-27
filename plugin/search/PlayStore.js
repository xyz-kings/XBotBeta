// File: plugin/search/PlayStore.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['plystre'], // dua command bisa dipakai
    ownerOnly: false,
    limit: true, // kalau kamu pakai sistem limit
    tags: 'search', // untuk kategori menu

    help: ['plystre <nama aplikasi>'],
    description: 'Mencari aplikasi di Google Play Store',

    async execute(bot, m, args) {
        const query = args.join(' ');
        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ *Masukkan nama aplikasi yang ingin dicari!*\n\nContoh: ${config.prefix}plystre whatsapp`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang mencari di Play Store...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/playstore`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params}`);
            const data = await res.json();

            if (!data.status || !data.result || data.result.length === 0) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Tidak ditemukan hasil pencarian atau API error.'
                }, { quoted: m });
            }

            let teks = `*[ HASIL PLAY STORE ]*\n\nPencarian: *${query}*\n\n`;

            data.result.slice(0, 10).forEach((app, i) => {
                teks += `${i + 1}. *${app.nama}*\n`;
                teks += `   ├ Developer: ${app.developer}\n`;
                teks += `   ├ Rating: ${app.rate} (${app.rate2} ⭐)\n`;
                teks += `   └ Link: ${app.link}\n\n`;
            });

            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('Error PlayStore Search:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Terjadi kesalahan saat menghubungi API. Coba lagi nanti.'
            }, { quoted: m });
        }
    }
};
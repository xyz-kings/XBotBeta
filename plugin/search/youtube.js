// File: plugin/search/Youtube.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['ytsrch'], // dua command bisa dipakai
    ownerOnly: false,
    limit: true,
    tags: 'search', // masuk kategori search

    help: ['ytsrch <judul lagu/video>'],
    description: 'Mencari video di YouTube',

    async execute(bot, m, args) {
        const query = args.join(' ');
        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ *Masukkan judul atau keyword yang ingin dicari di YouTube!*\n\nContoh: ${config.prefix}ytsrch dj opus`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang mencari di YouTube...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/youtube`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params}`);
            const data = await res.json();

            if (!data.status || !data.result || data.result.length === 0) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Tidak ditemukan hasil pencarian atau terjadi kesalahan pada API.'
                }, { quoted: m });
            }

            let teks = `*[ HASIL YOUTUBE SEARCH ]*\n\nPencarian: *${query}*\n\n`;

            data.result.slice(0, 10).forEach((vid, i) => {
                teks += `${i + 1}. *${vid.title}*\n`;
                teks += `   ├ Channel: ${vid.channel}\n`;
                teks += `   ├ Durasi: ${vid.duration}\n`;
                teks += `   └ Link: ${vid.link}\n\n`;
            });

            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('Error YouTube Search:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Terjadi kesalahan saat menghubungi API. Coba lagi nanti.'
            }, { quoted: m });
        }
    }
};
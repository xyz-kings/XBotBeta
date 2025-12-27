// File: plugin/search/Fdroid.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['fdroidsrch'], // Hanya satu command: .fdroidsrch
    ownerOnly: false,
    limit: true,
    tags: 'search',
    help: ['fdroidsrch <keyword>'],
    description: 'Mencari aplikasi di F-Droid',

    async execute(bot, m, args) {
        const query = args.join(' ').trim();

        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Pakai format: ${config.prefix}fdroidsrch <keyword>\n\nContoh: ${config.prefix}fdroidsrch termux`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang cari di F-Droid...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/fdroid`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();

            if (!data.status || !data.result || data.result.length === 0) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Nihil hasil bree, coba keyword lain!'
                }, { quoted: m });
            }

            let teks = `*[ HASIL F-DROID SEARCH ]*\n\nPencarian: *${query}*\n\n`;

            data.result.slice(0, 15).forEach((app, i) => {
                const name = app.name.trim();
                const desc = app.description.trim();
                const license = app.license || 'Unknown';
                const link = app.link;

                teks += `${i + 1}. *${name}*\n`;
                teks += `   ├ Deskripsi: ${desc}\n`;
                teks += `   ├ Lisensi: ${license}\n`;
                teks += `   └ ${link}\n\n`;
            });

            teks += `💡 Klik link di atas untuk halaman F-Droid resmi!\n`;
            teks += `   Semua app open-source & gratis!\n`;
            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('[FDROID SEARCH] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ API lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};
// File: plugin/random/BlueArchive.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['bluearchive'], // Bisa .bluearchive atau .ba
    ownerOnly: false,
    limit: true,
    tags: 'random', // Masuk kategori random
    help: ['bluearchive'],
    description: 'Random gambar Blue Archive',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang ambil gambar Blue Archive...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/random/ba?apikey=${config.apiKey}`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('API response not ok');
            }

            const buffer = await res.buffer();

            await bot.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `💙 *Random Blue Archive*\n\n${config.copyright || ''}`
            }, { quoted: m });

        } catch (error) {
            console.error('[BLUE ARCHIVE RANDOM] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Yahh gambarnya lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};
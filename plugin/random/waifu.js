// File: plugin/random/Waifu.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['waifu'], // Command singkat: .waifu
    ownerOnly: false,
    limit: true,
    tags: 'random',
    help: ['waifu'],
    description: 'Random gambar waifu',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Lagi cari waifu terbaik buat kamu...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/random/waifu?apikey=${config.apiKey}`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('API response not ok');
            }

            const buffer = await res.buffer();

            await bot.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `💖 *Random Waifu*\n\nWaifu hari ini spesial buat kamu~ ✨\n\n${config.copyright || ''}`
            }, { quoted: m });

        } catch (error) {
            console.error('[WAIFU RANDOM] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Waifunya lagi malu-malu bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};
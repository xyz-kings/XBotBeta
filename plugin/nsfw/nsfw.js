// File: plugin/random/Nsfw.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['nsfw'], // Command singkat: .nsfw
    ownerOnly: false,
    limit: true,
    tags: 'random',
    help: ['nsfw'],
    description: 'Random gambar NSFW (18+)',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { text: '🔞 Sedang ambil konten NSFW...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/random/nsfw?apikey=${config.apiKey}`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('API response not ok');
            }

            const buffer = await res.buffer();

            await bot.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `🔞 *Random NSFW*\n\nKonten 18+ only!\nJangan lupa minum air putih ya bree 😏\n\n${config.copyright || ''}`
            }, { quoted: m });

        } catch (error) {
            console.error('[NSFW RANDOM] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Konten NSFW lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};
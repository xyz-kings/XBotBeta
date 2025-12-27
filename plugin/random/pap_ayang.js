// File: plugin/random/PapAyang.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['pap_ayng'], // Command singkat: .papayang
    ownerOnly: false,
    limit: true,
    tags: 'random',
    help: ['pap_ayng'],
    description: 'Random pap ayang',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Lagi cari pap ayang buat kamu...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/random/papayang?apikey=${config.apiKey}`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('API response not ok');
            }

            const buffer = await res.buffer();

            await bot.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `💕 *Pap Ayang Random*\n\nBuat yang lagi kangen ayang~ 🫶\n\n${config.copyright || ''}`
            }, { quoted: m });

        } catch (error) {
            console.error('[PAP AYANG RANDOM] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Yahh pap ayangnya lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};
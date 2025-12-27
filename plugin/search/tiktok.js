// File: plugin/search/Tiktok.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['ttsrch'], // Hanya satu command: .ttsrch
    ownerOnly: false,
    limit: true,
    tags: 'search',
    help: ['ttsrch <keyword>'],
    description: 'Mencari video di TikTok',

    async execute(bot, m, args) {
        const query = args.join(' ').trim();

        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Pakai format: ${config.prefix}ttsrch <keyword>\n\nContoh: ${config.prefix}ttsrch doksil`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang cari di TikTok...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/tiktok`;
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

            let teks = `*[ TIKTOK SEARCH ]*\n\nPencarian: *${query}*\n\n`;

            data.result.slice(0, 5).forEach((vid, i) => {
                const title = vid.title.trim() || '(Tanpa judul)';
                const author = vid.author.nickname || vid.author.unique_id || 'Unknown';
                const username = vid.author.unique_id || 'tiktok';
                const videoId = vid.video_id || vid.id;

                const link = `https://www.tiktok.com/@${username}/video/${videoId}`;

                const playCount = vid.play_count.toLocaleString('id-ID');
                const likeCount = vid.digg_count.toLocaleString('id-ID');
                const duration = vid.duration ? `${vid.duration}s` : '-';

                teks += `${i + 1}. *${title}*\n`;
                teks += `   ├ Creator: @${author}\n`;
                teks += `   ├ Views: ${playCount} | ❤️ ${likeCount}\n`;
                teks += `   ├ Durasi: ${duration}\n`;
                teks += `   └ ${link}\n\n`;
            });

            teks += `💡 Buka link di atas langsung di TikTok app/browser!\n`;
            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('[TTSEARCH] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ API lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};
// File: plugin/search/Npm.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['npmsrch'], // Hanya satu command: .npmsrch
    ownerOnly: false,
    limit: true,
    tags: 'search',
    help: ['npmsrch <keyword>'],
    description: 'Mencari package di NPM',

    async execute(bot, m, args) {
        const query = args.join(' ').trim();

        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Pakai format: ${config.prefix}npmsrch <keyword>\n\nContoh: ${config.prefix}npmsrch baileys`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang cari package di NPM...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/npm`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();

            if (!data.status || !data.result || data.result.length === 0) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Nihil hasil package bree, coba keyword lain!'
                }, { quoted: m });
            }

            let teks = `*[ HASIL NPM SEARCH ]*\n\nPencarian: *${query}*\n\n`;

            data.result.slice(0, 15).forEach((pkg, i) => {
                const title = pkg.title.trim();
                const author = pkg.author || 'Unknown';
                const monthly = pkg.download?.monthly ? pkg.download.monthly.toLocaleString('id-ID') : '0';
                const weekly = pkg.download?.weekly ? pkg.download.weekly.toLocaleString('id-ID') : '0';
                const updated = pkg.update ? new Date(pkg.update).toLocaleDateString('id-ID') : '-';
                const npmLink = pkg.links?.npm || '#';

                teks += `${i + 1}. *${title}*\n`;
                teks += `   ├ Author: ${author}\n`;
                teks += `   ├ Download: ${monthly}/bln | ${weekly}/mgg\n`;
                teks += `   ├ Update: ${updated}\n`;
                teks += `   └ ${npmLink}\n\n`;
            });

            teks += `💡 Klik link NPM untuk detail & install!\n`;
            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('[NPM SEARCH] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ API lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};
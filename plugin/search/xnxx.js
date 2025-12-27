// File: plugin/search/Xnxx.js

const fetch = require('node-fetch');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');

const GROUP_DB_PATH = path.resolve('./DataDase/intro_grup/intro_data.json');
const USER_DB_PATH = path.resolve('./DataDase/Daftar/user_data.json');

function getUserAge(jid, groupJid = null) {
    let age = null;
    let name = 'User';

    // Prioritas 1: Cek database grup
    if (groupJid && fs.existsSync(GROUP_DB_PATH)) {
        try {
            const groupDb = JSON.parse(fs.readFileSync(GROUP_DB_PATH, 'utf-8'));
            if (groupDb[groupJid] && groupDb[groupJid][jid]) {
                const data = groupDb[groupJid][jid];
                age = parseInt(data.age, 10);
                name = data.name || 'User';
                return { age, name };
            }
        } catch (e) {
            console.error('Error baca database grup:', e);
        }
    }

    // Prioritas 2: Cek database pribadi
    if (fs.existsSync(USER_DB_PATH)) {
        try {
            const userDb = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf-8'));
            if (userDb[jid]) {
                age = parseInt(userDb[jid].age, 10);
                name = userDb[jid].name || 'User';
                return { age, name };
            }
        } catch (e) {
            console.error('Error baca database pribadi:', e);
        }
    }

    return { age: null, name };
}

module.exports = {
    command: ['xnxxsrc'],
    ownerOnly: false,
    limit: true,
    tags: 'search',
    help: ['xnxxsrc <keyword>'],
    description: 'Mencari video dewasa di XNXX (18+)',

    async execute(bot, m, args) {
        const query = args.join(' ').trim();
        const senderJid = m.key.participant || m.key.remoteJid;
        const isGroup = m.key.remoteJid.endsWith('@g.us');
        const groupJid = isGroup ? m.key.remoteJid : null;

        console.log(`[XNXX] Command dari ${senderJid} | Query: "${query}"`);

        // Kalau tidak ada query
        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Masukkan keyword dulu coy!\nContoh: ${config.prefix}xnxxsrc japanese`
            }, { quoted: m });
        }

        // Cek data umur
        const user = getUserAge(senderJid, groupJid);

        if (user.age === null) {
            console.log(`[XNXX] ${senderJid} belum terdaftar`);
            return bot.sendMessage(m.key.remoteJid, {
                text: `⚠️ Kamu belum punya data umur!\n\nDaftar dulu pakai:\n${config.prefix}daftar <nama> <umur> <kota> <zodiac> <gender> <hobby>\n\nContoh: ${config.prefix}daftar Budi 19 Jakarta Leo Male Gaming`
            }, { quoted: m });
        }

        // Kalau umur < 18 → blokir dengan pesan random
        if (user.age < 18) {
            console.log(`[XNXX] ${senderJid} umur ${user.age} → diblokir`);
            const yearsLeft = 18 - user.age;

            const randomMessages = [
                `Waduh ${user.name}, umurmu baru ${user.age} tahun. Masih bocil banget nih. Tunggu ${yearsLeft} tahun lagi ya kalau mau liat yang beginian. Fokus ngejar mimpi dulu, nanti juga kesampaian kok 😏`,
                `Eits ${user.name}, deteksi bocil! Umur ${user.age} belum cukup buat konten dewasa. Sabar ya, ${yearsLeft} tahun lagi baru boleh main di sini. Sekarang mending belajar atau main game aja dulu! 🎮`,
                `Haha ${user.name} ketahuan umurnya ${user.age}! Masih jauh dari 18. Tunggu ${yearsLeft} tahun lagi dek, jangan buru-buru dewasa. Nikmatin masa remaja yang polos ini dulu 🤭`,
                `Maaf ya ${user.name}, umur ${user.age} tahun belum boleh masuk zona dewasa. Kurang ${yearsLeft} tahun lagi. Sabar ya, daripada nyari yang gini mending ngejar rank di game atau belajar skill baru! 💪`,
                `Woi ${user.name}, bocil mode activated! Umur ${user.age} belum legal buat konten 18+. Tunggu ${yearsLeft} tahun lagi bro, sekarang waktunya ngejar prestasi, bukan ngejar yang gituan 😆`,
                `Eh ${user.name}, umurmu baru ${user.age}? Masih imut-imut nih. ${yearsLeft} tahun lagi baru boleh main di sini. Sekarang mending tidur cukup, makan sehat, belajar rajin. Nanti dewasa sendiri kok 😌`,
                `Yah ${user.name}, umur ${user.age} masih dikategorikan bocil. Kurang ${yearsLeft} tahun buat akses fitur ini. Santai aja, nikmati masa muda yang bebas stres. Nanti juga datang waktunya sendiri 😉`,
                `Stop dulu ${user.name}! Umur ${user.age} belum cukup. Tunggu ${yearsLeft} tahun lagi ya. Daripada mikirin yang dewasa-dewasa, mending mikirin masa depan yang cerah dulu! 🌟`,
                `Hahaha ${user.name} ketangkep basah! Umur ${user.age} tahun masih jauh dari 18. Sabar ya dek, ${yearsLeft} tahun lagi baru boleh nyoba. Sekarang waktunya ngejar mimpi, bukan ngejar yang aneh-aneh 🤫`,
                `Waduh ${user.name}, sistem deteksi umur bilang kamu baru ${user.age} tahun. Kurang ${yearsLeft} tahun nih. Mending sekarang fokus sekolah/kuliah atau hobi positif. Nanti juga kebagian jatah dewasanya kok 😏`,
                `Ups ${user.name}, umur ${user.age} belum lolos sensor 18+. Tunggu ${yearsLeft} tahun lagi ya. Gunakan waktu ini buat upgrade diri, biar nanti pas dewasa udah siap tempur! 🔥`,
                `Tenang ${user.name}, umur ${user.age} masih terlalu polos buat konten ini. ${yearsLeft} tahun lagi baru dibuka aksesnya. Sekarang nikmati aja masa remaja yang bebas dan penuh petualangan! 🚀`,
            ];

            const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
            return bot.sendMessage(m.key.remoteJid, { text: msg }, { quoted: m });
        }

        // Kalau umur cukup → langsung proses pencarian
        console.log(`[XNXX] ${senderJid} umur ${user.age} → diizinkan`);

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang mencari di XNXX...\n⚠️ Konten dewasa (18+ only)' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/xnxx`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();

            if (!data.status || !data.result || data.result.length === 0) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Nihil hasil atau API lagi error. Coba keyword lain ya.'
                }, { quoted: m });
            }

            let teks = `*[ HASIL XNXX - 18+ ]*\n\nPencarian: *${query}*\n\n`;

            data.result.slice(0, 10).forEach((vid, i) => {
                const cleanInfo = vid.info.replace(/\n/g, ' ').trim();
                teks += `${i + 1}. *${vid.title}*\n`;
                teks += `   ├ Info: ${cleanInfo}\n`;
                teks += `   └ Link: ${vid.link}\n\n`;
            });

            teks += `*Peringatan:* Hanya untuk 18+ tahun!\n`;
            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('[XNXX] Error API:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Yahh error nih, coba lagi nanti ya. API lagi ngambek.'
            }, { quoted: m });
        }
    }
};
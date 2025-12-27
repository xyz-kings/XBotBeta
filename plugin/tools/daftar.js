// File: plugin/tools/Daftar.js

const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const GROUP_DB_PATH = path.resolve('./DataDase/intro_grup/intro_data.json');
const USER_DB_PATH = path.resolve('./DataDase/Daftar/user_data.json');

// Pastikan folder dan file ada
if (!fs.existsSync(path.dirname(USER_DB_PATH))) {
    fs.mkdirSync(path.dirname(USER_DB_PATH), { recursive: true });
}
if (!fs.existsSync(USER_DB_PATH)) {
    fs.writeFileSync(USER_DB_PATH, '{}', 'utf-8');
}

module.exports = {
    command: ['daftar'], // Hidden command (tidak muncul di menu)
    hidden: true, // TAMBAHKAN INI
    ownerOnly: false,
    limit: false,
    tags: 'tools',
    description: 'Mendaftarkan user ke database',

    async execute(bot, m, args) {
        if (args.length < 6) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Format salah!\n\nCara daftar:\n${config.prefix}daftar <nama> <umur> <asalkota> <zodiac> <gender> <hobby>\n\nContoh:\n${config.prefix}daftar Budi 20 Bandung Virgo Male Nonton film, Coding`
            }, { quoted: m });
        }

        const [name, age, city, zodiac, gender, ...hobbyParts] = args;
        const hobby = hobbyParts.join(' ');
        const jid = m.key.participant || m.key.remoteJid;
        const groupJid = m.key.remoteJid.endsWith('@g.us') ? m.key.remoteJid : null;

        if (isNaN(age) || parseInt(age) < 13) {
            return bot.sendMessage(m.key.remoteJid, { text: '❌ Umur tidak valid! Minimal 13 tahun.' }, { quoted: m });
        }

        // Cek apakah user sudah terdaftar di database grup
        if (groupJid && fs.existsSync(GROUP_DB_PATH)) {
            try {
                const groupDb = JSON.parse(fs.readFileSync(GROUP_DB_PATH, 'utf-8'));
                if (groupDb[groupJid] && groupDb[groupJid][jid]) {
                    return bot.sendMessage(m.key.remoteJid, {
                        text: `❌ Kamu sudah terdaftar di database grup ini!\nData pribadi tidak bisa didaftarkan lagi karena kamu sudah punya data di grup.`
                    }, { quoted: m });
                }
            } catch (e) {
                console.error('Error reading group DB:', e);
            }
        }

        // Cek apakah sudah ada di database pribadi
        try {
            const userDb = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf-8'));
            if (userDb[jid]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: `✅ Data anda telah tersimpan sebelumnya!\n\nGunakan ${config.prefix}cekdata untuk melihat data kamu.\nAtau ${config.prefix}reset_data jika ingin mengganti data.`
                }, { quoted: m });
            }

            // Simpan data baru
            userDb[jid] = {
                name,
                age: parseInt(age),
                city,
                zodiac,
                gender,
                hobby,
                createdAt: new Date().toLocaleString('id-ID'),
                updatedAt: new Date().toLocaleString('id-ID')
            };

            fs.writeFileSync(USER_DB_PATH, JSON.stringify(userDb, null, 2), 'utf-8');

            await bot.sendMessage(m.key.remoteJid, {
                text: `✅ Berhasil terdaftar!\n\nNama: ${name}\nUmur: ${age} tahun\nAsal: ${city}\nZodiac: ${zodiac}\nGender: ${gender}\nHobby: ${hobby}\n\nSekarang kamu bisa akses fitur dewasa jika umur ≥18 😏`
            }, { quoted: m });
        } catch (error) {
            console.error('Error saving daftar:', error);
            await bot.sendMessage(m.key.remoteJid, { text: '❌ Gagal menyimpan data. Coba lagi.' }, { quoted: m });
        }
    }
};
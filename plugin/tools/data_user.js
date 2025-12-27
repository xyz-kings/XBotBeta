// File: plugin/tools/cekdata.js

const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const USER_DB_PATH = path.resolve('./DataDase/Daftar/user_data.json');

module.exports = {
    command: ['cekdata', 'reset_data'], // Hidden commands
    hidden: true, // TAMBAHKAN INI
    ownerOnly: false,
    limit: false,
    tags: 'tools',
    description: 'Cek dan reset data user',

    async execute(bot, m, args) {
        const jid = m.key.participant || m.key.remoteJid;
        const command = args[0] || '';
        
        if (!fs.existsSync(USER_DB_PATH)) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Database tidak ditemukan.\nSilakan daftar dulu dengan ${config.prefix}daftar`
            }, { quoted: m });
        }

        try {
            const userDb = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf-8'));
            
            // Cek apakah user punya data
            if (!userDb[jid]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: `❌ Anda belum terdaftar!\nSilakan daftar dengan ${config.prefix}daftar`
                }, { quoted: m });
            }

            const userData = userDb[jid];
            
            // Command cekdata
            if (m.text.includes('cekdata')) {
                await bot.sendMessage(m.key.remoteJid, {
                    text: `📋 *DATA ANDA*\n\n` +
                          `👤 Nama: ${userData.name}\n` +
                          `🎂 Umur: ${userData.age} tahun\n` +
                          `🏙️ Asal: ${userData.city}\n` +
                          `♊ Zodiac: ${userData.zodiac}\n` +
                          `👫 Gender: ${userData.gender}\n` +
                          `🎯 Hobby: ${userData.hobby}\n\n` +
                          `📅 Didaftarkan: ${userData.createdAt}\n` +
                          `🔄 Terakhir update: ${userData.updatedAt}\n\n` +
                          `Gunakan ${config.prefix}reset_data untuk mengubah data`
                }, { quoted: m });
            }
            
            // Command reset_data
            else if (m.text.includes('reset_data')) {
                // Hapus data user
                delete userDb[jid];
                fs.writeFileSync(USER_DB_PATH, JSON.stringify(userDb, null, 2), 'utf-8');
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: `✅ Data berhasil direset!\n\n` +
                          `Data anda telah dihapus dari database.\n` +
                          `Silakan daftar ulang dengan ${config.prefix}daftar`
                }, { quoted: m });
            }
            
        } catch (error) {
            console.error('Error accessing database:', error);
            await bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Gagal mengakses database. Coba lagi nanti.' 
            }, { quoted: m });
        }
    }
};
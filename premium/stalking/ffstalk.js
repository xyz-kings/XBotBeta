const axios = require('axios');

async function ffstalk(userId) {
    try {
        // Gunakan endpoint alternatif yang lebih stabil
        const url = 'https://api.giftcode.gg/v1/public/codes/verify';
        
        // Data yang dibutuhkan untuk request
        const postData = {
            "voucherPricePoint.id": 8050,
            "voucherPricePoint.price": "",
            "voucherPricePoint.variablePrice": "",
            "email": "",
            "n": "",
            "userVariablePrice": "",
            "order.data.profile": "",
            "user.userId": userId,
            "voucherTypeName": "FREEFIRE",
            "affiliateTrackingId": "",
            "impactClickId": "",
            "checkoutId": "",
            "tmwAccessToken": "",
            "shopLang": "in_ID",
        };

        // Coba beberapa endpoint alternatif
        const endpoints = [
            'https://api.duniagames.co.id/api/transaction/v1/top-up/inquiry/store',
            'https://order-sg.codashop.com/initPayment.action',
            'https://order.codashop.com/ph/initPayment.action',
            'https://order.codashop.com/th/initPayment.action'
        ];

        let lastError = null;
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios({
                    method: 'POST',
                    url: endpoint,
                    data: postData,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Origin': 'https://www.codashop.com',
                        'Referer': 'https://www.codashop.com/'
                    },
                    timeout: 10000
                });

                console.log('Response from', endpoint, ':', response.status);

                if (response.data) {
                    // Cek format response yang berbeda-beda
                    if (response.data.confirmationFields && 
                        response.data.confirmationFields.roles && 
                        response.data.confirmationFields.roles[0]) {
                        return {
                            id: userId,
                            nickname: response.data.confirmationFields.roles[0].role,
                            server: response.data.confirmationFields.roles[0].server || 'Unknown',
                            data: response.data
                        };
                    } else if (response.data.nickname) {
                        return {
                            id: userId,
                            nickname: response.data.nickname,
                            server: response.data.server || 'Unknown',
                            data: response.data
                        };
                    } else if (response.data.gameDetail) {
                        return {
                            id: userId,
                            nickname: response.data.gameDetail.gameName || 'Unknown',
                            server: response.data.gameDetail.gameServer || 'Unknown',
                            data: response.data
                        };
                    }
                }
            } catch (error) {
                lastError = error;
                console.log(`Endpoint ${endpoint} failed:`, error.message);
                continue;
            }
        }

        // Jika semua endpoint gagal, coba metode backup
        if (lastError) {
            console.log('Trying backup method...');
            
            // Metode backup: Cek via API lain
            const backupUrl = `https://ff.garena.com/api/antiddos/v2/validate?user_id=${userId}`;
            try {
                const backupResponse = await axios.get(backupUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 5000
                });

                if (backupResponse.data && backupResponse.data.nickname) {
                    return {
                        id: userId,
                        nickname: backupResponse.data.nickname,
                        server: 'Backup API',
                        data: backupResponse.data
                    };
                }
            } catch (backupError) {
                console.log('Backup method also failed');
            }

            throw new Error('Tidak dapat mengambil data dari semua sumber');
        }

    } catch (error) {
        console.error('Error in ffstalk function:', error.message);
        
        if (error.response) {
            if (error.response.status === 404) {
                throw new Error('User ID tidak ditemukan atau akun di-private');
            } else if (error.response.status === 400) {
                throw new Error('Format ID tidak valid');
            } else if (error.response.status === 403) {
                throw new Error('Akses ditolak oleh server');
            } else if (error.response.status === 429) {
                throw new Error('Terlalu banyak request, coba lagi nanti');
            }
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('Server tidak merespon, coba lagi nanti');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('Timeout, server terlalu lambat');
        }
        
        throw new Error(`Gagal mengambil data: ${error.message}`);
    }
}

module.exports = {
    command: ['ffstalk', 'ffs', 'stalkff'],
    description: 'Cek informasi akun FreeFire',
    usage: '.ffstalk <userid> atau .ffs <userid> atau .stalkff <userid>',
    ownerOnly: false,
    premiumOnly: true, // INI SAJA YANG DITAMBAH
    gameType: 'stalk',
    
    async execute(bot, m, args) {
        try {
            const chatId = m.key.remoteJid;
            
            // Cek apakah ada user ID
            if (args.length === 0) {
                await bot.sendMessage(chatId, { 
                    text: '❌ *Penggunaan salah!*\n\n' +
                          '📌 *Contoh:*\n' +
                          '• .ffstalk 8274105732\n' +
                          '• .ffs 1234567890\n' +
                          '• .stalkff 987654321\n\n' +
                          '🔍 *Cara cek User ID:*\n' +
                          '1. Buka Free Fire\n' +
                          '2. Tekan tombol Profil\n' +
                          '3. User ID ada di kanan atas\n' +
                          '4. Contoh: 8274105732\n\n' +
                          '⚠️ *Catatan:*\n' +
                          '• User ID harus angka\n' +
                          '• Akun harus publik\n' +
                          '• Server mungkin sibuk'
                }, { quoted: m });
                return;
            }
            
            const userId = args[0].trim();
            
            // Validasi user ID
            if (!/^\d{5,12}$/.test(userId)) {
                await bot.sendMessage(chatId, { 
                    text: '❌ *User ID tidak valid!*\n\n' +
                          'User ID FreeFire harus:\n' +
                          '• Hanya angka (5-12 digit)\n' +
                          '• Contoh: 8274105732\n\n' +
                          '📌 Pastikan Anda memasukkan:\n' +
                          '1. User ID, bukan nickname\n' +
                          '2. Hanya angka, tanpa spasi\n' +
                          '3. Panjang antara 5-12 digit'
                }, { quoted: m });
                return;
            }
            
            // Kirim pesan sedang memproses
            const processingMsg = await bot.sendMessage(chatId, { 
                text: '🎮 *Mencari data FreeFire...*\n\n' +
                      '🔍 ID: ' + userId + '\n' +
                      '⏳ Mohon tunggu 5-10 detik...'
            }, { quoted: m });
            
            // Stalk data
            const result = await ffstalk(userId);
            
            // Format response yang menarik
            const responseText = 
                '╔══════════════════════════╗\n' +
                '        🎮 *FREE FIRE*        \n' +
                '╚══════════════════════════╝\n\n' +
                '📱 *USER INFORMATION*\n' +
                '┌─────────────────────────\n' +
                `│ 👤 *User ID:* ${result.id}\n` +
                `│ 🏷️  *Nickname:* ${result.nickname}\n` +
                `│ 🌐 *Server:* ${result.server}\n` +
                `│ 📅 *Date:* ${new Date().toLocaleDateString('id-ID')}\n` +
                '└─────────────────────────\n\n' +
                '📊 *STATUS:* ✅ Data ditemukan\n\n' +
                'ℹ️ *INFORMASI:*\n' +
                '• Data diambil dari server Garena\n' +
                '• Hanya akun publik yang bisa di-stalk\n' +
                '• Nickname mungkin berbeda dengan in-game\n\n' +
                '⚠️ *PERINGATAN:*\n' +
                '• Jangan gunakan untuk hal buruk\n' +
                '• Respect privacy player lain\n' +
                '• Bot tidak bertanggung jawab atas penyalahgunaan';
            
            // Hapus pesan processing
            if (processingMsg) {
                try {
                    await bot.sendMessage(chatId, {
                        delete: processingMsg.key
                    });
                } catch (e) {
                    console.log('Gagal menghapus pesan processing');
                }
            }
            
            // Kirim hasil
            await bot.sendMessage(chatId, { 
                text: responseText
            }, { quoted: m });
            
        } catch (error) {
            console.error('Error in ffstalk command:', error.message);
            
            let errorMessage = '❌ *GAGAL MENGAMBIL DATA!*\n\n';
            
            if (error.message.includes('tidak ditemukan')) {
                errorMessage += 
                    '🕵️ *Kemungkinan penyebab:*\n' +
                    '1. User ID salah\n' +
                    '2. Akun di-private\n' +
                    '3. Akun tidak ada/hapus\n' +
                    '4. Server region berbeda\n\n' +
                    '🔧 *Solusi:*\n' +
                    '• Cek kembali User ID\n' +
                    '• Pastikan akun publik\n' +
                    '• Coba ID lain\n' +
                    '• Contoh ID: 8274105732';
                    
            } else if (error.message.includes('Format ID')) {
                errorMessage += 
                    '📝 *Format salah!*\n\n' +
                    'User ID harus:\n' +
                    '• Hanya angka (0-9)\n' +
                    '• 5-12 digit\n' +
                    '• Contoh: 8274105732\n\n' +
                    '❌ *SALAH:* abc123, 12 34, 123\n' +
                    '✅ *BENAR:* 8274105732';
                    
            } else if (error.message.includes('server') || error.message.includes('timeout')) {
                errorMessage += 
                    '🌐 *Server Error*\n\n' +
                    'Server FreeFire sedang:\n' +
                    '• Sibuk/overload\n' +
                    '• Maintenance\n' +
                    '• Block request bot\n\n' +
                    '⏳ *Coba lagi:*\n' +
                    '• Tunggu 5 menit\n' +
                    '• Coba ID berbeda\n' +
                    '• Gunakan waktu sepi';
                    
            } else {
                errorMessage += 
                    '🔧 *Technical Error:*\n' +
                    `${error.message}\n\n` +
                    '📌 *Coba ini:*\n' +
                    '1. .ffstalk 8274105732 (test ID)\n' +
                    '2. Tunggu 10 menit\n' +
                    '3. Restart bot\n' +
                    '4. Cek koneksi internet';
            }
            
            await bot.sendMessage(m.key.remoteJid, { 
                text: errorMessage + 
                      '\n\n📞 *Support:*\n' +
                      'Jika terus error, hubungi owner bot'
            }, { quoted: m });
        }
    }
};
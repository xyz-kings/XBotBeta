/**
 * JID Converter Helper
 * Mengonversi JID dari format baru ke format lama
 * Contoh: 139904751247575@lid -> 62877xxxx@s.whatsapp.net
 */

class JIDConverter {
    /**
     * Konversi JID ke format lama
     * @param {string} jid - JID dalam format baru (contoh: 139904751247575@lid)
     * @returns {string|null} JID dalam format lama atau null jika gagal
     */
    static convertToOldFormat(jid) {
        if (!jid || typeof jid !== 'string') {
            console.error('❌ JID tidak valid:', jid);
            return null;
        }

        try {
            // Cek apakah sudah format lama
            if (jid.includes('@s.whatsapp.net') || jid.includes('@g.us')) {
                return jid;
            }

            // Pisahkan nomor dan domain
            const [numberPart, domain] = jid.split('@');
            
            if (!numberPart || !domain) {
                console.error('❌ Format JID tidak dikenali:', jid);
                return null;
            }

            // Handle berbagai format domain
            switch(domain) {
                case 'lid': // LID (Light ID)
                case 'c.us': // Contact
                case 's.whatsapp.net': // Standard WhatsApp
                    return this.convertLIDToOldFormat(numberPart);
                    
                case 'g.us': // Group
                    return jid; // Format group sudah benar
                    
                case 'broadcast': // Broadcast
                    return jid; // Format broadcast sudah benar
                    
                default:
                    console.warn(`⚠️ Domain tidak dikenali: ${domain}, menggunakan default conversion`);
                    return this.convertLIDToOldFormat(numberPart);
            }
        } catch (error) {
            console.error('❌ Error converting JID:', error, jid);
            return null;
        }
    }

    /**
     * Konversi LID (Light ID) ke format lama
     * @param {string} lidNumber - Nomor LID (contoh: 139904751247575)
     * @returns {string} JID format lama
     */
    static convertLIDToOldFormat(lidNumber) {
        if (!lidNumber || typeof lidNumber !== 'string') {
            return null;
        }

        // Hapus semua karakter non-digit
        const cleanNumber = lidNumber.replace(/\D/g, '');
        
        if (cleanNumber.length < 10) {
            console.error('❌ Nomor terlalu pendek:', cleanNumber);
            return null;
        }

        let phoneNumber = cleanNumber;
        
        // Jika diawali dengan kode negara (tanpa +)
        if (cleanNumber.startsWith('1')) {
            // Format US/Canada: 1XXXXXXXXXX -> XXXXXXXXXX@s.whatsapp.net
            phoneNumber = cleanNumber;
        } else if (cleanNumber.startsWith('62')) {
            // Format Indonesia: 628XXXXXXXXXX -> 628XXXXXXXXXX@s.whatsapp.net
            phoneNumber = cleanNumber;
        } else if (cleanNumber.startsWith('0')) {
            // Format lokal Indonesia: 08XXXXXXXX -> 628XXXXXXXX@s.whatsapp.net
            phoneNumber = '62' + cleanNumber.substring(1);
        } else if (cleanNumber.length >= 12) {
            // Format WhatsApp Business mungkin panjang
            // Ambil 10-15 digit terakhir
            phoneNumber = cleanNumber.substring(cleanNumber.length - 15);
        }

        // Tambahkan domain WhatsApp
        return `${phoneNumber}@s.whatsapp.net`;
    }

    /**
     * Konversi JID ke nomor telepon saja (tanpa domain)
     * @param {string} jid - JID dalam format apapun
     * @returns {string|null} Nomor telepon saja
     */
    static extractPhoneNumber(jid) {
        if (!jid) return null;

        const converted = this.convertToOldFormat(jid);
        if (!converted) return null;

        // Pisahkan nomor dari domain
        const [phoneNumber] = converted.split('@');
        return phoneNumber;
    }

    /**
     * Konversi multiple JID sekaligus
     * @param {string[]} jids - Array of JIDs
     * @returns {Object} Object dengan hasil konversi
     */
    static convertMultiple(jids) {
        if (!Array.isArray(jids)) {
            console.error('❌ Input harus array');
            return { success: false, error: 'Input harus array', converted: {} };
        }

        const results = {
            success: true,
            total: jids.length,
            converted: {},
            failed: []
        };

        jids.forEach(jid => {
            const converted = this.convertToOldFormat(jid);
            if (converted) {
                results.converted[jid] = converted;
            } else {
                results.failed.push(jid);
                results.success = false;
            }
        });

        results.successCount = Object.keys(results.converted).length;
        results.failedCount = results.failed.length;

        return results;
    }

    /**
     * Validasi JID
     * @param {string} jid - JID yang akan divalidasi
     * @returns {Object} Hasil validasi
     */
    static validateJID(jid) {
        const result = {
            isValid: false,
            original: jid,
            converted: null,
            type: 'unknown',
            error: null
        };

        try {
            if (!jid) {
                result.error = 'JID kosong';
                return result;
            }

            // Coba konversi
            const converted = this.convertToOldFormat(jid);
            if (!converted) {
                result.error = 'Gagal mengonversi JID';
                return result;
            }

            result.converted = converted;
            result.isValid = true;

            // Tentukan tipe JID
            if (converted.includes('@g.us')) {
                result.type = 'group';
            } else if (converted.includes('@s.whatsapp.net')) {
                result.type = 'user';
            } else if (converted.includes('@broadcast')) {
                result.type = 'broadcast';
            } else {
                result.type = 'other';
            }

            return result;
        } catch (error) {
            result.error = error.message;
            return result;
        }
    }

    /**
     * Format JID untuk display (menyembunyikan sebagian nomor)
     * @param {string} jid - JID
     * @returns {string} JID yang diformat untuk display
     */
    static formatForDisplay(jid) {
        const converted = this.convertToOldFormat(jid);
        if (!converted) return jid;

        const [number, domain] = converted.split('@');
        
        if (!number) return converted;

        // Sembunyikan sebagian nomor untuk privacy
        let maskedNumber;
        if (number.length > 8) {
            const prefix = number.substring(0, 4);
            const suffix = number.substring(number.length - 4);
            maskedNumber = `${prefix}****${suffix}`;
        } else {
            maskedNumber = number;
        }

        return `${maskedNumber}@${domain}`;
    }

    /**
     * Cek apakah JID adalah format baru (LID)
     * @param {string} jid - JID
     * @returns {boolean} true jika format baru
     */
    static isNewFormat(jid) {
        if (!jid || typeof jid !== 'string') return false;
        return jid.endsWith('@lid') || jid.endsWith('@c.us');
    }

    /**
     * Cek apakah JID adalah format lama
     * @param {string} jid - JID
     * @returns {boolean} true jika format lama
     */
    static isOldFormat(jid) {
        if (!jid || typeof jid !== 'string') return false;
        return jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us');
    }

    /**
     * Normalisasi JID (selalu return format lama)
     * @param {string} jid - JID dalam format apapun
     * @returns {string} JID dalam format lama
     */
    static normalize(jid) {
        return this.convertToOldFormat(jid) || jid;
    }
}

// Contoh penggunaan
if (require.main === module) {
    // Test cases
    const testJIDs = [
        '139904751247575@lid',
        '6287712345678@lid',
        '087712345678@c.us',
        '6287712345678@s.whatsapp.net',
        '12015550123@g.us',
        '1234567890@broadcast',
        'invalid-jid'
    ];

    console.log('🔧 Testing JID Converter:\n');

    testJIDs.forEach(jid => {
        console.log(`Input: ${jid}`);
        const result = JIDConverter.convertToOldFormat(jid);
        console.log(`Output: ${result}`);
        
        const validation = JIDConverter.validateJID(jid);
        console.log(`Valid: ${validation.isValid}, Type: ${validation.type}`);
        
        console.log(`Display: ${JIDConverter.formatForDisplay(jid)}`);
        console.log('─'.repeat(50));
    });

    // Test multiple conversion
    console.log('\n🧪 Testing multiple conversion:');
    const multiResult = JIDConverter.convertMultiple(testJIDs);
    console.log(`Success: ${multiResult.successCount}/${multiResult.total}`);
    console.log(`Failed: ${multiResult.failedCount}`);
}

module.exports = JIDConverter;
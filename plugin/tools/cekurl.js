const axios = require("axios");
const dns = require("dns").promises;
const urlParser = require("url");

// List domain phishing/malicious yang umum
const BLACKLISTED_DOMAINS = [
    'example-scam.com',
    'phishing-site.net',
    'malware-download.com',
    // Tambahkan domain berbahaya lainnya jika perlu
];

// List URL shortener
const URL_SHORTENERS = [
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'adf.ly',
    'shorte.st',
    'bc.vc',
    'bit.do',
    't.co',
    'tiny.cc',
    'url.ie',
    'clck.ru',
    'cutt.ly',
    'short.cm',
    'shrink.me',
    'kutt.it',
    'link.tl',
    'qr.net',
    'v.gd',
    'tr.im',
    'shorturl.at',
    'ow.ly',
    'rebrand.ly',
    'bl.ink',
    'polr.me',
    'tiny.pl',
    'short.to',
    'hmm.li',
    'rb.gy',
    's.id'
];

async function checkURL(url) {
    const results = {
        url: url,
        isAlive: false,
        statusCode: 0,
        statusText: '',
        contentType: '',
        finalUrl: url,
        redirects: 0,
        loadTime: 0,
        domain: '',
        ip: '',
        isShortened: false,
        isSuspicious: false,
        warnings: [],
        safetyScore: 100
    };

    try {
        // Parse URL
        const parsedUrl = urlParser.parse(url);
        results.domain = parsedUrl.hostname;
        
        // Cek format URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
            results.url = url;
            parsedUrl = urlParser.parse(url);
        }
        
        // Cek apakah URL shortener
        const domainLower = results.domain.toLowerCase();
        results.isShortened = URL_SHORTENERS.some(shortener => 
            domainLower.includes(shortener.toLowerCase())
        );
        
        // Cek domain blacklist
        if (BLACKLISTED_DOMAINS.some(blacklisted => 
            domainLower.includes(blacklisted.toLowerCase()))) {
            results.isSuspicious = true;
            results.warnings.push('⚠️ Domain termasuk dalam blacklist');
            results.safetyScore -= 50;
        }
        
        // Cek DNS
        try {
            const addresses = await dns.resolve4(results.domain);
            results.ip = addresses[0];
            
            // Cek IP private/localhost (bisa mencurigakan)
            if (results.ip.startsWith('192.168.') || 
                results.ip.startsWith('10.') || 
                results.ip.startsWith('172.16.') ||
                results.ip === '127.0.0.1') {
                results.warnings.push('⚠️ IP address adalah private/local');
                results.safetyScore -= 30;
            }
        } catch (dnsError) {
            results.warnings.push('⚠️ DNS lookup gagal');
            results.safetyScore -= 20;
        }
        
        // Cek dengan HTTP request
        const startTime = Date.now();
        try {
            const response = await axios.head(url, {
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 100 && status < 600; // Terima semua status code
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            results.loadTime = Date.now() - startTime;
            results.isAlive = true;
            results.statusCode = response.status;
            results.statusText = response.statusText;
            results.contentType = response.headers['content-type'] || 'unknown';
            results.finalUrl = response.request?.res?.responseUrl || url;
            
            // Hitung redirects
            if (response.request?._redirectable?._redirectCount) {
                results.redirects = response.request._redirectable._redirectCount;
            }
            
            // Analisis berdasarkan status code
            if (response.status >= 400) {
                results.warnings.push(`❌ HTTP Error ${response.status}`);
                results.safetyScore -= 20;
            }
            
            if (response.status >= 300 && response.status < 400) {
                results.warnings.push(`↪️ Redirect detected (${response.status})`);
                if (results.redirects > 3) {
                    results.warnings.push('⚠️ Terlalu banyak redirect');
                    results.safetyScore -= 10;
                }
            }
            
            // Cek header security
            const headers = response.headers;
            
            if (!headers['x-frame-options']) {
                results.warnings.push('⚠️ Tidak ada X-Frame-Options header');
                results.safetyScore -= 5;
            }
            
            if (!headers['x-content-type-options'] || 
                !headers['x-content-type-options'].includes('nosniff')) {
                results.warnings.push('⚠️ Tidak ada X-Content-Type-Options: nosniff');
                results.safetyScore -= 5;
            }
            
            // Cek SSL/TLS (untuk HTTPS)
            if (url.startsWith('https://')) {
                if (response.request?.res?.socket?._tlsOptions) {
                    // SSL check passed
                } else {
                    results.warnings.push('🔓 SSL/TLS mungkin tidak valid');
                    results.safetyScore -= 15;
                }
            } else {
                results.warnings.push('🔓 Menggunakan HTTP (tidak aman)');
                results.safetyScore -= 25;
            }
            
            // Cek content type mencurigakan
            if (results.contentType.includes('application/octet-stream') ||
                results.contentType.includes('application/x-msdownload')) {
                results.warnings.push('⚠️ File executable terdeteksi');
                results.isSuspicious = true;
                results.safetyScore -= 30;
            }
            
        } catch (httpError) {
            results.loadTime = Date.now() - startTime;
            results.warnings.push(`❌ HTTP Request failed: ${httpError.message}`);
            results.safetyScore -= 40;
        }
        
        // Analisis URL pattern
        const urlLower = url.toLowerCase();
        const suspiciousPatterns = [
            { pattern: /login\./i, reason: 'Mengandung kata "login"' },
            { pattern: /password\./i, reason: 'Mengandung kata "password"' },
            { pattern: /bank\./i, reason: 'Mengandung kata "bank"' },
            { pattern: /pay\./i, reason: 'Mengandung kata "pay"' },
            { pattern: /secure\./i, reason: 'Mengandung kata "secure"' },
            { pattern: /update\./i, reason: 'Mengandung kata "update"' },
            { pattern: /verify\./i, reason: 'Mengandung kata "verify"' },
            { pattern: /account\./i, reason: 'Mengandung kata "account"' },
            { pattern: /\.exe$/i, reason: 'File executable (.exe)' },
            { pattern: /\.zip$/i, reason: 'File archive (.zip)' },
            { pattern: /\.rar$/i, reason: 'File archive (.rar)' },
            { pattern: /@/i, reason: 'Mengandung karakter @' },
            { pattern: /ip=/i, reason: 'Mengandung parameter IP' },
            { pattern: /php$/i, reason: 'File PHP langsung' },
            { pattern: /\.js$/i, reason: 'File JavaScript langsung' }
        ];
        
        suspiciousPatterns.forEach(pattern => {
            if (pattern.pattern.test(urlLower)) {
                results.warnings.push(`🚩 ${pattern.reason}`);
                results.safetyScore -= 10;
            }
        });
        
        // Cek panjang URL (URL yang sangat panjang bisa mencurigakan)
        if (url.length > 200) {
            results.warnings.push('⚠️ URL sangat panjang');
            results.safetyScore -= 5;
        }
        
        // Normalize safety score
        results.safetyScore = Math.max(0, Math.min(100, results.safetyScore));
        
    } catch (error) {
        console.error('[URL CHECK ERROR]', error);
        results.warnings.push(`❌ Error: ${error.message}`);
        results.safetyScore = 0;
    }
    
    return results;
}

function getSafetyStatus(score) {
    if (score >= 80) return { emoji: '✅', text: 'AMAN', color: '🟢' };
    if (score >= 60) return { emoji: '⚠️', text: 'HATI-HATI', color: '🟡' };
    if (score >= 40) return { emoji: '🚩', text: 'MENcurigakan', color: '🟠' };
    return { emoji: '❌', text: 'BERBAHAYA', color: '🔴' };
}

module.exports = {
    command: ["cekurl", "checkurl", "urlcheck", "scanurl"],
    category: "utility",
    description: "Cek status dan keamanan URL",
    
    async execute(bot, m, args) {
        try {
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Cara penggunaan:* `.cekurl <URL>`\nContoh: `.cekurl https://google.com`"
                }, { quoted: m });
            }
            
            const urlInput = args.join(" ").trim();
            
            // Kirim status checking
            const loadingMsg = await bot.sendMessage(m.key.remoteJid, {
                text: `🔍 *Memeriksa URL...*\n\`\`\`${urlInput}\`\`\``
            }, { quoted: m });
            
            // Check URL
            const results = await checkURL(urlInput);
            const safety = getSafetyStatus(results.safetyScore);
            
            // Buat laporan
            let report = `*${safety.emoji}  HASIL PEMERIKSAAN URL  ${safety.emoji}*\n\n`;
            
            report += `📊 *STATUS:* ${safety.color} ${safety.text}\n`;
            report += `📈 *Safety Score:* ${results.safetyScore}/100\n\n`;
            
            report += `🔗 *URL:* ${results.finalUrl}\n`;
            report += `🌐 *Domain:* ${results.domain || 'Tidak ditemukan'}\n`;
            
            if (results.ip) {
                report += `📡 *IP Address:* ${results.ip}\n`;
            }
            
            report += `\n📊 *TECHNICAL DETAILS:*\n`;
            report += `   ${results.isAlive ? '✅' : '❌'} *Live:* ${results.isAlive ? 'Ya' : 'Tidak'}\n`;
            
            if (results.isAlive) {
                report += `   📋 *Status:* ${results.statusCode} ${results.statusText}\n`;
                report += `   🗂️ *Content-Type:* ${results.contentType}\n`;
                report += `   ⏱️ *Load Time:* ${results.loadTime}ms\n`;
                report += `   🔄 *Redirects:* ${results.redirects}x\n`;
            }
            
            report += `   🔗 *Shortened:* ${results.isShortened ? 'Ya ⚠️' : 'Tidak'}\n`;
            report += `   🚨 *Suspicious:* ${results.isSuspicious ? 'Ya ❌' : 'Tidak ✅'}\n`;
            
            // Tampilkan warnings
            if (results.warnings.length > 0) {
                report += `\n⚠️ *PERINGATAN:*\n`;
                results.warnings.forEach((warning, index) => {
                    report += `   ${index + 1}. ${warning}\n`;
                });
            } else {
                report += `\n✅ *Tidak ada peringatan terdeteksi*\n`;
            }
            
            // Rekomendasi
            report += `\n💡 *REKOMENDASI:*\n`;
            if (results.safetyScore >= 80) {
                report += `   ✅ URL terlihat aman untuk diakses\n`;
            } else if (results.safetyScore >= 60) {
                report += `   ⚠️ Berhati-hati saat mengakses URL ini\n`;
                report += `   👁️ Periksa kembali sebelum memasukkan data pribadi\n`;
            } else if (results.safetyScore >= 40) {
                report += `   🚩 URL ini mencurigakan!\n`;
                report += `   ❌ Hindari memasukkan informasi sensitif\n`;
                report += `   🔒 Gunakan VPN jika harus mengakses\n`;
            } else {
                report += `   ❌ URL BERBAHAYA!\n`;
                report += `   🛑 JANGAN AKSES URL INI!\n`;
                report += `   🚫 Blokir dan laporkan jika perlu\n`;
            }
            
            // Tips tambahan
            if (results.isShortened) {
                report += `\n🔗 *Tips URL Shortener:*\n`;
                report += `   • Gunakan preview tool untuk melihat URL asli\n`;
                report += `   • Hati-hati dengan shortener yang tidak dikenal\n`;
            }
            
            if (!urlInput.startsWith('https://')) {
                report += `\n🔓 *Tips Keamanan:*\n`;
                report += `   • Selalu gunakan HTTPS untuk koneksi aman\n`;
                report += `   • Periksa gembok (🔒) di address bar\n`;
            }
            
            report += `\n⏰ *Pemeriksaan selesai:* ${new Date().toLocaleTimeString('id-ID')}\n`;
            report += `_⚠️ Hasil ini berdasarkan analisis otomatis_`;
            
            // Hapus pesan loading
            await bot.sendMessage(m.key.remoteJid, {
                delete: loadingMsg.key
            });
            
            // Kirim laporan
            await bot.sendMessage(m.key.remoteJid, {
                text: report
            }, { quoted: m });
            
        } catch (err) {
            console.error("[CEKURL ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ *Terjadi kesalahan!*\n\nPastikan URL yang dimasukkan valid.\nContoh: `.cekurl https://google.com`"
            }, { quoted: m });
        }
    }
};
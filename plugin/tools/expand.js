const axios = require("axios");

// Definisikan shortener domains di luar fungsi agar bisa diakses
const shortenerDomains = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
    't.co', 'tiny.cc', 'short.cm', 'cutt.ly', 'rebrand.ly', 'bit.do',
    'shorte.st', 'adf.ly', 'bc.vc', 'clck.ru', 'v.gd', 'tr.im',
    'ow.ly', 'rb.gy', 's.id', 'shrinke.me', 'shorturl.at'
];

module.exports = {
    command: ["expandurl", "expand", "unshort", "unshorten"],
    category: "tools",
    description: "Buka shortlink menjadi URL asli dengan berbagai metode",
    
    async execute(bot, m, args) {
        try {
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: `🔗 *URL EXPANDER*\n\n*Cara pakai:* \`.expandurl <short-url>\`\n\n*Contoh:*\n\`.expandurl https://bit.ly/3abc123\`\n\`.expandurl https://tinyurl.com/xyz789\`\n\`.expandurl https://t.co/abc123\`\n\n*Fitur:*\n• Buka semua URL shortener\n• Tampilkan redirect chain\n• Analisis keamanan\n• Deteksi URL asli`
                }, { quoted: m });
            }
            
            let url = args[0].trim();
            
            // Validasi URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: `🔍 *Mengekspansi URL...*\n\n📌 *URL:* ${url}`
            }, { quoted: m });
            
            let finalUrl = url;
            let redirectCount = 0;
            let statusCode = 0;
            let errorMessage = null;
            let methodUsed = "Unknown";
            let source = "";
            
            // Daftar metode untuk mencoba expand URL
            const expansionMethods = [
                {
                    name: "Axios with Custom Headers",
                    func: async (targetUrl) => {
                        try {
                            const response = await axios.get(targetUrl, {
                                timeout: 10000,
                                maxRedirects: 10,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                    'Accept-Language': 'en-US,en;q=0.9',
                                    'Connection': 'keep-alive'
                                },
                                validateStatus: null
                            });
                            
                            return {
                                success: true,
                                finalUrl: response.request.res.responseUrl || targetUrl,
                                statusCode: response.status,
                                redirects: response.request._redirectable?._redirectCount || 0,
                                source: "Direct Request"
                            };
                        } catch (err) {
                            return { success: false, error: err.message };
                        }
                    }
                },
                {
                    name: "HEAD Request Method",
                    func: async (targetUrl) => {
                        try {
                            const response = await axios.head(targetUrl, {
                                timeout: 8000,
                                maxRedirects: 10,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                                },
                                validateStatus: null
                            });
                            
                            // Jika ada location header, itu redirect
                            if (response.headers.location) {
                                return {
                                    success: true,
                                    finalUrl: response.headers.location,
                                    statusCode: response.status,
                                    redirects: 1,
                                    source: "HEAD Request"
                                };
                            }
                            
                            return {
                                success: true,
                                finalUrl: targetUrl,
                                statusCode: response.status,
                                redirects: 0,
                                source: "HEAD Request"
                            };
                        } catch (err) {
                            return { success: false, error: err.message };
                        }
                    }
                },
                {
                    name: "Unshorten.me API",
                    func: async (targetUrl) => {
                        try {
                            // Gunakan API dari unshorten.me
                            const response = await axios.get(`https://unshorten.me/json/${encodeURIComponent(targetUrl)}`, {
                                timeout: 8000
                            });
                            
                            if (response.data && response.data.resolved_url) {
                                return {
                                    success: true,
                                    finalUrl: response.data.resolved_url,
                                    statusCode: 200,
                                    redirects: 1,
                                    source: "unshorten.me API"
                                };
                            }
                            throw new Error("No data from API");
                        } catch (err) {
                            return { success: false, error: err.message };
                        }
                    }
                },
                {
                    name: "LongURL API",
                    func: async (targetUrl) => {
                        try {
                            const response = await axios.get(`https://longurl.in/api/expand?url=${encodeURIComponent(targetUrl)}&format=json`, {
                                timeout: 8000
                            });
                            
                            if (response.data && response.data['long-url']) {
                                return {
                                    success: true,
                                    finalUrl: response.data['long-url'],
                                    statusCode: 200,
                                    redirects: 1,
                                    source: "longurl.in API"
                                };
                            }
                            throw new Error("No data from API");
                        } catch (err) {
                            return { success: false, error: err.message };
                        }
                    }
                },
                {
                    name: "Manual Redirect",
                    func: async (targetUrl) => {
                        try {
                            let currentUrl = targetUrl;
                            let redirects = 0;
                            
                            for (let i = 0; i < 5; i++) {
                                try {
                                    const response = await axios.get(currentUrl, {
                                        timeout: 5000,
                                        maxRedirects: 0,
                                        headers: {
                                            'User-Agent': 'Mozilla/5.0'
                                        },
                                        validateStatus: null
                                    });
                                    
                                    // Check if it's a redirect
                                    if ([301, 302, 303, 307, 308].includes(response.status)) {
                                        if (response.headers.location) {
                                            redirects++;
                                            currentUrl = response.headers.location;
                                            continue;
                                        }
                                    }
                                    
                                    // Not a redirect or no location header
                                    return {
                                        success: true,
                                        finalUrl: currentUrl,
                                        statusCode: response.status,
                                        redirects: redirects,
                                        source: "Manual Redirect"
                                    };
                                    
                                } catch (err) {
                                    if (err.response && err.response.headers && err.response.headers.location) {
                                        redirects++;
                                        currentUrl = err.response.headers.location;
                                        continue;
                                    }
                                    throw err;
                                }
                            }
                            
                            return {
                                success: true,
                                finalUrl: currentUrl,
                                statusCode: 0,
                                redirects: redirects,
                                source: "Manual Redirect (max attempts)"
                            };
                        } catch (err) {
                            return { success: false, error: err.message };
                        }
                    }
                }
            ];
            
            // Coba semua metode
            for (let i = 0; i < expansionMethods.length; i++) {
                const method = expansionMethods[i];
                try {
                    console.log(`Trying method ${i + 1}: ${method.name}`);
                    
                    const result = await method.func(url);
                    
                    if (result.success) {
                        finalUrl = result.finalUrl;
                        redirectCount = result.redirects || 0;
                        statusCode = result.statusCode || 200;
                        methodUsed = method.name;
                        source = result.source || "";
                        
                        // Jika URL berubah, berarti berhasil expand
                        if (finalUrl !== url && finalUrl !== "undefined") {
                            console.log(`Success with method ${i + 1}: ${finalUrl}`);
                            break;
                        }
                        
                        // Jika sudah method terakhir dan URL tidak berubah
                        if (i === expansionMethods.length - 1) {
                            errorMessage = "URL tidak bisa diekspansi (mungkin bukan shortlink atau sudah final)";
                        }
                    }
                } catch (methodErr) {
                    console.log(`Method ${i + 1} failed:`, methodErr.message);
                    if (i === expansionMethods.length - 1) {
                        errorMessage = `Semua metode gagal: ${methodErr.message}`;
                    }
                }
                
                // Tunggu sebentar antara percobaan
                if (i < expansionMethods.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            await bot.sendMessage(m.key.remoteJid, {
                delete: loading.key
            });
            
            // Jika URL tidak berubah setelah semua metode
            const urlChanged = finalUrl !== url && finalUrl !== "undefined";
            
            // Generate report
            let report = `🔗 *URL EXPANSION RESULTS*\n\n`;
            
            report += `📌 *Original URL:*\n${url}\n\n`;
            
            if (urlChanged) {
                report += `🎯 *Final Destination:*\n${finalUrl}\n\n`;
            } else {
                report += `ℹ️ *URL Status:* Tidak berubah (mungkin sudah final)\n\n`;
            }
            
            report += `📊 *TECHNICAL INFO:*\n`;
            report += `• *Method Used:* ${methodUsed}\n`;
            if (source) report += `• *Source:* ${source}\n`;
            report += `• *Status Code:* ${statusCode}\n`;
            report += `• *Redirects:* ${redirectCount}\n`;
            
            if (errorMessage) {
                report += `• *Error:* ${errorMessage}\n`;
            }
            
            // Analisis URL
            try {
                const urlObj = new URL(finalUrl);
                report += `\n🔍 *URL ANALYSIS:*\n`;
                report += `• *Domain:* ${urlObj.hostname}\n`;
                report += `• *Protocol:* ${urlObj.protocol.replace(':', '')}\n`;
                report += `• *Path:* ${urlObj.pathname}\n`;
                
                // Deteksi shortener
                const isShortener = shortenerDomains.some(domain => 
                    urlObj.hostname.includes(domain)
                );
                
                if (isShortener && !urlChanged) {
                    report += `\n⚠️ *SHORTENER DETECTED BUT NOT EXPANDED*\n`;
                    report += `Shortener mungkin memblokir bot atau membutuhkan CAPTCHA.\n`;
                }
                
                // Check parameter count
                const paramCount = urlObj.searchParams.size;
                if (paramCount > 0) {
                    report += `• *Parameters:* ${paramCount} parameter(s)\n`;
                    
                    // Tampilkan beberapa parameter
                    const params = Array.from(urlObj.searchParams.entries());
                    if (params.length > 0) {
                        const [key, value] = params[0];
                        report += `• *Sample:* ${key}=${value.length > 20 ? value.substring(0, 20) + '...' : value}\n`;
                    }
                }
                
            } catch (parseErr) {
                report += `\n⚠️ *URL Parse Error:* ${parseErr.message}\n`;
            }
            
            // Tips berdasarkan hasil
            report += `\n💡 *RECOMMENDATIONS:*\n`;
            
            if (!urlChanged) {
                report += `1. Coba gunakan URL yang berbeda\n`;
                report += `2. Beberapa shortener memblokir bot\n`;
                report += `3. URL mungkin sudah merupakan final destination\n`;
            } else {
                report += `1. URL berhasil diekspansi\n`;
                
                // Cek apakah expanded URL juga shortener
                const expandedIsShortener = shortenerDomains.some(domain => 
                    finalUrl.includes(domain)
                );
                
                if (expandedIsShortener) {
                    report += `2. ⚠️ Hasil masih shortener, coba expand lagi\n`;
                }
            }
            
            // Tools
            report += `\n🛠️ *BOT TOOLS:*\n`;
            try {
                const urlObj = new URL(finalUrl);
                report += `• \`.cekurl ${finalUrl}\` - Analisis keamanan\n`;
                report += `• \`.cekdns ${urlObj.hostname}\` - Cek DNS\n`;
                report += `• \`.whois ${urlObj.hostname}\` - Cek domain info\n`;
            } catch (e) {}
            
            report += `\n⏰ *Checked:* ${new Date().toLocaleTimeString('id-ID')}`;
            
            await bot.sendMessage(m.key.remoteJid, {
                text: report
            }, { quoted: m });
            
            // Additional tips untuk specific shorteners
            if (!urlChanged) {
                const urlLower = url.toLowerCase();
                
                if (urlLower.includes('tinyurl.com')) {
                    await bot.sendMessage(m.key.remoteJid, {
                        text: `ℹ️ *TINYURL TIPS:*\n\nTinyURL sering memblokir automated requests.\nCoba:\n1. Tambahkan '+' di akhir URL: ${url}+\n2. Gunakan preview.tinyurl.com/${url.split('/').pop()}\n3. Buka manual di browser`
                    });
                }
                
                if (urlLower.includes('bit.ly')) {
                    await bot.sendMessage(m.key.remoteJid, {
                        text: `ℹ️ *BIT.LY TIPS:*\n\nBit.ly memiliki proteksi anti-bot.\nCoba:\n1. Tambahkan '+' di akhir: ${url}+\n2. Gunakan preview.bit.ly/${url.split('/').pop()}\n3. Buka di incognito mode`
                    });
                }
            }
            
        } catch (err) {
            console.error("[EXPANDURL ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: `❌ *Error sistem:*\n${err.message}\n\nCoba URL yang berbeda atau coba lagi nanti.`
            }, { quoted: m });
        }
    }
};
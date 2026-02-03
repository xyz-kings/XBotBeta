const axios = require("axios");
const dns = require("dns").promises;

module.exports = {
    command: ["ping", "latency", "cekp"],
    category: "tools",
    description: "Cek ping/latency ke server/domain",
    
    async execute(bot, m, args) {
        try {
            const target = args[0] || 'google.com';
            
            // Validasi target
            const cleanedTarget = target.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
            if (!cleanedTarget) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Target tidak valid!*\nContoh: `.ping google.com` atau `.ping 8.8.8.8`"
                }, { quoted: m });
            }
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: `🏓 *Menguji koneksi ke ${cleanedTarget}...*\n\n🔍 *Proses:*\n1. DNS Lookup\n2. TCP Connection\n3. HTTP Request\n4. Response Time`
            }, { quoted: m });
            
            const results = {
                dnsTime: null,
                tcpTime: null,
                httpTime: null,
                totalTime: null,
                ipAddress: null,
                statusCode: null,
                serverInfo: null,
                sslInfo: null,
                error: null
            };
            
            const startTime = Date.now();
            
            try {
                // 1. DNS Lookup Test
                const dnsStart = Date.now();
                try {
                    const addresses = await dns.resolve4(cleanedTarget);
                    results.dnsTime = Date.now() - dnsStart;
                    results.ipAddress = addresses[0];
                } catch (dnsErr) {
                    // Coba IPv6
                    try {
                        const addresses = await dns.resolve6(cleanedTarget);
                        results.dnsTime = Date.now() - dnsStart;
                        results.ipAddress = addresses[0];
                    } catch (err) {
                        results.dnsTime = Date.now() - dnsStart;
                        results.error = `DNS Lookup failed: ${err.message}`;
                    }
                }
                
                // 2. TCP Connection Test (simulasi dengan axios)
                const tcpStart = Date.now();
                try {
                    // Coba HTTP dan HTTPS
                    const protocols = ['https://', 'http://'];
                    let successfulProtocol = null;
                    
                    for (const protocol of protocols) {
                        try {
                            const testUrl = `${protocol}${cleanedTarget}`;
                            await axios.head(testUrl, { 
                                timeout: 3000,
                                maxRedirects: 0
                            });
                            successfulProtocol = protocol;
                            results.tcpTime = Date.now() - tcpStart;
                            results.sslInfo = protocol === 'https://' ? 'SSL Enabled' : 'No SSL';
                            break;
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (!successfulProtocol) {
                        throw new Error('TCP connection failed');
                    }
                    
                } catch (tcpErr) {
                    results.tcpTime = Date.now() - tcpStart;
                    if (!results.error) results.error = `TCP Connection failed: ${tcpErr.message}`;
                }
                
                // 3. HTTP Request Test
                const httpStart = Date.now();
                try {
                    const response = await axios.get(`https://${cleanedTarget}`, {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Ping Test)'
                        }
                    });
                    
                    results.httpTime = Date.now() - httpStart;
                    results.statusCode = response.status;
                    results.serverInfo = response.headers['server'] || 'Unknown';
                    
                    // Cek SSL details
                    if (response.request?.res?.socket?._tlsOptions) {
                        results.sslInfo = 'SSL/TLS Active';
                    }
                    
                } catch (httpErr) {
                    results.httpTime = Date.now() - httpStart;
                    if (!results.error) {
                        results.error = `HTTP Request failed: ${httpErr.message}`;
                    }
                }
                
                results.totalTime = Date.now() - startTime;
                
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                // Generate report
                let report = `🏓 *PING TEST RESULTS*\n\n`;
                report += `🎯 *Target:* ${cleanedTarget}\n`;
                
                if (results.ipAddress) {
                    report += `📍 *IP Address:* ${results.ipAddress}\n`;
                }
                
                if (results.statusCode) {
                    report += `📊 *HTTP Status:* ${results.statusCode}\n`;
                }
                
                if (results.serverInfo) {
                    report += `🖥️ *Server:* ${results.serverInfo}\n`;
                }
                
                if (results.sslInfo) {
                    report += `🔒 *SSL:* ${results.sslInfo}\n`;
                }
                
                report += `\n⏱️ *PERFORMANCE METRICS:*\n`;
                
                if (results.dnsTime !== null) {
                    report += `🌐 *DNS Lookup:* ${results.dnsTime}ms\n`;
                }
                
                if (results.tcpTime !== null) {
                    report += `🔗 *TCP Connect:* ${results.tcpTime}ms\n`;
                }
                
                if (results.httpTime !== null) {
                    report += `📡 *HTTP Response:* ${results.httpTime}ms\n`;
                }
                
                report += `⏳ *Total Time:* ${results.totalTime}ms\n\n`;
                
                // Rating system
                const avgTime = results.httpTime || results.totalTime;
                let rating = '';
                
                if (avgTime < 100) {
                    rating = '✅ *Excellent* (Sangat cepat)';
                } else if (avgTime < 300) {
                    rating = '👍 *Good* (Cepat)';
                } else if (avgTime < 500) {
                    rating = '⚠️ *Average* (Sedang)';
                } else if (avgTime < 1000) {
                    rating = '🐌 *Slow* (Lambat)';
                } else {
                    rating = '❌ *Poor* (Sangat lambat)';
                }
                
                report += `📈 *PERFORMANCE RATING:*\n${rating}\n\n`;
                
                // Tips berdasarkan hasil
                if (avgTime > 500) {
                    report += `💡 *Tips:*\n`;
                    if (results.dnsTime > 200) {
                        report += `• DNS server lambat, coba ganti DNS (1.1.1.1/8.8.8.8)\n`;
                    }
                    if (results.tcpTime > 300) {
                        report += `• Koneksi jaringan bermasalah\n`;
                    }
                    if (results.httpTime > 400) {
                        report += `• Server target overload\n`;
                    }
                }
                
                // Multiple test untuk akurasi
                if (!results.error) {
                    report += `\n📊 *Accuracy Test (3 attempts):*\n`;
                    
                    const pingTests = [];
                    for (let i = 0; i < 3; i++) {
                        const testStart = Date.now();
                        try {
                            await axios.head(`https://${cleanedTarget}`, { timeout: 3000 });
                            pingTests.push(Date.now() - testStart);
                        } catch (e) {
                            pingTests.push(null);
                        }
                    }
                    
                    const successfulTests = pingTests.filter(t => t !== null);
                    if (successfulTests.length > 0) {
                        const avgPing = Math.round(successfulTests.reduce((a, b) => a + b) / successfulTests.length);
                        const minPing = Math.min(...successfulTests);
                        const maxPing = Math.max(...successfulTests);
                        const packetLoss = ((3 - successfulTests.length) / 3) * 100;
                        
                        report += `• Rata-rata: ${avgPing}ms\n`;
                        report += `• Minimum: ${minPing}ms\n`;
                        report += `• Maximum: ${maxPing}ms\n`;
                        report += `• Packet Loss: ${packetLoss}%\n`;
                    }
                }
                
                if (results.error) {
                    report += `\n⚠️ *WARNING:* ${results.error}\n`;
                }
                
                report += `\n⏰ *Test time:* ${new Date().toLocaleTimeString('id-ID')}`;
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: report
                }, { quoted: m });
                
            } catch (testErr) {
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: `❌ *PING TEST FAILED*\n\n*Target:* ${cleanedTarget}\n*Error:* ${testErr.message}\n\n*Kemungkinan penyebab:*\n• Domain tidak ada\n• Server down\n• Firewall block\n• Network issue\n\n*Coba:*\n• Pastikan domain benar\n• Cek koneksi internet\n• Gunakan IP address (8.8.8.8)`
                }, { quoted: m });
            }
            
        } catch (err) {
            console.error("[PING ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Error sistem saat melakukan ping test."
            }, { quoted: m });
        }
    }
};
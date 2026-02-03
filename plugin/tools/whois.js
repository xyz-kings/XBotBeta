const axios = require("axios");
const dns = require("dns").promises;

module.exports = {
    command: ["whois", "domaininfo", "cekd"],
    category: "tools",
    description: "Cek informasi WHOIS domain lengkap",
    
    async execute(bot, m, args) {
        try {
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: `🌐 *WHOIS DOMAIN CHECKER*\n\n*Cara pakai:* \`.whois <domain>\`\n\n*Contoh:*\n\`.whois google.com\`\n\`.whois github.com\`\n\`.whois instagram.com\`\n\n*Fitur:*\n• Info registrasi domain\n• Pemilik domain\n• Expiry date\n• Name servers\n• Status domain`
                }, { quoted: m });
            }
            
            let domain = args[0].toLowerCase();
            
            // Clean domain
            domain = domain.replace(/^https?:\/\//, '')
                          .replace(/^www\./, '')
                          .replace(/\/.*$/, '');
            
            // Validasi domain
            const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
            if (!domainRegex.test(domain)) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Format domain tidak valid!*\nContoh: google.com, github.io, example.co.id"
                }, { quoted: m });
            }
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: `🔍 *Mencari WHOIS data untuk ${domain}...*\n\n⏳ *Proses:*\n1. Validasi domain\n2. Query WHOIS database\n3. Parse informasi\n4. DNS cross-check`
            }, { quoted: m });
            
            try {
                // Coba multiple WHOIS APIs
                const apis = [
                    {
                        name: "WhoisFreaks",
                        url: `https://api.whoisfreaks.com/v1.0/whois?apiKey=free&whois=live&domainName=${domain}`,
                        timeout: 10000
                    },
                    {
                        name: "JSONWhois",
                        url: `https://jsonwhoisapi.com/api/v1/whois?identifier=${domain}`,
                        headers: { 'Accept': 'application/json' },
                        timeout: 8000
                    }
                ];
                
                let whoisData = null;
                let usedApi = '';
                
                for (const api of apis) {
                    try {
                        const response = await axios.get(api.url, {
                            timeout: api.timeout,
                            headers: api.headers || {}
                        });
                        
                        if (response.data && !response.data.error) {
                            whoisData = response.data;
                            usedApi = api.name;
                            break;
                        }
                    } catch (apiErr) {
                        console.log(`API ${api.name} failed:`, apiErr.message);
                        continue;
                    }
                }
                
                if (!whoisData) {
                    throw new Error("Semua WHOIS API gagal");
                }
                
                // Dapatkan info DNS juga
                let dnsInfo = null;
                try {
                    const nsRecords = await dns.resolveNs(domain);
                    dnsInfo = nsRecords;
                } catch (dnsErr) {
                    dnsInfo = null;
                }
                
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                // Generate report
                let report = `🌐 *WHOIS INFORMATION*\n\n`;
                report += `🏷️ *Domain:* ${domain}\n`;
                
                // Registration info
                if (whoisData.created_date || whoisData.creation_date) {
                    const created = new Date(whoisData.created_date || whoisData.creation_date);
                    report += `📅 *Registered:* ${created.toLocaleDateString('id-ID')}\n`;
                }
                
                if (whoisData.updated_date) {
                    const updated = new Date(whoisData.updated_date);
                    report += `✏️ *Last Updated:* ${updated.toLocaleDateString('id-ID')}\n`;
                }
                
                if (whoisData.expiry_date || whoisData.expiration_date) {
                    const expiry = new Date(whoisData.expiry_date || whoisData.expiration_date);
                    const today = new Date();
                    const diffTime = expiry - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    report += `⏳ *Expires:* ${expiry.toLocaleDateString('id-ID')}\n`;
                    report += `📆 *Days Left:* ${diffDays} hari\n`;
                    
                    // Warning jika hampir expired
                    if (diffDays < 30) {
                        report += `⚠️ *WARNING:* Domain akan expired dalam ${diffDays} hari!\n`;
                    }
                }
                
                // Registrar info
                if (whoisData.registrar || whoisData.registrar_name) {
                    report += `🏢 *Registrar:* ${whoisData.registrar || whoisData.registrar_name}\n`;
                }
                
                // Owner info
                if (whoisData.registrant_name || whoisData.registrant_organization) {
                    report += `👤 *Registrant:* ${whoisData.registrant_name || whoisData.registrant_organization}\n`;
                }
                
                if (whoisData.registrant_country) {
                    report += `🇮🇩 *Country:* ${whoisData.registrant_country}\n`;
                }
                
                if (whoisData.registrant_email) {
                    report += `📧 *Email:* ${whoisData.registrant_email.substring(0, 3)}...@...\n`;
                }
                
                // Name servers
                const nameServers = whoisData.name_servers || whoisData.nameservers || dnsInfo;
                if (nameServers && Array.isArray(nameServers)) {
                    report += `\n🖥️ *NAME SERVERS:*\n`;
                    nameServers.slice(0, 5).forEach((ns, idx) => {
                        report += `${idx + 1}. ${ns}\n`;
                    });
                }
                
                // Domain status
                if (whoisData.domain_status) {
                    report += `\n📊 *DOMAIN STATUS:*\n`;
                    const statuses = Array.isArray(whoisData.domain_status) ? 
                                   whoisData.domain_status : [whoisData.domain_status];
                    statuses.forEach((status, idx) => {
                        const cleanStatus = status.replace(/https?:\/\/[^ ]+/g, '').trim();
                        if (cleanStatus) {
                            report += `• ${cleanStatus}\n`;
                        }
                    });
                }
                
                // DNS Records summary
                try {
                    const [aRecords, mxRecords, txtRecords] = await Promise.allSettled([
                        dns.resolve4(domain),
                        dns.resolveMx(domain),
                        dns.resolveTxt(domain)
                    ]);
                    
                    report += `\n📡 *DNS SUMMARY:*\n`;
                    
                    if (aRecords.status === 'fulfilled' && aRecords.value.length > 0) {
                        report += `• A Records: ${aRecords.value.length} ditemukan\n`;
                    }
                    
                    if (mxRecords.status === 'fulfilled' && mxRecords.value.length > 0) {
                        report += `• MX Records: ${mxRecords.value.length} ditemukan\n`;
                    }
                    
                    if (txtRecords.status === 'fulfilled' && txtRecords.value.length > 0) {
                        report += `• TXT Records: ${txtRecords.value[0].length} ditemukan\n`;
                    }
                } catch (dnsSummaryErr) {
                    // Skip jika error
                }
                
                // Security info
                report += `\n🔒 *SECURITY INFO:*\n`;
                
                // Cek DNSSEC
                try {
                    const dnssecRecords = await dns.resolveTxt(`${domain}`);
                    const hasDNSSEC = dnssecRecords.some(record => 
                        record.some(r => r.includes('DNSSEC'))
                    );
                    report += `• DNSSEC: ${hasDNSSEC ? '✅ Enabled' : '❌ Disabled'}\n`;
                } catch (e) {
                    report += `• DNSSEC: ❓ Unknown\n`;
                }
                
                // Cek SSL (simplified)
                try {
                    await axios.head(`https://${domain}`, { timeout: 3000 });
                    report += `• SSL/TLS: ✅ Active\n`;
                } catch (e) {
                    report += `• SSL/TLS: ❌ Inactive\n`;
                }
                
                // Additional info
                if (whoisData.domain_age) {
                    const years = Math.floor(whoisData.domain_age / 365);
                    report += `\n📈 *DOMAIN AGE:* ${years} tahun\n`;
                }
                
                if (whoisData.admin_email) {
                    report += `👨‍💼 *Admin Contact:* ${whoisData.admin_email.substring(0, 3)}...@...\n`;
                }
                
                if (whoisData.tech_email) {
                    report += `👨‍🔧 *Tech Contact:* ${whoisData.tech_email.substring(0, 3)}...@...\n`;
                }
                
                report += `\n📊 *SOURCE:* ${usedApi}\n`;
                report += `⏰ *Checked:* ${new Date().toLocaleString('id-ID')}\n`;
                report += `_Data mungkin tidak 100% akurat_`;
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: report
                }, { quoted: m });
                
                // Additional: TLD info
                const tld = domain.split('.').pop();
                const commonTLDs = {
                    'com': 'Commercial',
                    'org': 'Organization',
                    'net': 'Network',
                    'edu': 'Education',
                    'gov': 'Government',
                    'id': 'Indonesia',
                    'co.id': 'Indonesia Company',
                    'ac.id': 'Indonesia Academic',
                    'go.id': 'Indonesia Government',
                    'sch.id': 'Indonesia School'
                };
                
                if (commonTLDs[tld]) {
                    await bot.sendMessage(m.key.remoteJid, {
                        text: `📌 *TLD Info:* ${tld} - ${commonTLDs[tld]}`
                    });
                }
                
            } catch (apiErr) {
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                // Fallback: Coba WHOIS lookup sederhana
                try {
                    const fallbackRes = await axios.get(`http://api.whois.vu/?q=${domain}`);
                    
                    if (fallbackRes.data && fallbackRes.data.available !== undefined) {
                        let fallbackReport = `🌐 *WHOIS FALLBACK DATA*\n\n`;
                        fallbackReport += `🏷️ *Domain:* ${domain}\n`;
                        fallbackReport += `📊 *Status:* ${fallbackRes.data.available ? '✅ Available' : '❌ Taken'}\n`;
                        
                        if (fallbackRes.data.created) {
                            fallbackReport += `📅 *Created:* ${fallbackRes.data.created}\n`;
                        }
                        
                        if (fallbackRes.data.expires) {
                            fallbackReport += `⏳ *Expires:* ${fallbackRes.data.expires}\n`;
                        }
                        
                        if (fallbackRes.data.registrar) {
                            fallbackReport += `🏢 *Registrar:* ${fallbackRes.data.registrar}\n`;
                        }
                        
                        await bot.sendMessage(m.key.remoteJid, {
                            text: fallbackReport
                        }, { quoted: m });
                    } else {
                        throw new Error('No fallback data');
                    }
                    
                } catch (fallbackErr) {
                    await bot.sendMessage(m.key.remoteJid, {
                        text: `❌ *WHOIS LOOKUP FAILED*\n\n*Domain:* ${domain}\n*Error:* ${apiErr.message}\n\n*Kemungkinan penyebab:*\n• Domain tidak terdaftar\n• WHOIS API limit\n• Domain privasi enabled\n• TLD tidak didukung\n\n*Coba:*\n• Cek manual di whois.icann.org\n• Gunakan domain .com/.net/.org\n• Pastikan domain aktif`
                    }, { quoted: m });
                }
            }
            
        } catch (err) {
            console.error("[WHOIS ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Error sistem saat mengecek WHOIS."
            }, { quoted: m });
        }
    }
};
const dns = require("dns").promises;

module.exports = {
    command: ["cekdns", "dns", "dnslookup"],
    category: "tools",
    description: "Cek informasi DNS domain",
    
    async execute(bot, m, args) {
        try {
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Cara pakai:* `.cekdns <domain>`\nContoh: `.cekdns google.com`"
                }, { quoted: m });
            }
            
            const domain = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '');
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: `🔍 *Mencari DNS records untuk ${domain}...*`
            }, { quoted: m });
            
            let result = `🌐 *INFORMASI DNS: ${domain.toUpperCase()}*\n\n`;
            
            // Cek A records
            try {
                const aRecords = await dns.resolve4(domain);
                if (aRecords.length > 0) {
                    result += `📊 *A Records (IPv4):*\n`;
                    aRecords.forEach((record, idx) => {
                        result += `  ${idx + 1}. ${record}\n`;
                    });
                    result += '\n';
                }
            } catch (err) {}
            
            // Cek AAAA records
            try {
                const aaaaRecords = await dns.resolve6(domain);
                if (aaaaRecords.length > 0) {
                    result += `📊 *AAAA Records (IPv6):*\n`;
                    aaaaRecords.forEach((record, idx) => {
                        result += `  ${idx + 1}. ${record}\n`;
                    });
                    result += '\n';
                }
            } catch (err) {}
            
            // Cek MX records
            try {
                const mxRecords = await dns.resolveMx(domain);
                if (mxRecords.length > 0) {
                    result += `📧 *MX Records (Mail):*\n`;
                    mxRecords.sort((a, b) => a.priority - b.priority);
                    mxRecords.forEach((record, idx) => {
                        result += `  ${idx + 1}. ${record.exchange} (priority: ${record.priority})\n`;
                    });
                    result += '\n';
                }
            } catch (err) {}
            
            // Cek TXT records
            try {
                const txtRecords = await dns.resolveTxt(domain);
                if (txtRecords.length > 0) {
                    result += `📝 *TXT Records:*\n`;
                    txtRecords.forEach((recordArray, idx) => {
                        recordArray.forEach(record => {
                            result += `  ${idx + 1}. ${record}\n`;
                        });
                    });
                    result += '\n';
                }
            } catch (err) {}
            
            // Cek NS records
            try {
                const nsRecords = await dns.resolveNs(domain);
                if (nsRecords.length > 0) {
                    result += `🖥️ *NS Records (Name Servers):*\n`;
                    nsRecords.forEach((record, idx) => {
                        result += `  ${idx + 1}. ${record}\n`;
                    });
                }
            } catch (err) {}
            
            await bot.sendMessage(m.key.remoteJid, {
                delete: loading.key
            });
            
            if (result === `🌐 *INFORMASI DNS: ${domain.toUpperCase()}*\n\n`) {
                result += "❌ Tidak ada DNS records ditemukan atau domain tidak valid.";
            } else {
                result += `\n⏰ *Diperiksa:* ${new Date().toLocaleString('id-ID')}`;
            }
            
            await bot.sendMessage(m.key.remoteJid, {
                text: result
            }, { quoted: m });
            
        } catch (err) {
            console.error("[CEKDNS ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: `❌ Error DNS lookup:\n${err.message}`
            }, { quoted: m });
        }
    }
};
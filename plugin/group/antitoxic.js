const fs = require('fs');
const path = require('path');
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

// Path database
const baseDir = path.join(__dirname, '../../');
const dbPath = path.join(baseDir, 'DataDase', 'toxic_grup.json');
const config = require(path.join(baseDir, 'config.json'));

// List kata toxic dari config
const toxicWords = config.antiToxic || [];

// Fungsi database SIMPLE
function readDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, '{}', 'utf8');
      return {};
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8') || '{}');
  } catch (error) {
    console.error('[ANTITOXIC] Database error:', error);
    return {};
  }
}

function writeDatabase(data) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[ANTITOXIC] Write error:', error);
    return false;
  }
}

// Fungsi untuk detect kata toxic
function detectToxicText(text) {
  if (!text || typeof text !== 'string') return { words: [], numbers: [] };
  
  const lowerText = text.toLowerCase();
  const foundWords = [];
  const foundNumbers = [];
  
  toxicWords.forEach((word, index) => {
    if (word && typeof word === 'string') {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(lowerText)) {
        foundWords.push(word);
        foundNumbers.push(index + 1);
      }
    }
  });
  
  return { words: foundWords, numbers: foundNumbers };
}

module.exports = {
  command: ["antitoxic"],
  category: "group",
  description: "Filter kata toxic - 2x warning, 3x kick",

  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;

    // --- PANGGIL REACT LOADING DARI HELPER ---
    await reactLoading(bot, m); // 🔁🔃🔄

    if (!remoteJid.endsWith("@g.us")) {
      return bot.sendMessage(remoteJid, { text: "⚠️ Hanya untuk grup!" }, { quoted: m });
    }

    const db = readDatabase();
    let groupData = db[remoteJid] || { enabled: false, warnings: {} };

    if (args.length === 0) {
      const status = groupData.enabled ? '✅ AKTIF' : '❌ NONAKTIF';
      const totalWarnings = Object.values(groupData.warnings || {}).reduce((a, b) => a + b, 0);
      
      return bot.sendMessage(remoteJid, { 
        text: `🚫 *ANTI TOXIC SYSTEM*\n\n` +
              `Status: ${status}\n` +
              `Kata dilarang: ${toxicWords.length} kata\n` +
              `Total warning: ${totalWarnings}x\n\n` +
              `*Rules:*\n1x toxic = Warning 1/3\n2x toxic = Warning 2/3\n3x toxic = AUTO KICK\n\n` +
              `*Commands:*\n.antitoxic on\n.antitoxic off\n.antitoxic reset\n.antitoxic list`
      }, { quoted: m });
    }

    const action = args[0].toLowerCase();

    if (['on','off','reset'].includes(action)) {
      try {
        const metadata = await bot.groupMetadata(remoteJid);
        const senderJid = m.key.participant || m.key.from;
        const sender = metadata.participants.find(p => p.id === senderJid);
        if (!sender || !(sender.admin === "admin" || sender.admin === "superadmin")) {
          return bot.sendMessage(remoteJid, { text: "❌ Hanya admin yang bisa!" }, { quoted: m });
        }
      } catch (e) { console.error('[ANTITOXIC] Admin check error:', e); }
    }

    if (action === 'on') {
      groupData.enabled = true;
      db[remoteJid] = groupData;
      writeDatabase(db);
      return bot.sendMessage(remoteJid, { 
        text: `✅ *ANTI TOXIC DIHIDUPKAN!*\nSistem aktif.\n${toxicWords.length} kata dilarang telah dimuat.` 
      }, { quoted: m });
    } else if (action === 'off') {
      groupData.enabled = false;
      groupData.warnings = {};
      db[remoteJid] = groupData;
      writeDatabase(db);
      return bot.sendMessage(remoteJid, { text: "✅ Anti toxic dimatikan! Semua warning direset." }, { quoted: m });
    } else if (action === 'reset') {
      groupData.warnings = {};
      db[remoteJid] = groupData;
      writeDatabase(db);
      return bot.sendMessage(remoteJid, { text: "✅ Semua warning direset!" }, { quoted: m });
    } else if (action === 'list') {
      const chunkSize = 20;
      const totalChunks = Math.ceil(toxicWords.length / chunkSize);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        const chunk = toxicWords.slice(start, end);
        const text = `📋 *KATA TOXIC DILARANG* (${i+1}/${totalChunks})\n\n` +
                     chunk.map((word, idx) => `No.${start + idx + 1}: ${word}`).join('\n');
        await bot.sendMessage(remoteJid, { text }, { quoted: i === 0 ? m : undefined });
      }
    } else {
      return bot.sendMessage(remoteJid, { text: "❌ Command tidak valid! Gunakan: .antitoxic on/off/reset/list" }, { quoted: m });
    }
  },

  // ===== FUNGSI UTAMA DETECT TOXIC =====
  checkToxicMessage: async function(bot, m) {
    try {
      if (!m.key.remoteJid || !m.key.remoteJid.endsWith("@g.us")) return false;
      const text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || "";
      if (!text.trim()) return false;

      const db = readDatabase();
      const groupData = db[m.key.remoteJid];
      if (!groupData || !groupData.enabled) return false;

      const toxicResult = detectToxicText(text);
      if (toxicResult.words.length === 0) return false;

      const senderJid = m.key.participant || m.key.from || m.key.remoteJid;
      const senderName = senderJid.split('@')[0];
      const toxicWordNumbers = toxicResult.numbers.join(', ');
      const toxicWordList = toxicResult.words.join(', ');

      const currentWarnings = groupData.warnings?.[senderJid] || 0;
      const newWarnings = currentWarnings + 1;
      if (!groupData.warnings) groupData.warnings = {};
      groupData.warnings[senderJid] = newWarnings;
      writeDatabase(db);

      try {
        await bot.sendMessage(m.key.remoteJid, { delete: m.key });
      } catch (deleteError) { console.error('[ANTITOXIC] Delete error:', deleteError); }

      let responseText = '';
      if (newWarnings === 1) responseText = `⚠️ @${senderName} menggunakan kata toxic! Warning 1/3\nKata No.${toxicWordNumbers}`;
      else if (newWarnings === 2) responseText = `🚫 @${senderName} masih menggunakan kata toxic! Warning 2/3\nKata No.${toxicWordNumbers}: ${toxicWordList}`;
      else if (newWarnings >= 3) {
        try {
          const metadata = await bot.groupMetadata(m.key.remoteJid);
          const botJid = bot.user.id.split(':')[0];
          const botParticipant = metadata.participants.find(p => p.id.split(':')[0] === botJid);
          const isBotAdmin = botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin";
          if (isBotAdmin) {
            await bot.groupParticipantsUpdate(m.key.remoteJid, [senderJid], "remove");
            responseText = `⚡ @${senderName} di-KICK! Alasan: 3x toxic\nKata terakhir No.${toxicWordNumbers}`;
            delete groupData.warnings[senderJid];
            writeDatabase(db);
          } else {
            responseText = `❌ @${senderName} mencapai 3x warning! Bot bukan admin.`;
          }
        } catch (kickError) { console.error('[ANTITOXIC] Kick error:', kickError); responseText = `❌ Gagal kick @${senderName}`; }
      }

      if (responseText) await bot.sendMessage(m.key.remoteJid, { text: responseText, mentions: [senderJid] });
      return true;
    } catch (error) {
      console.error('[ANTITOXIC] Handle message error:', error);
      return false;
    }
  }
};

// Auto-init log
console.log(`[ANTITOXIC] Module loaded with ${toxicWords.length} toxic words`);
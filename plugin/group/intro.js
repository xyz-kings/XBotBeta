const fs = require('fs');
const path = require('path');
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

// Database path
const baseDir = path.join(__dirname, '../../');
const dbDir = path.join(baseDir, 'DataDase', 'intro_grup');
const dbPath = path.join(dbDir, 'intro_data.json');

// Fungsi database
function initDatabase() {
  try {
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}', 'utf8');
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('[INTRO] Database error:', error);
    return {};
  }
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[INTRO] Save error:', error);
    return false;
  }
}

// Template kartu intro CLEAN VERSION
function createIntroCard(userData, showInstructions = false) {
  const {
    name = '❓', age = '❓', gender = '❓', zodiac = '❓',
    hobby = '❓', music = '❓', anime = '❓', game = '❓',
    quote = '❓', personality = '❓'
  } = userData;

  let card = `╔═══════════════════════╗
   ✨ *KARTU INTRO GEN Z* ✨
╚═══════════════════════╝

👤 *NAMA:* ${name}
🎂 *UMUR:* ${age} tahun
⚡ *ZODIAK:* ${zodiac}
🌈 *GENDER:* ${gender}

🎮 *HOBBY:* ${hobby}
🎵 *MUSIC:* ${music}
📺 *ANIME:* ${anime}
🎲 *GAME:* ${game}

💫 *PERSONALITY:* ${personality}
💬 *QUOTE FAV:* "${quote}"`;

  if (showInstructions) {
    card += `

╔═══════════════════════╗
  🎉 WELCOME TO THE SQUAD!
╚═══════════════════════╝

📌 *Cara isi intro:*
1. Copy template diatas
2. Isi dengan data kamu
3. Reply pesan ini dengan data yang sudah diisi
4. Bot akan save ke database grup

⚡ *Contoh isian:*
Nama: Bambang
Umur: 17
Zodiak: Gemini
Gender: Male
Hobby: Main game, Nonton anime
Music: Lofi, Pop
Anime: One Piece, JJK
Game: Mobile Legends, Genshin
Personality: Ambivert
Quote: "YOLO - You Only Live Once"`;
  }

  return card;
}

// Template kartu intro SIMPLE
function createSimpleIntroCard(userData) {
  const { name = '❓', age = '❓', gender = '❓', zodiac = '❓',
          hobby = '❓', music = '❓', anime = '❓', game = '❓',
          quote = '❓', personality = '❓' } = userData;

  return `╔═══════════════════════╗
   ✨ *KARTU INTRO* ✨
╚═══════════════════════╝

👤 *NAMA:* ${name}
🎂 *UMUR:* ${age} tahun
⚡ *ZODIAK:* ${zodiac}
🌈 *GENDER:* ${gender}

🎮 *HOBBY:* ${hobby}
🎵 *MUSIC:* ${music}
📺 *ANIME:* ${anime}
🎲 *GAME:* ${game}

💫 *PERSONALITY:* ${personality}
💬 *QUOTE FAV:* "${quote}"`;
}

// ===== MODULE EXPORT =====
module.exports = {
  command: ["intro"],
  category: "group",
  description: "Buat kartu intro Gen Z untuk member grup",

  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;

    // --- PANGGIL REACT LOADING DI TEMPAT BENAR ---
    await reactLoading(bot, m); // 🔁🔃🔄

    if (!remoteJid.endsWith("@g.us")) {
      return bot.sendMessage(remoteJid, { text: "⚠️ Command ini hanya untuk grup!" }, { quoted: m });
    }

    const db = initDatabase();
    if (!db[remoteJid]) db[remoteJid] = {};

    try {
      const metadata = await bot.groupMetadata(remoteJid);
      const senderJid = m.key.participant || m.key.from;

      // Target member
      let targetJid = senderJid;
      let targetName = 'Kamu';

      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        const targetInGroup = metadata.participants.find(p => p.id === targetJid);
        if (!targetInGroup) return bot.sendMessage(remoteJid, { text: "❌ Member yang ditag tidak ada di grup!" }, { quoted: m });
        try {
          const contact = await bot.getContact(targetJid);
          targetName = contact?.notify || contact?.name || contact?.verifiedName || targetJid.split('@')[0];
        } catch { targetName = targetJid.split('@')[0]; }
      }

      const existingIntro = db[remoteJid][targetJid];
      const isReset = args[0]?.toLowerCase() === 'reset';

      if (existingIntro && !isReset) {
        const introCard = createIntroCard(existingIntro, false);
        const statusText = `📁 *INTRO KAMU*\n\n✅ Intro sudah tersimpan!\n📅 Dibuat: ${existingIntro.createdAt || 'Unknown'}\n\n${introCard}\n\nGunakan .intro reset untuk buat ulang`;
        return bot.sendMessage(remoteJid, { text: statusText, mentions: [targetJid] }, { quoted: m });
      }

      if (isReset && existingIntro) {
        delete db[remoteJid][targetJid];
        saveDatabase(db);
        console.log(`[INTRO] Reset intro for ${targetJid}`);
      }

      const introCard = createIntroCard({}, true);
      const instructionText = `✨ *HEY @${targetJid.split('@')[0]}!* ✨\n\nWaktunya perkenalan diri! 🎉\n\n${introCard}\n\n⏰ *Batas waktu:* 24 jam\n📌 *Reply pesan ini* untuk submit intro kamu!`;

      const sentMessage = await bot.sendMessage(remoteJid, { text: instructionText, mentions: [targetJid] }, { quoted: m });
      console.log(`[INTRO] Intro card sent to ${targetJid} in ${remoteJid}`);

      db[remoteJid][`pending_${targetJid}`] = { messageId: sentMessage.key.id, timestamp: Date.now(), requestedBy: senderJid };
      saveDatabase(db);

    } catch (error) {
      console.error('[INTRO] Error:', error);
      return bot.sendMessage(remoteJid, { text: "❌ Gagal membuat kartu intro!" }, { quoted: m });
    }
  }
};

// ===== HANDLER REPLY =====
module.exports.handleIntroReply = async function(bot, m) {
  try {
    const remoteJid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.from;
    if (!remoteJid.endsWith("@g.us")) return;
    if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) return;

    const quotedId = m.message.extendedTextMessage.contextInfo.stanzaId;
    const db = initDatabase();
    if (!db[remoteJid]) return;

    const pendingKey = `pending_${senderJid}`;
    const pendingData = db[remoteJid][pendingKey];
    if (!pendingData || pendingData.messageId !== quotedId) return;

    const replyText = m.message.extendedTextMessage.text || "";
    const introData = parseIntroText(replyText);
    if (Object.keys(introData).length === 0) {
      return bot.sendMessage(remoteJid, { text: `❌ Format intro salah! 😅\nPastikan mengisi semua field.` , mentions: [senderJid] }, { quoted: m });
    }

    introData.userJid = senderJid;
    introData.createdAt = new Date().toLocaleString('id-ID');
    introData.updatedAt = new Date().toLocaleString('id-ID');

    db[remoteJid][senderJid] = introData;
    delete db[remoteJid][pendingKey];
    saveDatabase(db);

    const introCard = createSimpleIntroCard(introData);
    const successText = `🎉 *INTRO BERHASIL DISIMPAN!* 🎉\n\nData kamu sudah masuk database grup!\n\n${introCard}`;

    await bot.sendMessage(remoteJid, { text: successText, mentions: [senderJid] }, { quoted: m });
    console.log(`[INTRO] Intro saved for ${senderJid} in ${remoteJid}`);
  } catch (error) { console.error('[INTRO REPLY] Error:', error); }
};

// ===== PARSE INTRO TEXT =====
function parseIntroText(text) {
  const data = {};
  const fieldMapping = {
    'nama':'name','name':'name','umur':'age','usia':'age','age':'age',
    'zodiak':'zodiac','zodiac':'zodiac','gender':'gender','jenis kelamin':'gender',
    'hobby':'hobby','hobi':'hobby','music':'music','musik':'music','anime':'anime',
    'game':'game','quote':'quote','kutipan':'quote','personality':'personality','kepribadian':'personality','persona':'personality'
  };

  text.split('\n').map(l => l.trim()).forEach(line => {
    const match = line.match(/([^:]+):\s*(.+)/i);
    if (match) {
      const field = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (fieldMapping[field]) data[fieldMapping[field]] = value;
    }
  });

  if (!data.name) {
    const nameMatch = text.match(/nama\s*:\s*([^\n]+)/i) || text.match(/name\s*:\s*([^\n]+)/i);
    if (nameMatch) data.name = nameMatch[1].trim();
  }
  if (!data.age) {
    const ageMatch = text.match(/umur\s*:\s*([^\n]+)/i) || text.match(/usia\s*:\s*([^\n]+)/i) || text.match(/age\s*:\s*([^\n]+)/i);
    if (ageMatch) data.age = ageMatch[1].trim();
  }

  if (!data.name || data.name==='❓') return {};
  return data;
}

// ===== COMMAND TAMBAHAN =====
module.exports.introList = async function(bot, m) {
  const remoteJid = m.key.remoteJid;
  if (!remoteJid.endsWith("@g.us")) return;
  const db = initDatabase();
  const groupData = db[remoteJid] || {};

  const introEntries = Object.entries(groupData).filter(([k]) => !k.startsWith('pending_'));
  if (introEntries.length === 0) return bot.sendMessage(remoteJid, { text: "📭 Belum ada yang buat intro di grup ini!\nGunakan .intro untuk mulai." }, { quoted: m });

  let listText = `📋 *DAFTAR INTRO GRUP* 📋\n\nTotal: ${introEntries.length} orang\n\n`;
  introEntries.forEach(([jid, data], idx) => { listText += `${idx+1}. @${jid.split('@')[0]} - ${data.name || 'No Name'}\n`; });
  listText += `\n👤 Gunakan .intro @tag untuk lihat detail`;
  const mentions = introEntries.map(([jid]) => jid);
  await bot.sendMessage(remoteJid, { text: listText, mentions }, { quoted: m });
};

console.log('[INTRO] Module loaded - Gen Z Intro System ready');
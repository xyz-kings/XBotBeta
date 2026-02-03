const { sleep, reactLoading } = require("../../lib/helperAnimasi");
module.exports = {
  command: "ipcht",
  async execute(bot, m, args) {
    try {
      const text = args.join(" ");

      if (!text) {
        return bot.sendMessage(
          m.key.remoteJid,
          {
            text:
`Teks nya mana njirr 😭

Cara pakai:
.ipcht <text>

Contoh:
.ipcht woi jangan lupa makan`
          },
          { quoted: m }
        );
      }
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      const apiURL =
        `https://api-ip-chat.vercel.app/api/ipchat?text=${encodeURIComponent(text)}`;

      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: apiURL },
          caption:
`📱 iPHOTO CHAT

"${text}"

© iPhoto Chat By XyzBots`
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[IPCHAT ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "iPhoto chat gagal njirr 😭" },
        { quoted: m }
      );
    }
  }
};
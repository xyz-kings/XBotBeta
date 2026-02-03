const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["bijak"],
  category: "quotes",
  description: "Quotes acak dari kategori bijak",
  
  async execute(bot, m, args) {
    try {
      const fileData = {
        file: "bijak",
        kategori: [
  "Kebijaksanaan Hidup",
  "Pengembangan Diri",
  "Hubungan & Interaksi",
  "Pengambilan Keputusan",
  "Penerimaan & Kepasrahan",
  "Ketangguhan Mental",
  "Kebijaksanaan Finansial",
  "Kebijaksanaan Spiritual"
]
      };
      
      const randomKategori = fileData.kategori[Math.floor(Math.random() * fileData.kategori.length)];
      const encodedKategori = encodeURIComponent(randomKategori);
      const response = await axios.get(
        `https://all-xquote.vercel.app/xyz/quote?${fileData.file}=${encodedKategori}`
      );
      
      if (!response.data || !response.data.quote) throw new Error("Quotes tidak ditemukan");
      
      const quote = response.data;
      let text = `📚 *${fileData.file.toUpperCase()} QUOTES*\n`;
      text += `🏷️ *Kategori:* ${randomKategori}\n\n`;
      text += `\"${quote.quote}\"\n\n`;
      text += `— ${quote.author || "Unknown"}`;
      if (quote.source) text += `, ${quote.source}`;
      text += `\n\n✨ _Quote acak dari ${fileData.kategori.length} kategori_`;
      
      await bot.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });
      
    } catch (err) {
      console.error(`[${fileData.file.toUpperCase()} ERROR]`, err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: `❌ Gagal mengambil quotes ${fileData.file}.\nCoba lagi nanti.` },
        { quoted: m }
      );
    }
  },
};

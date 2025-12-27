const fs = require("fs");
const path = require("path");

module.exports = {
  command: "xyzlist",
  category: "tools",
  description: "Tampilkan jumlah fitur/command bot secara ringkas, tanpa menghitung dirinya sendiri",
  
  async execute(bot, m) {
    try {
      const pluginsDir = path.join(__dirname, "../../plugin");
      if (!fs.existsSync(pluginsDir)) {
        return bot.sendMessage(m.key.remoteJid, { text: "❌ Folder plugin tidak ditemukan!" }, { quoted: m });
      }

      let totalCommands = 0;
      let totalCategories = 0;

      const categories = fs.readdirSync(pluginsDir).filter(f => fs.statSync(path.join(pluginsDir, f)).isDirectory());
      totalCategories = categories.length;

      for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category);
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith(".js"));

        for (const file of files) {
          try {
            const pluginPath = path.join(categoryPath, file);
            const plugin = require(pluginPath);

            if (plugin.command) {
              // hitung jumlah command
              let count = Array.isArray(plugin.command) ? plugin.command.length : 1;

              // kalau ini file xyzlist, jangan dihitung
              if (pluginPath === __filename) count = 0;

              totalCommands += count;
            }
          } catch (e) {
            // skip file error
          }
        }
      }

      const text = `🛠️ *=== BOT FEATURES LIST ===*\n\n` +
                   `> 📌 Total Commands: ${totalCommands}\n` +
                   `> 📌 Total Categories: ${totalCategories}\n` +
                   `────────────────────────────\n\n` +
                   `_🎯 *Report selesai!*_`;

      await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });

    } catch (err) {
      console.error("[XYZLIST] Error:", err);
      await bot.sendMessage(m.key.remoteJid, { text: "❌ Gagal scan fitur plugin." }, { quoted: m });
    }
  }
};
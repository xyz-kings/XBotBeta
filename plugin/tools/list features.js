const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["xyzlist", "totalfitur"],
  category: "tools",
  description: "Tampilkan jumlah fitur/command bot (free & premium)",
  
  async execute(bot, m) {
    try {
      const baseDir = path.join(__dirname, "../..");
      const pluginsDir = path.join(baseDir, "plugin");
      const premiumDir = path.join(baseDir, "premium");
      
      let freeCommands = 0;
      let premiumCommands = 0;
      let freeCategories = 0;
      let premiumCategories = 0;

      // Helper function untuk scan
      const scanDir = (dirPath, isPremium = false) => {
        if (!fs.existsSync(dirPath)) return;
        
        const categories = fs.readdirSync(dirPath).filter(f => 
          fs.statSync(path.join(dirPath, f)).isDirectory()
        );
        
        if (isPremium) {
          premiumCategories = categories.length;
        } else {
          freeCategories = categories.length;
        }
        
        for (const category of categories) {
          const categoryPath = path.join(dirPath, category);
          const files = fs.readdirSync(categoryPath).filter(f => f.endsWith(".js"));
          
          for (const file of files) {
            try {
              const pluginPath = path.join(categoryPath, file);
              if (pluginPath === __filename) continue;
              
              const plugin = require(pluginPath);
              
              if (plugin.command) {
                const count = Array.isArray(plugin.command) ? plugin.command.length : 1;
                
                if (isPremium) {
                  premiumCommands += count;
                } else {
                  freeCommands += count;
                }
              }
            } catch (e) {
              // skip error
            }
          }
        }
      };

      // Scan free
      scanDir(pluginsDir, false);
      
      // Scan premium
      scanDir(premiumDir, true);

      const totalCommands = freeCommands + premiumCommands;
      const totalCategories = freeCategories + premiumCategories;

      const text = `🛠️ *=== BOT FEATURES LIST ===*\n` +
                   `> 📌 Free : ${freeCommands}\n` +
                   `> 📌 Premium : ${premiumCommands}\n` +
                   `> 📌 Total feature : ${totalCommands}\n` +
                   `────────────────────────────\n\n` +
                   `_🎯 *Report selesai!*_`;

      await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });

    } catch (err) {
      console.error("[XYZLIST] Error:", err);
      await bot.sendMessage(m.key.remoteJid, { 
        text: "❌ Gagal scan fitur plugin." 
      }, { quoted: m });
    }
  }
};
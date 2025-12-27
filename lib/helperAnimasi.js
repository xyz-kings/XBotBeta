const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- REACT CHAT LOADING DEFAULT ---
const defaultReactFrames = ["🔁", "🔃", "🔄", "🔁", "🔃", "🔄", "🔁", "🔃", "🔄","✅"," 🇽 "];

/**
 * reactLoading
 * @param {Object} bot - instance bot
 * @param {Object} m - message object
 * @param {Array} frames - array emoji untuk animasi (optional)
 * @param {Number} interval - delay tiap frame ms (optional, default 200ms)
 */
async function reactLoading(bot, m, frames = defaultReactFrames, interval = 200) {
  for (let emoji of frames) {
    await bot.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
    await sleep(interval);
  }
}

module.exports = { sleep, reactLoading };
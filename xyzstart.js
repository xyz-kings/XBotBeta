const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const pino = require("pino");
const { question } = require("./lib/question");
const handler = require("./hendel");

const SESSION_DIR = "XyzSessions";

// Matikan TOTAL semua log Baileys
const logger = pino({ level: "silent" });

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR);

async function mulaiBot(usePairingCode = true) {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const bot = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: !usePairingCode,
    logger,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
  });

  /* =======================
     PAIRING CODE
  ======================= */
  if (usePairingCode && !bot.authState.creds.registered) {
    let pake = (await question("Pake pairing code ga? [Y/n]: ")).toLowerCase();
    if (pake === "n") return mulaiBot(false);

    const nomor = await question("Masukin nomor (628xxxx): ");
    const clean = nomor.replace(/\D/g, "");

    if (!/^\d{10,15}$/.test(clean)) {
      return mulaiBot(true);
    }

    const code = await bot.requestPairingCode(clean);
    console.clear();
    console.log(`\nKODE PAIRING:\n${code}\n`);
    console.log("WA → Perangkat tertaut → Tautkan via nomor\n");
  }

  let alreadyConnected = false;

  bot.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      if (alreadyConnected) return;
      alreadyConnected = true;

      handler.loadPlugins();
      handler.notifyOwner(bot);
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        alreadyConnected = false;
        return mulaiBot(true);
      }

      if (!alreadyConnected) {
        setTimeout(() => mulaiBot(usePairingCode), 5000);
      }
    }
  });

  bot.ev.on("creds.update", saveCreds);

  /* =======================
     MESSAGE HANDLER ONLY
     (NO CONSOLE LOG)
  ======================= */
  bot.ev.on("messages.upsert", async ({ messages }) => {
    for (const m of messages) {
      if (!m.message) continue;
      await handler.messageHandler(bot, m);
    }
  });
}

// START
mulaiBot().catch(() => {
  process.exit(1);
});
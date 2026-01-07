// index.js
require('./xyzstart');

// Biar process gak langsung mati
process.stdin.resume();

// Tangkap error biar PM2 gak panik
process.on('uncaughtException', err => {
  console.error('[ERROR]', err);
});

process.on('unhandledRejection', err => {
  console.error('[PROMISE ERROR]', err);
});

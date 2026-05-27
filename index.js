// =============================================
//   DripBot - Aternos 24/7 AFK Bot
//   Fixed & improved by Claude for ItsMeDrip
// =============================================

const mineflayer = require('mineflayer');
const express = require('express');

// ─── EDIT THESE ───────────────────────────────
const config = {
  host: 'DevXDarshXRohit.aternos.me',  // Your Aternos server address
  port: 63478,                          // Your Aternos server port
  username: 'DripBot',                  // Bot's username (offline/cracked server)
  version: '26.1.2',                    // Change to your server's Minecraft version
  reconnectDelay: 30000,                // Wait 30 seconds before reconnecting (ms)
};
// ──────────────────────────────────────────────

// Keep Render free tier alive (self-ping)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>🤖 DripBot Status</h1>
    <p>✅ Bot is running!</p>
    <p>Server: <b>${config.host}:${config.port}</b></p>
    <p>Connected: <b>${botConnected ? 'Yes' : 'No (retrying...)'}</b></p>
  `);
});

app.listen(PORT, () => {
  console.log(`[Web] Status page running on port ${PORT}`);
});

// ─── BOT LOGIC ────────────────────────────────
let bot = null;
let botConnected = false;

function createBot() {
  console.log(`[Bot] Connecting to ${config.host}:${config.port}...`);

  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version,
    auth: 'offline', // Use 'microsoft' if your server requires premium login
  });

  // ── Spawned successfully ──
  bot.on('spawn', () => {
    botConnected = true;
    console.log('[Bot] ✅ Joined the server!');

    // Anti-AFK: sneak every 4 minutes to avoid kick
    setInterval(() => {
      if (bot && botConnected) {
        bot.setControlState('sneak', true);
        setTimeout(() => {
          if (bot && botConnected) bot.setControlState('sneak', false);
        }, 500);
        console.log('[Bot] Anti-AFK sneak performed.');
      }
    }, 4 * 60 * 1000);
  });

  // ── Read chat messages ──
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`[Chat] <${username}> ${message}`);
  });

  // ── Handle kick ──
  bot.on('kicked', (reason) => {
    botConnected = false;
    console.log(`[Bot] ❌ Kicked: ${reason}`);
    console.log(`[Bot] Reconnecting in ${config.reconnectDelay / 1000}s...`);
    setTimeout(createBot, config.reconnectDelay);
  });

  // ── Handle errors (like ENOTFOUND when server is offline) ──
  bot.on('error', (err) => {
    botConnected = false;
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.log(`[Bot] ⚠️  Server offline or unreachable. Retrying in ${config.reconnectDelay / 1000}s...`);
    } else {
      console.log(`[Bot] ⚠️  Error: ${err.message}`);
    }
    setTimeout(createBot, config.reconnectDelay);
  });

  // ── Handle disconnect ──
  bot.on('end', (reason) => {
    botConnected = false;
    console.log(`[Bot] 🔌 Disconnected (${reason}). Reconnecting in ${config.reconnectDelay / 1000}s...`);
    setTimeout(createBot, config.reconnectDelay);
  });
}

// Start the bot!
createBot();

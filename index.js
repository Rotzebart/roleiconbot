// === Module laden ===
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const express = require("express");
const fs = require("fs");
const path = require("path");

// === Keep-Alive Server (Replit / Railway) ===
const app = express();
app.get("/", (req, res) => res.send("Bot läuft 24/7"));
app.listen(3000, () => console.log("🌐 Keep-Alive Server gestartet"));

// === Discord Client ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// === ICONS (Unicode-Emojis) ===
const ICONS = {
  tank: "🛡️",
  heal: "💚", // Grünes Herz
  dps: "⚔️",
};

// === Hilfsfunktionen ===
function cleanName(name) {
  // Entfernt alle ICONS aus dem Nickname
  const iconRegex = new RegExp(
    Object.values(ICONS)
      .map(e => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "g"
  );
  return name.replace(iconRegex, "").trim();
}

function parseIcons(name) {
  const icons = [];
  if (name.includes(ICONS.tank)) icons.push("tank");
  if (name.includes(ICONS.heal)) icons.push("heal");
  if (name.includes(ICONS.dps)) icons.push("dps");
  return icons;
}

function buildNameWithIcons(nickname, icons) {
  const iconStr = icons.map(i => ICONS[i]).join("");
  let newName = `${iconStr} ${nickname}`;
  if (newName.length > 32) {
    const allowed = 32 - iconStr.length - 1;
    newName = `${iconStr} ${nickname.slice(0, allowed)}`;
  }
  return newName;
}

// === Message-ID speichern ===
const DATA_FILE = path.join(__dirname, "roleMessage.json");

function saveMessageId(id) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ id }));
}

function loadMessageId() {
  if (!fs.existsSync(DATA_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")).id;
  } catch {
    return null;
  }
}

// === Ready Event ===
client.once("ready", async () => {
  console.log(`✅ Eingeloggt als ${client.user.tag}`);

  const guild = client.guilds.cache.first();
  if (!guild) return console.log("⚠️ Kein Server gefunden");

  const channel = guild.channels.cache.get("1469483502503333938"); // <-- Channel-ID
  if (!channel) return console.log("⚠️ Channel nicht gefunden");

  const botMember = guild.members.cache.get(client.user.id);
  if (!channel.permissionsFor(botMember)?.has(["ViewChannel", "SendMessages"])) {
    return console.log("⚠️ Fehlende Channel-Rechte");
  }

  const savedId = loadMessageId();
  if (savedId) {
    try {
      await channel.messages.fetch(savedId);
      console.log("📨 Button-Nachricht existiert bereits");
      return;
    } catch {}
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("tank")
      .setLabel("🛡️ Tank")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("heal")
      .setLabel("Heiler")
      .setEmoji("💚") // ✅ Unicode grünes Herz
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("dps")
      .setLabel("⚔️ DD")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("reset")
      .setLabel("❌ Reset")
      .setStyle(ButtonStyle.Secondary)
  );

  const msg = await channel.send({
    content:
      "🎮 **Wähle deine Rolle(n) für den Nickname**\nKlicken = an/aus • Reset = alles weg",
    components: [row],
  });

  saveMessageId(msg.id);
  console.log("📨 Button-Message gesendet");
});

// === Button Handling ===
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const member = interaction.member;
  if (!member.manageable) {
    return interaction.reply({
      content: "⚠️ Ich kann deinen Nickname nicht ändern",
      ephemeral: true,
    });
  }

  const currentName = member.nickname || member.user.username;
  let icons = parseIcons(currentName);

  if (interaction.customId === "reset") {
    icons = [];
  } else {
    if (icons.includes(interaction.customId)) {
      icons = icons.filter(i => i !== interaction.customId);
    } else {
      icons.push(interaction.customId);
    }
  }

  await member.setNickname(
    icons.length
      ? buildNameWithIcons(cleanName(currentName), icons)
      : cleanName(currentName)
  );

  await interaction.reply({
    content: "✅ Nickname aktualisiert",
    ephemeral: true,
  });
});

// === Login ===
client.login(process.env.BOT_TOKEN);

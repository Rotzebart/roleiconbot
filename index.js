// === Module laden ===
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const express = require("express");

// === Keep-Alive Server für Railway / Replit ===
const app = express();
app.get("/", (req, res) => res.send("Bot läuft 24/7"));
app.listen(3000, () => console.log("🌐 Keep-Alive Server gestartet"));

// === Discord Client ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// === Icons ===
const ICONS = {
  tank: "🛡️",
  heal: "🩹",
  dps: "⚔️",
};

// === Hilfsfunktionen ===
function cleanName(name) {
  return name.replace(/🛡️|🩹|⚔️/g, "").trim();
}

function parseIcons(name) {
  const icons = [];
  if (name.includes("🛡️")) icons.push("tank");
  if (name.includes("🩹")) icons.push("heal");
  if (name.includes("⚔️")) icons.push("dps");
  return icons;
}

function buildNameWithIcons(nickname, icons) {
  const iconStr = icons.map((i) => ICONS[i]).join("");
  let newName = `${iconStr} ${nickname}`;
  if (newName.length > 32) {
    const allowedLength = 32 - iconStr.length - 1;
    newName = `${iconStr} ${nickname.slice(0, allowedLength)}`;
  }
  return newName;
}

// === Ready Event ===
client.once("ready", async () => {
  console.log(`✅ Eingeloggt als ${client.user.tag}`);

  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log("⚠️ Bot ist in keinem Server!");
    return;
  }

  const channel = guild.channels.cache.get("1469483502503333938"); // <-- echte Channel-ID

  if (!channel) {
    console.log("⚠️ Channel nicht gefunden!");
    return;
  }

  // Rechte prüfen
  const botMember = guild.members.cache.get(client.user.id);
  if (!channel.permissionsFor(botMember).has(["SendMessages", "ViewChannel"])) {
    console.log("⚠️ Bot hat keine Berechtigung, in diesem Channel zu schreiben oder ihn zu sehen!");
    return;
  }

  // === Buttons erstellen ===
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("tank").setLabel("🛡️ Tank").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("heal").setLabel("🩹 Heiler").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("dps").setLabel("⚔️ DD").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("reset").setLabel("❌ Reset").setStyle(ButtonStyle.Secondary)
  );

  try {
    await channel.send({
      content:
        "🎮 **Wähle deine Rolle(n) für den Nickname:**\nKlicke auf die Buttons, um die Rollen vor deinem Namen anzuzeigen. Klicke erneut, um sie zu entfernen.",
      components: [row],
    });
    console.log("📨 Button-Message gesendet");
  } catch (err) {
    console.error("⚠️ Nachricht konnte nicht gesendet werden:", err.message);
  }
});

// === Button Event ===
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const member = interaction.member;
  if (member.permissions.has("ManageNicknames")) {
    await interaction.reply({ content: "⚠️ Admins können nicht geändert werden!", ephemeral: true });
    return;
  }

  const currentName = member.nickname || member.user.username;
  let icons = parseIcons(currentName);

  if (interaction.customId === "reset") {
    icons = [];
  } else {
    if (icons.includes(interaction.customId)) {
      icons = icons.filter((i) => i !== interaction.customId);
    } else {
      icons.push(interaction.customId);
    }
  }

  try {
  await member.setNickname(buildNameWithIcons(cleanName(currentName), icons));
  await interaction.reply({ content: "✅ Icons aktualisiert!", ephemeral: true });
} catch (err) {
  console.error("Fehler beim Nickname ändern:", err);
  // Wenn die ursprüngliche Reply schon gesendet wurde, nutze followUp
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content: "⚠️ Konnte Icons nicht setzen (fehlende Rechte?)", ephemeral: true });
  } else {
    await interaction.reply({ content: "⚠️ Konnte Icons nicht setzen (fehlende Rechte?)", ephemeral: true });
  }
}

});

// === Bot Login ===
client.login("MTQ2OTQ3MjkxNTQ1OTI3NjgzMg.GzPw5L.c_Zg-v5yIk7qec6yVDo2DZI02rEfyijjC-rci0"); // <-- Token hier direkt einsetzen





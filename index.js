const fs = require("fs");
require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], // Added MessageContent intent for reading message content
});

client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

console.log("Loading commands...");

for (const file of commandFiles) {
  console.log(`Loading file: ${file}`);
  const command = require(`./commands/${file}`);

  // Validate the command structure
  if (!command || !command.data || !command.data.name) {
    console.error(`❌ Skipping invalid command file: ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
  console.log(`✅ Loaded command: ${command.data.name}`);
}

// Register commands for a specific guild
async function registerCommands() {
  try {
    // Fetch guild from cache or from the API
    const guild = await client.guilds.fetch(guildId); // Ensure we have access to the guild
    const commands = client.commands.map(command => command.data.toJSON());
    await guild.commands.set(commands); // Register commands for your guild
    console.log('Commands have been registered for the guild!');
  } catch (error) {
    console.error('Error registering commands for guild:', error);
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(`${config.status}`, { type: "WATCHING" }); // Set the bot's activity status

  // Register commands after the bot is ready
  await registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing command: ${interaction.commandName}`, error);
    await interaction.reply({
      content: "There was an error while executing this command.",
      ephemeral: true,
    });
  }
});

client.login(process.env.token || token);

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display the command list.'),

    async execute(interaction) {
        await interaction.deferReply();  // Defer the reply to acknowledge the command

        const commandListEmbed = new EmbedBuilder()
            .setColor(config.color.default)
            .setTitle('Help Panel')
            .setDescription(`👋 Hello and welcome to **${interaction.guild.name}**! 🌟 We are here to provide you with the best services. 🚀`)
            .setImage(config.banner)
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 64 })) 
            .addFields({
                name: `Commands`,
                value: "`/help`   **Displays the help command**\n`/create` **Create a new service**\n`/free`   **Generate a reward**\n`/add`    **Add a reward to the stock**\n`/stock`  **View the current stock**\n`/premium` **Generate premium reward**"
            })
            .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
            .setTimestamp()
            .addFields({
                name: 'Useful Links',
                value: `[**Discord**](https://discord.gg/Xv3ACFDb6s)`
            });

        await interaction.editReply({ embeds: [commandListEmbed] });
    },
};

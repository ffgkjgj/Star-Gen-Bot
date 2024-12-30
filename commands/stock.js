const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('Display the service stock.'),

    async execute(interaction) {
        await interaction.deferReply();  // Defer the reply to acknowledge the command

        const freeStock = await getStock(`${__dirname}/../free/`);
        const premiumStock = await getStock(`${__dirname}/../premium/`);

        const embed = new EmbedBuilder()
            .setColor(config.color.default)
            .setTitle(`${interaction.guild.name} Service Stock`)
            .setDescription(`👋 Hello and welcome to **${interaction.guild.name}**! 🌟 We are here to provide you with the best services. 🚀`)
            .setFooter({ text: config.footer, iconURL: interaction.user.displayAvatarURL() })
            .setImage(config.banner);

        if (freeStock.length > 0) {
            const freeStockInfo = await getServiceInfo(`${__dirname}/../free/`, freeStock);
            embed.addFields({ name: 'Free Services', value: freeStockInfo, inline: true });
        }

        if (premiumStock.length > 0) {
            const premiumStockInfo = await getServiceInfo(`${__dirname}/../premium/`, premiumStock);
            embed.addFields({ name: 'Premium Services', value: premiumStockInfo, inline: true });
        }

        embed.addFields({ name: 'Useful Links', value: `[**Discord**](https://discord.gg/Xv3ACFDb6s)` });

        await interaction.editReply({ embeds: [embed] });
    },
};

async function getStock(directory) {
    try {
        const files = await fs.readdir(directory);
        const stock = files.filter(file => file.endsWith('.txt'));
        return stock;
    } catch (err) {
        console.error('Unable to scan directory: ' + err);
        return [];
    }
}

async function getServiceInfo(directory, stock) {
    const info = [];
    for (const service of stock) {
        const serviceContent = await fs.readFile(`${directory}/${service}`, 'utf-8');
        const lines = serviceContent.split(/\r?\n/);
        info.push(`**${service.replace('.txt', '')}:** \`${lines.length}\``);
    }
    return info.join('\n');
}

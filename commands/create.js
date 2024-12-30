const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js'); // Use EmbedBuilder instead of MessageEmbed
const fs = require('fs/promises');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

const log = new CatLoggr();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a new service.')
        .addStringOption(option =>
            option.setName('service')
                .setDescription('The name of the service to create')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of service (free or premium)')
                .setRequired(true)
                .addChoices(
                    { name: 'Free', value: 'free' },
                    { name: 'Premium', value: 'premium' },
                )),

    async execute(interaction) {
        await interaction.deferReply();  // Added deferReply()

        const service = interaction.options.getString('service');
        const type = interaction.options.getString('type');

        // Check for permissions
        if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('You Don\'t Have Permissions!')
                .setDescription('🛑 Only Admin Can Do This!')
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Validate service
        if (!service) {
            const missingParamsEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('Missing Parameters!')
                .setDescription('You need to specify a service name!')
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return interaction.editReply({ embeds: [missingParamsEmbed], ephemeral: true });
        }

        let filePath;
        if (type === 'free') {
            filePath = `${__dirname}/../free/${service}.txt`;
        } else if (type === 'premium') {
            filePath = `${__dirname}/../premium/${service}.txt`;
        } else {
            const invalidTypeEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('Invalid Service Type!')
                .setDescription('Service type must be "free" or "premium".')
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return interaction.editReply({ embeds: [invalidTypeEmbed], ephemeral: true });
        }

        try {
            await fs.writeFile(filePath, '');
            const successEmbed = new EmbedBuilder()
                .setColor(config.color.green)
                .setTitle('Service Created!')
                .setDescription(`Successfully created the new **${type}** service \`${service}\`!`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            interaction.editReply({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
            log.error(error);
            return interaction.editReply('An error occurred while creating the service.');
        }
    },
};

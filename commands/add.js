const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');  // Use EmbedBuilder
const fs = require('fs');
const os = require('os');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

const log = new CatLoggr();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add an account to a service.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of service (free or premium)')
                .setRequired(true)
                .addChoices(
                    { name: 'Free', value: 'free' },
                    { name: 'Premium', value: 'premium' },
                ))
        .addStringOption(option =>
            option.setName('service')
                .setDescription('The service to add the account to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('account')
                .setDescription('The account to add')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();  // Added deferReply()

        const service = interaction.options.getString('service');
        const account = interaction.options.getString('account');
        const type = interaction.options.getString('type');

        // Check for proper permissions
        if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('You Don\'t Have Permissions!')
                .setDescription('🛑 Only Admin Can Do This!')
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Validate inputs
        if (!service || !account || (type !== 'free' && type !== 'premium')) {
            const missingParamsEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('Missing Parameters or Invalid Type!')
                .setDescription('You need to specify a service, an account, and a valid type (free or premium)!')
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return interaction.editReply({ embeds: [missingParamsEmbed], ephemeral: true });
        }

        // Determine file path
        let filePath;
        if (type === 'free') {
            filePath = `${__dirname}/../free/${service}.txt`;
        } else if (type === 'premium') {
            filePath = `${__dirname}/../premium/${service}.txt`;
        }

        // Append account to the file
        fs.appendFile(filePath, `${os.EOL}${account}`, (error) => {
            if (error) {
                log.error(error);
                return interaction.editReply('An error occurred while adding the account.');
            }

            const successEmbed = new EmbedBuilder()
                .setColor(config.color.green)
                .setTitle('Account Added!')
                .setDescription(`Successfully added \`${account}\` to the \`${service}\` service (${type}).`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            interaction.editReply({ embeds: [successEmbed], ephemeral: true });
        });
    },
};

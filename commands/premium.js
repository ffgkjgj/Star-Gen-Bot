const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const { promisify } = require('util');
const config = require('../config.json');

const generated = new Set();  // Track users who have used the command
const readFileAsync = promisify(fs.readFile);  // Promisify fs.readFile

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Generate a specified premium service if stocked')
        .addStringOption(option =>
            option.setName('service')
                .setDescription('The name of the service to generate')
                .setRequired(true)),

    async execute(interaction) {
        let replied = false; // Track if a reply has been sent

        // Defer the reply only once
        if (!replied) {
            await interaction.deferReply();
            replied = true;
        }

        const service = interaction.options.getString('service');
        const member = interaction.member;

        // Check if the user has the "Premium" role using the role ID
        const premiumRoleId = config.premiumRoleId; // Set the role ID in your config.json
        if (!member.roles.cache.has(premiumRoleId)) {
            const noPermissionEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('Access Denied!')
                .setDescription(`You need the "Premium" role to use this command.`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();

            if (replied) {
                await interaction.editReply({ embeds: [noPermissionEmbed] });
            }
            return;
        }

        // Check for correct channel
        if (interaction.channelId !== config.premiumChannel) {
            const wrongChannelEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('Wrong Channel!')
                .setDescription(`You cannot use the \`/premium\` command here. Please use it in <#${config.premiumChannel}>!`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            if (replied) {
                await interaction.editReply({ embeds: [wrongChannelEmbed] });
            }
            return;
        }

        // Check if the user is an admin
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        // Check cooldown only if not an admin
        if (!isAdmin && generated.has(member.id)) {
            const cooldownEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('Cooldown!')
                .setDescription(`Please wait **${config.premiumCooldown}** seconds before using the command again.`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            if (replied) {
                await interaction.editReply({ embeds: [cooldownEmbed] });
            }
            return;
        }

        // Read the service file
        const filePath = `${__dirname}/../premium/${service}.txt`;

        try {
            const data = await readFileAsync(filePath, 'utf-8');  // Read the file asynchronously
            const accounts = data.split('\n').filter(Boolean);  // Filter out empty lines

            // Check if accounts are available
            if (accounts.length === 0) {
                const noAccountsEmbed = new EmbedBuilder()
                    .setColor(config.color.red)
                    .setTitle('No Accounts Available!')
                    .setDescription(`There are no accounts available for the service \`${service}\`. Please check back later!`)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setTimestamp();
                if (replied) {
                    await interaction.editReply({ embeds: [noAccountsEmbed] });
                }
                return;
            }

            // Generate the account
            const account = accounts[Math.floor(Math.random() * accounts.length)];

            // Split account data assuming it has username:password format
            const [username, password] = account.split(':'); // Assuming format: "username:password"
            const combo = `${username}:${password}`; // Combo is the username:password combination

            // Construct the success embed for the public chat
            const successEmbed = new EmbedBuilder()
                .setColor(config.color.green)
                .setTitle('Service Generated!')
                .setDescription(`Here is your account for **${service}**:`)
                .addFields(
                    { name: 'Username:', value: `\`${username}\``, inline: true },
                    { name: 'Password:', value: `\`${password}\``, inline: true },
                    { name: 'Combo:', value: `\`${combo}\``, inline: true }
                )
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            // Send the account info in DMs with a cleaner format
            try {
                await interaction.user.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(config.color.green)
                            .setTitle(`Successfully generated a ${service} account!`)
                            .addFields(
                                { name: 'Username:', value: `\`${username}\`` },
                                { name: 'Password:', value: `\`${password}\`` },
                                { name: 'Combo:', value: `\`${combo}\`` }
                            )
                            .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                            .setTimestamp(),
                    ],
                });

                // Notify the public channel that DM has been sent
                const publicChatEmbed = new EmbedBuilder()
                    .setColor(config.color.green)
                    .setDescription(`**Check your DM <@${interaction.user.id}>!**\n__If you do not receive the message, please unlock your private messages!__`)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setTimestamp();

                if (replied) {
                    await interaction.editReply({ embeds: [publicChatEmbed] });
                }

            } catch (err) {
                // Handle DM failure case
                const dmFailEmbed = new EmbedBuilder()
                    .setColor(config.color.red)
                    .setTitle('DM Failed!')
                    .setDescription(`Could not send the account details in your DMs. Please make sure your DMs are open!`)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                if (replied) {
                    await interaction.editReply({ embeds: [dmFailEmbed] });
                }
            }

            // Set cooldown for non-admins
            if (!isAdmin) {
                generated.add(member.id);
                setTimeout(() => generated.delete(member.id), config.premiumCooldown * 1000);
            }

            // Logging in a log channel
            const logChannel = interaction.guild.channels.cache.get(config.logChannel);
            if (logChannel) {
                logChannel.send(`User <@${interaction.user.id}> generated a ${service} account at ${new Date().toLocaleString()}`);
            }
        } catch (error) {
            // Handle the error if the file cannot be read
            const notFoundEmbed = new EmbedBuilder()
                .setColor(config.color.red)
                .setTitle('Generator Error!')
                .setDescription(`Service \`${service}\` does not exist!`)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            if (replied) {
                await interaction.editReply({ embeds: [notFoundEmbed] });
            }
        }
    },
};

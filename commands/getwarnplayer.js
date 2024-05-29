const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const db = require('../database.js'); // Import the database module

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getwarns')
        .setDescription('Affiche les avertissements d\'un joueur.')
        .addStringOption(option => 
            option.setName('joueur')
                .setDescription('Joueur dont vous voulez voir les avertissements')
                .setRequired(true)),
                
    async execute(interaction) {

        if (!interaction.member.roles.cache.has("1239224812275236926")) return interaction.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        const joueur = interaction.options.getString('joueur');

        // Query the database for warnings of the user
        const selectStmt = db.prepare(`SELECT reasons, warn_count, moderators, dates FROM warnings WHERE player = ?`);
        const row = selectStmt.get(joueur);

        if (!row) {
            return interaction.reply(`Aucun avertissement trouvé pour ce joueur.`);
        }

        const reasons = JSON.parse(row.reasons);
        const moderators = JSON.parse(row.moderators);
        const dates = JSON.parse(row.dates);
        const warnCount = row.warn_count;

        const embed = new EmbedBuilder()
            .setTitle(`Avertissements pour ${joueur}`)
            .setColor('#ff0000');

        for (let i = 1; i <= warnCount; i++) {
            embed.addFields(
                { name: `Avertissement ${i}`, value: `**Raison**: \`\`\`${reasons[`reason${i}`]}\`\`\`\n**Modérateur**: <@${moderators[`moderator${i}`]}>\n**Date**: <t:${Math.floor(new Date(dates[`date${i}`]).getTime() / 1000)}:F>`, inline: true }
            );
        }

        return interaction.reply({ embeds: [embed] });
    },
};

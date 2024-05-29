const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const db = require('../database.js'); // Import the database module

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Commande pour warn un joueur.')
        .addStringOption(option => 
            option.setName('joueur')
                .setDescription('Joueur à avertir')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('raison')
                .setDescription('Raison du warn')
                .setRequired(true)),
                
    async execute(interaction, client) {
        const GUILD_ID = '899959189496021022'; // Assurez-vous que ces ID sont des chaînes de caractères
        const CHANNEL_ID = '1245163552394711112';

        if (!interaction.member.roles.cache.has("1239224812275236926")) return interaction.reply("Vous n'avez pas la permission d'utiliser cette commande.");

        const joueur = interaction.options.getString('joueur');
        const nouvelleRaison = interaction.options.getString('raison');
        const date = new Date().toISOString();
        const moderator = interaction.user.id;

        // Insert or update the warning in the database
        const selectStmt = db.prepare(`SELECT reasons, warn_count, moderators, dates FROM warnings WHERE player = ?`);
        const row = selectStmt.get(joueur);

        let reasons;
        let moderators;
        let dates;
        let warnCount;
        if (row) {
            // User already has warnings, update the JSON reasons, moderators, and dates
            reasons = JSON.parse(row.reasons);
            moderators = JSON.parse(row.moderators);
            dates = JSON.parse(row.dates);
            warnCount = row.warn_count + 1;
            reasons[`reason${warnCount}`] = nouvelleRaison;
            moderators[`moderator${warnCount}`] = moderator;
            dates[`date${warnCount}`] = date;
            const updateStmt = db.prepare(`UPDATE warnings SET reasons = ?, date = ?, warn_count = ?, moderators = ?, dates = ? WHERE player = ?`);
            updateStmt.run(JSON.stringify(reasons), date, warnCount, JSON.stringify(moderators), JSON.stringify(dates), joueur);
        } else {
            // First warning for this user
            reasons = { reason1: nouvelleRaison };
            moderators = { moderator1: moderator };
            dates = { date1: date };
            warnCount = 1;
            const insertStmt = db.prepare(`INSERT INTO warnings (player, reasons, date, warn_count, moderators, dates) VALUES (?, ?, ?, ?, ?, ?)`);
            insertStmt.run(joueur, JSON.stringify(reasons), date, warnCount, JSON.stringify(moderators), JSON.stringify(dates));
        }

        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            return interaction.reply(`Le serveur avec l'ID ${GUILD_ID} est introuvable.`);
        }

        const channel = guild.channels.cache.get(CHANNEL_ID);
        if (!channel) {
            return interaction.reply(`Le canal avec l'ID ${CHANNEL_ID} est introuvable.`);
        }

        const embed = new EmbedBuilder()
            .setTitle('Avertissement')
            .addFields(
                { name: 'Nom du joueur', value: joueur, inline: true },
                { name: 'Nombre de warns total', value: warnCount.toString(), inline: true },
                { name: 'Modérateur', value: `<@${moderator}>`, inline: true },
                { name: 'Raison', value: `\`\`\`${nouvelleRaison}\`\`\``, inline: true },
            )
            .setTimestamp()
            .setColor('#ff0000');

        await channel.send({ embeds: [embed] });
        return interaction.reply(`Le joueur ${joueur} a été averti.`);
    },
};

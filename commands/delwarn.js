const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('../database.js'); // Import the database module

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('Supprime un avertissement d\'un joueur ou tous les avertissements.')
        .addStringOption(option => 
            option.setName('joueur')
                .setDescription('Joueur dont vous voulez supprimer l\'avertissement')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('numero')
                .setDescription('Numéro de l\'avertissement à supprimer (laisser vide pour tout supprimer)')
                .setRequired(false)),
                
    async execute(interaction) {

        if (!interaction.member.roles.cache.has("1239224812275236926")) return interaction.reply("Vous n'avez pas la permission d'utiliser cette commande.");

        const joueur = interaction.options.getString('joueur');
        const numero = interaction.options.getInteger('numero');

        // Query the database for warnings of the user
        const selectStmt = db.prepare(`SELECT reasons, warn_count, moderators, dates FROM warnings WHERE player = ?`);
        const row = selectStmt.get(joueur);

        if (!row) {
            return interaction.reply(`Aucun avertissement trouvé pour ce joueur.`);
        }

        let reasons = JSON.parse(row.reasons);
        let moderators = JSON.parse(row.moderators);
        let dates = JSON.parse(row.dates);
        let warnCount = row.warn_count;

        if (numero) {
            // Supprimer un avertissement spécifique
            if (numero < 1 || numero > warnCount) {
                return interaction.reply(`L'avertissement numéro ${numero} n'existe pas.`);
            }

            delete reasons[`reason${numero}`];
            delete moderators[`moderator${numero}`];
            delete dates[`date${numero}`];

            // Reorganize the warnings
            reasons = Object.keys(reasons).sort().reduce((obj, key, index) => {
                obj[`reason${index + 1}`] = reasons[key];
                return obj;
            }, {});

            moderators = Object.keys(moderators).sort().reduce((obj, key, index) => {
                obj[`moderator${index + 1}`] = moderators[key];
                return obj;
            }, {});

            dates = Object.keys(dates).sort().reduce((obj, key, index) => {
                obj[`date${index + 1}`] = dates[key];
                return obj;
            }, {});

            warnCount--;

            const updateStmt = db.prepare(`UPDATE warnings SET reasons = ?, warn_count = ?, moderators = ?, dates = ? WHERE player = ?`);
            updateStmt.run(JSON.stringify(reasons), warnCount, JSON.stringify(moderators), JSON.stringify(dates), joueur);

            return interaction.reply(`L'avertissement numéro ${numero} du joueur ${joueur} a été supprimé.`);
        } else {
            // Supprimer tous les avertissements
            const deleteStmt = db.prepare(`DELETE FROM warnings WHERE player = ?`);
            deleteStmt.run(joueur);

            return interaction.reply(`Tous les avertissements du joueur ${joueur} ont été supprimés.`);
        }
    },
};

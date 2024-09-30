const { SlashCommandBuilder } = require('@discordjs/builders');
const { writeFileSync, readFileSync, existsSync } = require('fs');
const path = require('path');

const ttsConfigPath = path.join(__dirname, '..', 'ttsConfig.json');

const voices = [
    { name: 'Zombie', value: 'en_female_zombie' },
    { name: 'Narrator (Chris)', value: 'en_uk_001' },
    { name: 'UK Male 2', value: 'en_uk_003' },
    { name: 'Peaceful', value: 'en_female_emotional' },
    { name: 'Metro (Eddie)', value: 'en_au_001' },
    { name: 'Smooth (Alex)', value: 'en_au_002' },
    { name: 'Jessie', value: 'en_us_002' },
    { name: 'Professor', value: 'en_us_007' },
    { name: 'Scientist', value: 'en_us_009' },
    { name: 'Confidence', value: 'en_us_010' },
    { name: 'Empathetic', value: 'en_female_samc' },
    { name: 'Serious', value: 'en_male_cody' },
    { name: 'Story Teller', value: 'en_male_narration' },
    { name: 'Wacky', value: 'en_male_funny' },
    { name: 'Author', value: 'en_male_santa_narration' },
    { name: 'Bae', value: 'en_female_betty' },
    { name: 'Beauty Guru', value: 'en_female_makeup' },
    { name: 'Bestie', value: 'en_female_richgirl' },
    { name: 'singer guy idk', value: 'en_female_f08_warmy_breeze' },
    { name: 'Debutante', value: 'en_female_shenna' },
    { name: 'Ghost Host', value: 'en_male_ghosthost' },
    { name: 'Grandma', value: 'en_female_grandma' },
    { name: 'Lord Cringe', value: 'en_male_ukneighbor' },
    { name: 'Magician', value: 'en_male_wizard' },
    { name: 'Marty', value: 'en_male_trevor' }
];


module.exports = {
    data: new SlashCommandBuilder()
        .setName('setvoice')
        .setDescription('Set your TTS voice')
        // swap options for search at some point thanks snazzah
        .addStringOption(option =>
            option.setName('voice')
                .setDescription('Choose a voice')
                .setRequired(true)
                .addChoices(...voices.map(voice => ({ name: voice.name, value: voice.value })))
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const selectedVoice = interaction.options.getString('voice');

        let ttsConfig = {};

        if (existsSync(ttsConfigPath)) {
            try {
                const fileContent = readFileSync(ttsConfigPath, 'utf8');
                ttsConfig = fileContent ? JSON.parse(fileContent) : {};
            } catch (error) {
                console.error('no ttsConfig.json pls fix', error);
                return interaction.reply({content: 'smth shat itself my bad', ephemeral: true});
            }
        } else {
            ttsConfig = {};
        }

        ttsConfig[userId] = { voice: selectedVoice };

        try {
            writeFileSync(ttsConfigPath, JSON.stringify(ttsConfig, null, 2));
            await interaction.reply({content: `Your TTS voice has been set to ${selectedVoice}`, ephemeral: true});
        } catch (error) {
            console.error('cant write to ttsConfig.json idk', error);
            await interaction.reply({content: 'i fucked up oops try again.', ephemeral: true});
        }
    },
};
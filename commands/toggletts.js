const { SlashCommandBuilder } = require('@discordjs/builders');

let trackedUsers = []

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle_tts')
        .setDescription('Start or stop tracking messages for TTS generation.'),
    async execute(interaction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const userRoles = member.roles.cache.map(role => role.id);
        console.log(interaction.channel.id)
        if (interaction.channel.id !== process.env.VC_CHANNEL_ID) {
            await interaction.reply({ content: 'can only use this in vc-tts', ephemeral: true });
            return;
        }
        
        if (trackedUsers.includes(interaction.user.id)){
            const index = trackedUsers.indexOf(interaction.user.id);
            
            if (index !== -1) {
                trackedUsers.splice(index, 1);
            } 
        }else{
            trackedUsers.push(interaction.user.id)
            console.log(trackedUsers)
            await interaction.reply({content: "started tracking messages", ephemeral: true})
        }

    },
    trackedUsers
};

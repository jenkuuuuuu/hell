const SpotifyWebApi = require('spotify-web-api-node');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

const spotifyConfigPath = path.resolve(__dirname, '../spotifyConfig.json');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NGROK_URI
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('connect_spotify')
    .setDescription('Connect your Spotify account to the bot'),
  async execute(interaction) {
    const userId = interaction.user.id;

    let spotifyConfig;
    try {
      if (!fs.existsSync(spotifyConfigPath)) {
        spotifyConfig = {};
        fs.writeFileSync(spotifyConfigPath, JSON.stringify(spotifyConfig));
      } else {
        const fileContent = fs.readFileSync(spotifyConfigPath, 'utf-8');
        spotifyConfig = fileContent ? JSON.parse(fileContent) : {};
      }
    } catch (error) {
      console.error('FUCK', error);
      await interaction.reply({
        content: 'HOW DO YOU EVEN DO THIS ONE',
        ephemeral: true
      });
      return;
    }

    if (spotifyConfig[userId]) {
      await interaction.reply({
        content: 'u already connected ur account!',
        ephemeral: true
      });
      return;
    }

    const authUrl = spotifyApi.createAuthorizeURL(['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state', 'playlist-read-private', 'playlist-read-collaborative', ''], userId);

    await interaction.reply({
      content: `click [this](${authUrl}) to connect ur account!`,
      ephemeral: true
    });
  }
};

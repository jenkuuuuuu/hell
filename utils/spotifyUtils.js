const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// this does not work and god i dont know why

const spotifyConfigPath = path.resolve(__dirname, '../spotifyConfig.json');

function loadSpotifyConfig() {
  if (!fs.existsSync(spotifyConfigPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(spotifyConfigPath));
}

function saveSpotifyConfig(spotifyConfig) {
  fs.writeFileSync(spotifyConfigPath, JSON.stringify(spotifyConfig, null, 2));
}

function storeUserToken(userId, accessToken, refreshToken) {
  let spotifyConfig = loadSpotifyConfig();
  spotifyConfig[userId] = { accessToken, refreshToken };
  saveSpotifyConfig(spotifyConfig);
}

async function refreshAccessToken(userId) {
    const spotifyConfig = loadSpotifyConfig();
    const { refreshToken } = spotifyConfig[userId];
    
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    spotifyApi.setRefreshToken(refreshToken);

    try {
        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body['access_token'];
        spotifyConfig[userId].accessToken = newAccessToken;
        
        saveSpotifyConfig(spotifyConfig);
        console.log(`refreshed for ${userId}`);
    } catch (error) {
        console.error(`didnt refresh idk ${userId}:`, error);
    }
}


async function currentSong(client) {
    console.log("checking");
    const spotifyConfig = loadSpotifyConfig();

    for (const userId in spotifyConfig) {
        const { accessToken, refreshToken } = spotifyConfig[userId];
        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: process.env.NGROK_URI
        });
        spotifyApi.setAccessToken(accessToken);
        
        console.log(`im trying my best bro, ${userId} token:`, accessToken);

        try {
            await fetchAndSendUpdate(spotifyApi, userId, client);
        } catch (err) {
            console.error(`AAAAAAAAAAAAAAAAA ${userId}:`, err);
            if (err.statusCode === 401) {
                console.log(`token expired for user ${userId}. i hate my life`);
                await refreshAccessToken(userId);
                
                const newAccessToken = spotifyConfig[userId].accessToken;
                spotifyApi.setAccessToken(newAccessToken);

                try {
                    await fetchAndSendUpdate(spotifyApi, userId, client);
                } catch (retryErr) {
                    console.error(`GOD FUCKING DAMNIT STUPID FUCKING BOT DIE ${userId}:`, retryErr);
                }
            } else if (err.statusCode === 403) {
                console.error(`${userId} no perms for access playback i think idk anymore even though i CLEARLY fucking addded the scopes to the auth uri`);
            } else {
                console.error(`i hate everything`, err);
                if (err.body) {
                    console.error('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', err.body);
                }
            }
        }
    }
}


async function fetchAndSendUpdate(spotifyApi, userId, client) {
    const currentlyPlaying = await spotifyApi.getMyCurrentPlaybackState();

    if (currentlyPlaying.body && currentlyPlaying.body.is_playing) {
        const track = currentlyPlaying.body.item;
        const albumImage = track.album.images[0]?.url || '';

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle(`Now Playing: ${track.name}`)
            .setURL(track.external_urls.spotify)
            .setDescription(`By **${track.artists.map(artist => artist.name).join(', ')}**`)
            .setThumbnail(albumImage)
            .addFields(
                { name: 'Album', value: track.album.name, inline: true },
                { name: 'Duration', value: `${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}`, inline: true }
            )
            .setTimestamp();

        const channel = await client.channels.fetch(process.env.SPOTIFY_CHANNEL);
        await channel.send({
            content: `<@${userId}>`,
            embeds: [embed],
            allowedMentions: { users: [] }
        });
    }
}


module.exports = {
  currentSong,
  storeUserToken
};

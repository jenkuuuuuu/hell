require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { getRandomPost } = require('./utils/reddit');
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const tts = require("./utils/tts");
const { handleVoiceStateUpdate, handleMessageCreate } = require('./events/voice');
const { config } = require('tiktok-tts');
const spotifyUtils = require('./utils/spotifyUtils')

config(process.env.TIKTOK_SESSIONID, 'https://api19-normal-c-useast2a.tiktokv.com/media/api/text/speech/invoke');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    allowedMentions: { parse: ['roles'] },
    partials: [Partials.Channel, Partials.Message]
});

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.NGROK_URI
});

function storeUserToken(userId, accessToken, refreshToken) {
    const spotifyConfigPath = path.resolve(__dirname, 'spotifyConfig.json');
    let spotifyConfig = {};

    if (fs.existsSync(spotifyConfigPath)) {
        try {
            const data = fs.readFileSync(spotifyConfigPath);
            spotifyConfig = JSON.parse(data);
        } catch (error) {
            console.error('i copy and pasted this from the other file idk if it doesnt work who cares', error);
        }
    }

    spotifyConfig[userId] = { accessToken, refreshToken };

    try {
        fs.writeFileSync(spotifyConfigPath, JSON.stringify(spotifyConfig, null, 2));
        console.log(`got tokens for user ${userId}`);
    } catch (error) {
        console.error('couldnt write to config aaaa', error);
    }
}

const app = express();
const port = 80;

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    console.log("registered command: ", command);
    client.commands.set(command.data.name, command);
}
app.get('/callback', async (req, res) => {
    console.log("Callback received:", req.query);
    const code = req.query.code || null;
    const userId = req.query.state || null;

    if (!userId) {
        console.error('no uid');
        return res.send('no uid');
    }

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];

        storeUserToken(userId, accessToken, refreshToken);
        console.log(`saved tokens for user: ${userId}`);

        res.send('account connected! pls close this window.');
    } catch (err) {
        console.log('OAuth callback fucked up idk', err);
        res.send('error connecting spotify acc');
    }
});


app.listen(port, () => {
    console.log(`OAuth2 server running on http://localhost:${port}`);
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const channel = client.channels.cache.get(process.env.REDDIT_CHANNEL_ID);

    cron.schedule('*/3 * * * *', async () => {
        const post = await getRandomPost();
        if (post && channel) {
            channel.send(post);
        } else {
            console.error('Something went wrong with reddit idk');
        }
    });
    cron.schedule('*/1 * * * *', async () => {
        await spotifyUtils.currentSong(client);
        console.log("done!")
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'man', ephemeral: true });
    }
});

client.on('messageCreate', async (message) => {
    console.log("got message", message.content);
    await handleMessageCreate(client, message, tts);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    handleVoiceStateUpdate(client, oldState, newState);
});

client.login(process.env.TOKEN);

const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');
const { existsSync, readFileSync } = require('fs');
const path = require('path');

const ttsConfigPath = path.join(__dirname, '..', 'ttsConfig.json');
const defaultVoice = '';
const rlTime = 10000;
const lastReplyTimes = new Map();

function cleanMessage(messageContent) {
    return messageContent.replace(/[^\w\s]|[\u{1F600}-\u{1F64F}]/gu, ''); 
}

async function handleMessageCreate(client, message, tts) {
    console.log("hi yes i got it");
    if (message.author.bot) return;

    const userId = message.author.id;
    const member = message.guild.members.cache.get(userId);

    const bannedUsers = [""];
    
    if (bannedUsers.includes(member.user.id)) {
        const now = Date.now();
        const lastReplyTime = lastReplyTimes.get(userId) || 0;

        if (now - lastReplyTime >= rlTime) {
            lastReplyTimes.set(userId, now);
            return await message.reply({ content: "no fuck you", ephemeral: true });
        } else {
            console.log("Rate limit in effect for banned user, no reply sent.");
            return;
        }
    }

    console.log(message.channel.id);
    console.log(process.env.VC_CHANNEL_ID);

    if (message.channel.id !== process.env.VC_CHANNEL_ID) return;

    const { trackedUsers } = require('../commands/toggletts');

    console.log("hi yes first bit worked");

    if (trackedUsers.includes(userId)) {
        console.log("hi yes if statement worked");
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) return;

        const cleanedMessage = cleanMessage(message.content);

        const existingConnection = getVoiceConnection(message.guild.id);
        let connection;

        if (!existingConnection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false,
            });

            connection.once(VoiceConnectionStatus.Ready, () => {
                console.log('Connected to voice channel');
            });

            connection.once(VoiceConnectionStatus.Disconnected, () => {
                console.log('Disconnected from voice channel');
            });
        } else {
            connection = existingConnection;
            console.log('Already connected to the voice channel');
        }

        const player = createAudioPlayer();
        const ttsFilePath = './tts';

        let userVoice = defaultVoice;
        if (existsSync(ttsConfigPath)) {
            const ttsConfig = JSON.parse(readFileSync(ttsConfigPath, 'utf8'));
            if (ttsConfig[userId] && ttsConfig[userId].voice) {
                userVoice = ttsConfig[userId].voice;
            }
        }

        await tts.createAudioFromText(cleanedMessage, ttsFilePath, userVoice);
        console.log(`Audio file generated with voice: ${userVoice}`);

        const audioResource = createAudioResource('./tts.mp3');
        player.play(audioResource);
        connection.subscribe(player);
    }
}

function handleVoiceStateUpdate(client, oldState, newState) {
    const voiceChannelId = process.env.VC_ID;
    if (newState.channelId === voiceChannelId || oldState.channelId === voiceChannelId) {
        const voiceChannel = client.channels.cache.get(voiceChannelId);

        if (voiceChannel) {
            const members = voiceChannel.members;
            if (members.size === 0) {
                const connection = getVoiceConnection(voiceChannel.guild.id);
                if (connection) {
                    connection.destroy();
                }
            }
        }
    }
}

module.exports = { handleVoiceStateUpdate, handleMessageCreate };

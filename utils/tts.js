const { createAudioFromText } = require('tiktok-tts');

async function generateTTS(text, outputFilePath, voice) {
    try {
        await createAudioFromText(text, outputFilePath, voice);
        console.log('generated', outputFilePath);
    } catch (err) {
        console.error('oh', err);
    }
}

module.exports = {
    createAudioFromText: generateTTS
};

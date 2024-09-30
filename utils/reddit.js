const axios = require('axios');

async function getRandomPost() {
    try {
        const response = await axios.get(`https://www.reddit.com/r/${process.env.SUBREDDIT}/hot.json?limit=100`);
        const posts = response.data.data.children;
        if (posts.length === 0) {
            return;
        }
        const randomPost = posts[Math.floor(Math.random() * posts.length)].data;
        return `**${randomPost.title}**\n${randomPost.url}`;
    } catch (err) {
        console.error('SHIT', err);
        return;
    }
}

module.exports = { getRandomPost };

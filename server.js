const dotenv = require("dotenv");
const express = require("express");
const { App } = require("@slack/bolt");

const app = express();
const processedEventsCache = new Set();

const PORT = process.env.PORT || 3000;
const WELCOME_CHANNEL_ID = "C067KH1AG8M";

dotenv.config();

// Middleware to parse raw request bodies as JSON
app.use("/slack/events", express.raw({ type: "application/json" }));

// Initialize Slack Bolt App
const boltApp = new App({
  signingSecret: process.env.SIGNING_SECRET,
  token: process.env.API_KEY,
  processBeforeResponse: true,
});

const validateChannelName = async (channelName, client) => {
  const result = await client.conversations.list();
  const existingChannels = result.channels.map((channel) => channel.name);
  if (existingChannels.includes(channelName)) {
    channelName = channelName + "1";
  }

  return channelName;
};

// Handle team_join event
boltApp.event("team_join", async ({ event, client }) => {
  // Extract user information
  const { user } = event;

  const data = {
    welcome_message: `:wave: Welcome to your private Slack channel <@${user.id}>!\n\nTake a quick peek at the <#${WELCOME_CHANNEL_ID}> channel for important info.\n\nReady to discuss more your project? Pick a time that suits you on our <https://jaypay.setmore.com/jakubplechac|Meeting Scheduler>.\n\nFeel free to ask any questions and share your thoughts.`,
  };

  // Check if the user has been processed
  if (!processedEventsCache.has(user.id)) {
    processedEventsCache.add(user.id);

    // Create a private channel with the user's name
    const channelName = await validateChannelName(
      user.id.toLowerCase(),
      client
    );

    console.log(channelName);

    const result = await client.conversations.create({
      name: channelName,
      is_private: true,
    });

    // Invite the user to the channel
    await client.conversations.invite({
      channel: result.channel.id,
      users: user.id,
    });

    // Send a welcome message
    await client.chat.postMessage({
      channel: result.channel.id,
      text: data["welcome_message"],
    });
  }
});

// Start the Slack Bolt app
(async () => {
  await boltApp.start(PORT);

  console.log("⚡️ Bolt app is running!");
})();

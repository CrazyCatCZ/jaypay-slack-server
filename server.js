const express = require("express");
const { App } = require("@slack/bolt");
const dotenv = require("dotenv");

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

// Middleware to parse raw request bodies as JSON
app.use("/slack/events", express.raw({ type: "application/json" }));

// Initialize Slack Bolt App
const boltApp = new App({
  signingSecret: process.env.SIGNING_SECRET,
  token: process.env.API_KEY,
});

const validatedChannelName = (name) => {
  // Replace invalid characters with underscores
  const sanitized = name.replace(/[^a-z0-9-_]/g, "_");

  // Ensure the length is 21 characters or less
  return sanitized.substring(0, 21);
};

// Handle team_join event
boltApp.event("team_join", async ({ event, client }) => {
  console.log("team_join triggred");
  try {
    // Extract user information
    const { user } = event;

    console.log(user);

    // Create a private channel with the user's name
    const channelName = validatedChannelName(user.name.toLowerCase());
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
      text: `Welcome, ${user.name}! This is your private channel.`,
    });
  } catch (error) {
    console.error("Error handling team_join event:", error);
  }
});

// Start the Slack Bolt app
(async () => {
  await boltApp.start(PORT);

  console.log("⚡️ Bolt app is running!");
})();

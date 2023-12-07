const { App } = require("@slack/bolt");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse raw request bodies as JSON
app.use("/slack/events", express.raw({ type: "application/json" }));

// Initialize Slack Bolt App
const boltApp = new App({
  signingSecret: "YOUR_SIGNING_SECRET",
  token: "YOUR_BOT_TOKEN",
});

// Start the Slack Bolt app
(async () => {
  await boltApp.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();

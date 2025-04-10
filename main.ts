// main.ts
import { Bot } from "https://deno.land/x/discordeno@18.0.1/mod.ts";
import { TwitterApi } from "https://esm.sh/twitter-api-v2@1.12.5";

// Initialize Discord bot with required intents
const bot = new Bot({
  token: Deno.env.get("DISCORD_TOKEN")!,
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

// Initialize Twitter client
const twitter = new TwitterApi(Deno.env.get("TWITTER_BEARER_TOKEN")!);

// Store the last seen tweet ID
let lastTweetId = Deno.env.get("LAST_TWEET_ID") || "";

// Function to check for new tweets and send to Discord
async function checkForNewTweets() {
  try {
    console.log("Checking for new tweets...");
    
    // Get user's timeline (excluding replies)
    const timeline = await twitter.v2.userTimeline(
      Deno.env.get("TWITTER_USER_ID")!,
      { 
        exclude: "replies",
        expansions: ["attachments.media_keys"],
        "media.fields": ["url", "preview_image_url", "type"]
      }
    );

    // Get the most recent tweet
    const latestTweet = timeline.data.data?.[0];
    const includesMedia = timeline.includes?.media?.[0];

    if (!latestTweet) {
      console.log("No tweets found");
      return;
    }

    // Check if this is a new tweet
    if (latestTweet.id !== lastTweetId) {
      console.log(`New tweet detected: ${latestTweet.id}`);
      
      // Build Discord message
      let messageContent = `**New Tweet from ${timeline.includes?.users?.[0]?.name}**\n`;
      messageContent += `${latestTweet.text}\n`;
      messageContent += `🔗 https://fxtwitter.com/i/status/${latestTweet.id}`;

      // Add media URL if present
      if (includesMedia?.url) {
        messageContent += `\n\n${includesMedia.url}`;
      }

      // Send to Discord
      await bot.helpers.sendMessage(Deno.env.get("DISCORD_CHANNEL_ID")!, {
        content: messageContent
      });

      // Update last seen tweet ID
      lastTweetId = latestTweet.id;
      console.log("Tweet sent to Discord successfully");
    } else {
      console.log("No new tweets since last check");
    }
  } catch (err) {
    console.error("Error checking tweets:", err);
  }
}

// When bot is ready, start checking for tweets
bot.events.ready = () => {
  console.log(`Bot connected as ${bot.id}`);
  
  // Initial check
  checkForNewTweets();
  
  // Set up regular checks (every 5 minutes)
  setInterval(checkForNewTweets, 300000);
};

// Start the bot
await bot.start();
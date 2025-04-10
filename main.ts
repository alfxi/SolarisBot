// main.ts
import { Bot } from "https://deno.land/x/discordeno@18.0.1/mod.ts";
import { TwitterApi } from "https://esm.sh/twitter-api-v2@1.12.5";

const bot = new Bot({
  token: Deno.env.get("DISCORD_TOKEN")!,
  intents: ["Guilds", "GuildMessages"],
});

const twitter = new TwitterApi(Deno.env.get("TWITTER_BEARER_TOKEN")!);
let lastTweetId = "";

bot.events.ready = () => {
  setInterval(async () => {
    try {
      const timeline = await twitter.v2.userTimeline(
        Deno.env.get("TWITTER_USER_ID")!,
        { exclude: "replies" }
      );
      const latestTweet = timeline.data.data[0];
      
      if (latestTweet?.id !== lastTweetId) {
        await bot.helpers.sendMessage(Deno.env.get("DISCORD_CHANNEL_ID")!, {
          content: `New tweet: ${latestTweet.text}\nhttps://twitter.com/i/status/${latestTweet.id}`
        });
        lastTweetId = latestTweet.id;
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }, 300000); // 5 minutes
};

await bot.start();
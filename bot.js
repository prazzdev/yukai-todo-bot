require("dotenv").config({ path: ".env.local" });
const { Telegraf, session } = require("telegraf");
const commands = require("./src/commands");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return next();
});
commands.register(bot);
bot.launch();

console.log(`${process.env.BOT_NAME} is running! 🎉`);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

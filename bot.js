const { Telegraf } = require("telegraf");
require("dotenv").config({ path: ".env.local" });
const commands = require("./src/commands");

const bot = new Telegraf(process.env.BOT_TOKEN);

commands.register(bot);

bot.launch();
console.log(`${process.env.BOT_NAME} is running! 🎉`);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

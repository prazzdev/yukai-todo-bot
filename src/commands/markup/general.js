const { Markup } = require("telegraf");
const { button } = require("../../utils/markup");

require("dotenv").config({ path: ".env.local" });

const tasksButton = Markup.inlineKeyboard([
  [button("Tasks"), button("Categories")],
  [button("Help"), button("About")],
  [button("More Options")],
]);

module.exports = (bot) => {
  bot.start((ctx) => {
    ctx.reply(
      `Hai, ${ctx.from.first_name}! Aku ${process.env.BOT_NAME}, bot To-Do list kamu! 🌸\nGunakan perintah berikut:`,
      tasksButton
    );
  });

  bot.action("start", (ctx) => {
    ctx.editMessageText(
      `Hai, ${ctx.from.first_name}! Aku ${process.env.BOT_NAME}, bot To-Do list kamu! 🌸\nGunakan perintah berikut:`,
      tasksButton
    );
  });
};

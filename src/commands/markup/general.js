const { Markup } = require("telegraf");

require("dotenv").config({ path: ".env.local" });

module.exports = (bot) => {
  bot.start((ctx) => {
    ctx.reply(
      `Hai, ${ctx.from.first_name}! Aku ${process.env.BOT_NAME}, bot To-Do list kamu! 🌸\nGunakan perintah berikut:`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("Tasks", "tasks"),
          Markup.button.callback("Categories", "categories"),
        ],
        [
          Markup.button.callback("Help", "help"),
          Markup.button.callback("About", "about"),
        ],
        [Markup.button.callback("More Options", "more_options")],
      ])
    );
  });
};

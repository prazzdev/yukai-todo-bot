const { Markup } = require("telegraf");

const button = (name, toAction) =>
  Markup.button.callback(
    name,
    toAction || name?.replaceAll(" ", "_").toLowerCase()
  );

module.exports = { button };

module.exports.register = (bot) => {
  require("./markup/general")(bot);
  require("./markup/task")(bot);
  require("./category")(bot);
};

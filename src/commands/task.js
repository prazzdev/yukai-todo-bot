const {
  readData,
  writeData,
  deleteData,
  updateData,
} = require("../utils/database");

module.exports = (bot) => {
  bot.command("task", async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(" ").slice(1);
    const subCommand = args[0];
    const params = args.slice(1).join(" ");

    try {
      if (!subCommand) {
        return ctx.reply(
          "Gunakan subcommand seperti:\n/task add [tugas] /[category]\n/task list\n/task delete ..."
        );
      }
      if (subCommand === "add") {
        const [taskText, category] = params.split(" /").map((s) => s.trim());
        if (!taskText)
          return ctx.reply("Gunakan format: /task add [tugas] /[kategori]");

        const validCategories = (await readData(userId, "categories")).map(
          (cat) => cat.name
        );
        if (category?.toLowerCase() && !validCategories.includes(category)) {
          return ctx.reply(
            `Kategori "${category}" tidak ditemukan! Tambahkan kategori dengan /category add.`
          );
        }

        await writeData(userId, "tasks", {
          task: taskText,
          category,
          createdAt: new Date(),
        });
        return ctx.reply(
          `Tugas "${taskText}" berhasil ditambahkan ke kategori "${
            category || "Umum"
          }"! 📝`
        );
      }
      if (subCommand === "list") {
        const category = params.startsWith("/")
          ? params.replace("/", "").trim()
          : null;
        const tasks = await readData(userId, "tasks");
        const filteredTasks = category
          ? tasks.filter((task) => task.category === category)
          : tasks;

        if (filteredTasks.length === 0) {
          return ctx.reply(
            category
              ? `Tidak ada tugas di kategori "${category}".`
              : "Tidak ada tugas! Tambahkan dengan /task add."
          );
        }

        const formattedTasks = filteredTasks
          .map((task, index) => `${index + 1}. ${task.task} (${task.category})`)
          .join("\n");
        return ctx.reply(
          `Ini daftar tugasmu${
            category ? ` di kategori "${category}"` : ""
          }:\n\n${formattedTasks}`
        );
      }
      if (subCommand === "delete") {
        const taskNumber = parseInt(params, 10);
        if (isNaN(taskNumber))
          return ctx.reply("Gunakan format: /task delete [nomor]");

        const tasks = await readData(userId, "tasks");
        if (taskNumber < 1 || taskNumber > tasks.length) {
          return ctx.reply("Nomor tugas tidak valid!");
        }

        const taskToDelete = tasks[taskNumber - 1];
        await deleteData(userId, "tasks", taskToDelete.id);
        return ctx.reply(`Tugas "${taskToDelete.task}" berhasil dihapus!`);
      }
      ctx.reply(
        "Subcommand tidak dikenal! Gunakan: /task add, /task list, /task delete."
      );
    } catch (error) {
      console.log(error);
      ctx.reply("Terjadi kesalahan saat memproses perintah.");
    }
  });
};

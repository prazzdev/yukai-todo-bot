const { Markup, session } = require("telegraf");
const { readData, writeData } = require("../../utils/database");
const { button } = require("../../utils/markup");

require("dotenv").config({ path: ".env.local" });

module.exports = (bot) => {
  bot.action("tasks", async (ctx) => {
    await ctx.editMessageText(
      "📋 **Tugas**:\n\nGunakan perintah berikut:",
      Markup.inlineKeyboard([
        [button("Add Task"), button("Edit Task")],
        [button("Task List"), button("Delete Task")],
        [button("⇐ Back to Main Menu", "start")],
      ])
    );
  });

  bot.action("add_task", async (ctx) => {
    ctx.session.step = "adding_task__awaiting_task_name";
    await ctx.editMessageText(
      "Masukkan nama tugas yang ingin ditambahkan:",
      Markup.inlineKeyboard([button("Cancel")])
    );
  });

  bot.action("edit_task", async (ctx) => {
    const tasks = await readData(ctx.from.id, "tasks");

    if (tasks.length === 0) {
      await ctx.reply("Belum ada tugas! Tambahkan dengan /task add.");
    }

    const taskButtons = tasks.map((task) =>
      button(task.name, `edit_task_${task.id}`)
    );

    taskButtons.push(button("Cancel"));

    await ctx.editMessageText(
      "Pilih tugas yang ingin diedit:",
      Markup.inlineKeyboard(taskButtons, { columns: 2 })
    );

    ctx.session.step = "editing_task__awaiting_new_task_category";
  });

  bot.action(/^edit_task_(.+)$/, async (ctx) => {
    const selectedTaskId = ctx.match[1];
    console.log(selectedTaskId);
    // Ambil detail tugas berdasarkan taskId
    const tasks = await readData(ctx.from.id, "tasks");
    const task = tasks.find((t) => t.id === String(selectedTaskId));
    console.log(tasks);

    if (!task) {
      return await ctx.reply("Tugas tidak ditemukan atau sudah dihapus.");
    }

    // Simpan taskId di session untuk langkah berikutnya
    ctx.session.editingTaskId = selectedTaskId;

    // Tampilkan opsi pengeditan
    await ctx.editMessageText(
      `Anda sedang mengedit tugas: "${task.name}".\nPilih bagian yang ingin diedit:`,
      Markup.inlineKeyboard([
        [
          button("Edit Name", "edit_task_name"),
          button("Edit Category", "edit_task_category"),
        ],
        [button("Cancel")],
      ])
    );
  });

  bot.on("text", async (ctx) => {
    if (ctx.session.step === "adding_task__awaiting_task_name") {
      // Simpan nama tugas sementara di session
      ctx.session.taskName = ctx.message.text;
      ctx.session.step = "awaiting_category"; // Update langkah dialog

      const categories = await readData(ctx.from.id, "categories");

      if (categories.length === 0) {
        await ctx.reply("Belum ada kategori! Tambahkan dengan /category add.");
      }

      const categoryButtons = categories.map((category) =>
        Markup.button.callback(
          category.name.toUpperCase(),
          `category_${category.id}`
        )
      );

      categoryButtons.push(button("Cancel"));

      await ctx.reply(
        "Pilih kategori untuk tugas ini:",
        Markup.inlineKeyboard(categoryButtons, { columns: 2 })
      );
    }
  });

  bot.action(/^category_(.+)$/, async (ctx) => {
    if (ctx.session.step === "awaiting_category") {
      const selectedCategoryId = ctx.match[1];
      const taskName = ctx.session.taskName;

      // Ambil nama kategori berdasarkan ID dari database
      const categories = await readData(ctx.from.id, "categories");
      const selectedCategory = categories.find(
        (category) => category.id === selectedCategoryId
      );

      if (!selectedCategory) {
        await ctx.reply("❌ Kategori tidak ditemukan.");
        return;
      }

      await writeData(ctx.from.id, "tasks", {
        name: taskName,
        category: selectedCategoryId,
        createdAt: new Date().toISOString(),
      });

      // Reset session
      ctx.session = null;

      await ctx.editMessageText(
        `✅ Tugas "${taskName}" telah ditambahkan ke kategori "${selectedCategory.name}".`,
        Markup.inlineKeyboard([button("⇐ Back to Tasks", "tasks")])
      );
    }
  });

  bot.action("cancel", async (ctx) => {
    ctx.session = null;

    await ctx.editMessageText(
      "❌ Aksi dibatalkan.",
      Markup.inlineKeyboard([button("⇐ Back to Tasks", "tasks")])
    );
  });
};

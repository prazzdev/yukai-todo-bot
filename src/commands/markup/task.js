const { Markup, session } = require("telegraf");
const {
  readData,
  writeData,
  updateData,
  deleteData,
} = require("../../utils/database");
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
  });

  bot.action(/^edit_task_(.+)$/, async (ctx) => {
    const selectedTaskId = ctx.match[1];
    // Ambil detail tugas berdasarkan taskId
    const tasks = await readData(ctx.from.id, "tasks");
    const task = tasks.find((t) => t.id === String(selectedTaskId));

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
          button("Edit Name", "editing_task_name"),
          button("Edit Category", "editing_task_category"),
        ],
        [button("Cancel")],
      ])
    );
  });

  bot.action("editing_task_name", async (ctx) => {
    await ctx.editMessageText(
      "Masukkan nama baru untuk tugas ini:",
      Markup.inlineKeyboard([button("Cancel")])
    );

    // Set langkah dialog
    ctx.session.step = "editing_task__awaiting_task_name";
  });

  bot.action("editing_task_category", async (ctx) => {
    const categories = await readData(ctx.from.id, "categories");

    if (categories.length === 0) {
      await ctx.reply("Belum ada kategori! Tambahkan dengan /category add.");
    }

    const categoryButtons = categories.map((category) =>
      Markup.button.callback(
        category.name.toUpperCase(),
        `editing_task_new_category_${category.id}`
      )
    );

    categoryButtons.push(button("Cancel"));

    await ctx.editMessageText(
      "Pilih kategori baru untuk tugas ini:",
      Markup.inlineKeyboard(categoryButtons, { columns: 2 })
    );

    // Set langkah dialog
    ctx.session.step = "editing_task__awaiting_task_category";
  });

  bot.action(/^editing_task_new_category_(.+)$/, async (ctx) => {
    const selectedCategoryId = ctx.match[1];
    console.log(selectedCategoryId);

    await updateData(
      ctx.from.id,
      "tasks",
      ctx.session.editingTaskId,
      "category",
      selectedCategoryId
    );
  });

  bot.on("text", async (ctx) => {
    if (ctx.session.step === "adding_task__awaiting_task_name") {
      // Simpan nama tugas sementara di session
      ctx.session.taskName = ctx.message.text;
      ctx.session.step = "adding_task__awaiting_task_category"; // Update langkah dialog

      const categories = await readData(ctx.from.id, "categories");

      if (categories.length === 0) {
        await ctx.reply("Belum ada kategori! Tambahkan dengan /category add.");
      }

      const categoryButtons = categories.map((category) =>
        Markup.button.callback(
          category.name.toUpperCase(),
          `adding_task_category_${category.id}`
        )
      );

      categoryButtons.push(button("Cancel"));

      await ctx.reply(
        "Pilih kategori untuk tugas ini:",
        Markup.inlineKeyboard(categoryButtons, { columns: 2 })
      );
    }
    if (ctx.session.step === "editing_task__awaiting_task_name") {
      const newTaskName = ctx.message.text;
      const taskId = ctx.session.editingTaskId;

      // Update data tugas di database
      const tasks = await readData(ctx.from.id, "tasks");
      const taskIndex = tasks.findIndex((t) => t.id === taskId);

      if (taskIndex === -1) {
        return await ctx.reply("Terjadi kesalahan. Tugas tidak ditemukan.");
      }

      tasks[taskIndex].name = newTaskName;

      // Simpan perubahan ke database
      await updateData(
        ctx.from.id,
        "tasks",
        taskId,
        "name",
        tasks[taskIndex].name
      );

      // Konfirmasi kepada pengguna
      await ctx.reply(
        `✅ Nama tugas berhasil diperbarui menjadi: "${newTaskName}".`,
        Markup.inlineKeyboard([button("⇐ Back to Tasks", "tasks")])
      );

      // Reset session
      ctx.session = null;
    }
  });

  bot.action(/^adding_task_category_(.+)$/, async (ctx) => {
    if (ctx.session.step === "adding_task__awaiting_task_category") {
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

  bot.action("task_list", async (ctx) => {
    const tasks = await readData(ctx.from.id, "tasks");

    if (tasks.length === 0) {
      await ctx.reply("Belum ada tugas! Tambahkan dengan /task add.");
      return;
    }

    const taskButtons = tasks.map((task) =>
      button(task.name, `edit_task_${task.id}`)
    );

    taskButtons.push(button("⇐ Back to Tasks", "tasks"));

    await ctx.editMessageText(
      "Daftar tugas:",
      Markup.inlineKeyboard(taskButtons, { columns: 2 })
    );
  });

  bot.action("delete_task", async (ctx) => {
    const tasks = await readData(ctx.from.id, "tasks");

    if (tasks.length === 0) {
      await ctx.reply("Belum ada tugas! Tambahkan dengan /task add.");
    }

    const taskButtons = tasks.map((task) =>
      button(task.name, `delete_task_${task.id}`)
    );

    taskButtons.push(button("Cancel"));

    await ctx.editMessageText(
      "Pilih tugas yang ingin dihapus:",
      Markup.inlineKeyboard(taskButtons, { columns: 2 })
    );
  });

  bot.action(/^delete_task_(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await deleteData(ctx.from.id, "tasks", taskId);
    await ctx.editMessageText(
      "✅ Tugas berhasil dihapus.",
      Markup.inlineKeyboard([button("⇐ Back to Tasks", "tasks")])
    );
  });

  bot.action("cancel", async (ctx) => {
    ctx.session = null;

    await ctx.editMessageText(
      "❌ Aksi dibatalkan.",
      Markup.inlineKeyboard([button("⇐ Back to Tasks", "tasks")])
    );
  });
};

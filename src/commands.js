const { Markup } = require("telegraf");
const db = require("./lib/firebase/config");
require("dotenv").config({ path: ".env.local" });

const readData = async (userId, collectionName) => {
  try {
    const collectionRef = db
      .collection("users")
      .doc(String(userId))
      .collection(collectionName);
    const snapshot = await collectionRef.get();
    const data = [];
    snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
    return data;
  } catch (error) {
    console.error(
      `Error reading data from collection "${collectionName}":`,
      error
    );
    return [];
  }
};

const writeData = async (userId, collectionName, data) => {
  const collectionRef = db
    .collection("users")
    .doc(String(userId))
    .collection(collectionName);
  await collectionRef.add(data);
};

const deleteData = async (userId, collectionName, dataId) => {
  const collectionRef = db
    .collection("users")
    .doc(String(userId))
    .collection(collectionName);
  await collectionRef.doc(dataId).delete();
};

const updateData = async (
  userId,
  collectionName,
  previousData,
  updatedData
) => {
  const collectionRef = db
    .collection("users")
    .doc(String(userId))
    .collection(collectionName);
  await collectionRef.doc(previousData).update({ task: updatedData });
};

module.exports.register = (bot) => {
  bot.start((ctx) => {
    ctx.reply(`Hai, ${ctx.from.first_name} (${ctx.from.id})! Aku ${process.env.BOT_NAME}, bot To-Do list kamu! 🌸\n\nGunakan perintah berikut untuk mengelola tugas dan kategori:

      📋 **Tugas**:
      /task add [tugas] /[kategori] - Tambahkan tugas baru
      /task list [kategori] - Lihat daftar tugas (opsional bisa berdasarkan kategori)
      /task delete [nomor] - Hapus tugas berdasarkan nomor

      📂 **Kategori**:
      /category add [nama kategori] - Tambahkan kategori baru
      /category list - Lihat daftar kategori
      /category delete [nama kategori] - Hapus kategori tertentu

      Selamat mengatur tugasmu! 🌟`);
  });

  bot.action("category", async (ctx) => {
    await ctx.editMessageText("You selected Option 2! 🎉");
  });

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
      ctx.reply("Terjadi kesalahan saat memproses perintah.");
    }
  });

  bot.command("category", async (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(" ").slice(1);
    const subCommand = args[0];
    const params = args.slice(1).join(" ");

    try {
      if (!subCommand) {
        return ctx.reply(
          "Gunakan subcommand seperti:\n/category add ...\n/category list\n/category delete ..."
        );
      }
      if (subCommand === "add") {
        if (!params)
          return ctx.reply("Gunakan format: /category add [nama_kategori]");
        await writeData(userId, "categories", { name: params.toLowerCase() });
        return ctx.reply(`Kategori "${params}" berhasil ditambahkan! 🗂️`);
      }
      if (subCommand === "list") {
        const categories = await readData(userId, "categories");
        if (categories.length === 0) {
          return ctx.reply(
            "Belum ada kategori! Tambahkan dengan /category add."
          );
        }

        const formattedCategories = categories
          .map((cat) => `- ${cat.name}`)
          .join("\n");
        return ctx.reply(`Ini daftar kategori:\n\n${formattedCategories}`);
      }
      if (subCommand === "delete") {
        if (!params)
          return ctx.reply("Gunakan format: /category delete [nama_kategori]");

        const categories = await readData(userId, "categories");
        const categoryToDelete = categories.find((cat) => cat.name === params);
        if (!categoryToDelete)
          return ctx.reply(`Kategori "${params}" tidak ditemukan!`);

        await deleteData(userId, "categories", categoryToDelete.id);
        return ctx.reply(`Kategori "${params}" berhasil dihapus!`);
      }

      ctx.reply(
        "Subcommand tidak dikenal! Gunakan: /category add, /category list, /category delete."
      );
    } catch (error) {
      console.error(error);
      ctx.reply("Terjadi kesalahan saat memproses perintah.");
    }
  });
};

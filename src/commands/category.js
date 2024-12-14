const {
  readData,
  writeData,
  deleteData,
  updateData,
} = require("../utils/database");

module.exports = (bot) => {
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

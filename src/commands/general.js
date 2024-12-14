require("dotenv").config({ path: ".env.local" });

module.exports = (bot) => {
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
};

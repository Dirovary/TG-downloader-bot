import { Telegraf } from "telegraf";
import { exec } from "child_process";
import fs from "fs";

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID);

bot.on("text", async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return;

  const url = ctx.message.text.trim();
  if (!url.startsWith("http")) return ctx.reply("Пришли ссылку 🫡");

  await ctx.reply("⏬ Скачиваю...");

  const output = `/tmp/%(title)s.%(ext)s`;

  const command = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${output}" "${url}"`;

  exec(command, async (error) => {
    if (error) {
      console.error(error);
      return ctx.reply("❌ Ошибка при скачивании");
    }

    const files = fs.readdirSync("/tmp");
    const file = files.find(f => f.endsWith(".mp4") || f.endsWith(".mkv"));
    if (!file) return ctx.reply("Файл не найден 😢");

    const path = `/tmp/${file}`;

    try {
      await ctx.replyWithDocument({ source: path });
    } catch (e) {
      await ctx.reply("⚠️ Файл слишком большой для Telegram");
    }

    fs.unlinkSync(path);
  });
});

bot.launch();
console.log("Bot started 🚀");

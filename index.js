import { Telegraf } from "telegraf";
import fs from "fs";
import youtubedl from "youtube-dl-exec";

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = Number(process.env.OWNER_ID);

if (!BOT_TOKEN || !OWNER_ID) {
  console.error("⚠️ BOT_TOKEN и OWNER_ID должны быть заданы");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.on("text", async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return;

  const url = ctx.message.text.trim();
  if (!url.startsWith("http")) {
    return ctx.reply("Пришли ссылку 🌐");
  }

  await ctx.reply("⏬ Скачиваю...");

  const output = `/tmp/%(title)s.%(ext)s`;

  try {
    // Запускаем загрузку видео через youtube‑dl‑exec
    await youtubedl(url, {
      output,
      format: "bestvideo+bestaudio",
      mergeOutputFormat: "mp4"
    });

    const files = fs.readdirSync("/tmp");
    const file = files.find(f => f.endsWith(".mp4") || f.endsWith(".mkv") || f.endsWith(".webm");

    if (!file) {
      return ctx.reply("❌ Файл не найден после скачивания");
    }

    const path = `/tmp/${file}`;
    await ctx.replyWithDocument({ source: path });
    fs.unlinkSync(path);

  } catch (err) {
    console.error(err);
    await ctx.reply("❌ Ошибка при скачивании/отправке");
  }
});

bot.launch();
console.log("Bot started 🚀");

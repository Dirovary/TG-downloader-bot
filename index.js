import { Telegraf } from "telegraf";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = Number(process.env.OWNER_ID);

if (!BOT_TOKEN || !OWNER_ID) {
  console.error("⚠️ BOT_TOKEN и OWNER_ID должны быть заданы в Environment Variables");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const tmpDir = "/tmp";
const binPath = path.join(".", "bin", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

bot.on("text", async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return;

  const url = ctx.message.text.trim();
  if (!url.startsWith("http")) return ctx.reply("Пришли ссылку 🌐");

  await ctx.reply("⏬ Скачиваю...");

  const output = path.join(tmpDir, "%(title)s.%(ext)s");

  exec(`${binPath} -f bestvideo+bestaudio --merge-output-format mp4 -o "${output}" "${url}"`, async (err) => {
    if (err) {
      console.error(err);
      return ctx.reply("❌ Ошибка при скачивании");
    }

    const files = fs.readdirSync(tmpDir);
    const file = files.find(f => f.endsWith(".mp4") || f.endsWith(".mkv") || f.endsWith(".webm"));

    if (!file) return ctx.reply("❌ Файл не найден");

    const pathToFile = path.join(tmpDir, file);
    try {
      await ctx.replyWithDocument({ source: pathToFile });
    } catch (e) {
      await ctx.reply("⚠️ Файл слишком большой для Telegram");
    }
    fs.unlinkSync(pathToFile);
  });
});

bot.launch();
console.log("Bot started 🚀");

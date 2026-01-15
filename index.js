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
const binPath = path.join(process.cwd(), "bin", "yt-dlp");

// Бесплатный публичный прокси (HTTP/HTTPS)
const proxy = "http://51.158.68.26:8811"; // пример, можно менять

// Ставим права на бинарник
try {
  fs.chmodSync(binPath, 0o755);
} catch (err) {
  console.error("Не удалось выставить права на бинарник yt-dlp:", err);
}

bot.on("text", async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return;

  const url = ctx.message.text.trim();
  if (!url.startsWith("http")) return ctx.reply("Пришли ссылку 🌐");

  await ctx.reply("⏬ Скачиваю через прокси...");

  const output = path.join(tmpDir, "%(title)s.%(ext)s");

  exec(
    `${binPath} -f bestvideo+bestaudio --merge-output-format mp4 --proxy "${proxy}" -o "${output}" "${url}"`,
    async (err) => {
      if (err) {
        console.error("Ошибка при скачивании:", err);
        return ctx.reply("❌ Ошибка при скачивании (429 или другая проблема)");
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
    }
  );
});

// Ловим конфликт getUpdates, если бот уже запущен где-то
(async () => {
  try {
    await bot.launch();
    console.log("Bot started 🚀");
  } catch (err) {
    console.error("Ошибка запуска бота (возможно другой процесс уже запущен):", err);
    process.exit(1);
  }
})();

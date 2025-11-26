const { Telegraf } = require('telegraf');
// 💡 Заменили axios на библиотеку Google Translate API
const { translate } = require('@vitalets/google-translate-api');
const fs = require('fs');
const fsp = require('fs').promises;


const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('ОШИБКА: Переменная BOT_TOKEN не найдена! Добавьте её в настройках деплоя.');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ⚠️ Вставьте свой токен сюда!
const USERS_FILE = 'users.json';

// --- Функции для работы с пользователями (Оставлены без изменений) ---

// Асинхронная загрузка пользователей
async function loadUsersAsync() {
    try {
        await fsp.access(USERS_FILE);
    } catch {
        await fsp.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
    }
    const content = await fsp.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content);
}
// Асинхронное сохранение пользователей
async function saveUsersAsync(data) {
    await fsp.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}
// Добавление пользователя в фоне (fire-and-forget)
function addUserAsync(id, username) {
    (async () => {
        try {
            const data = await loadUsersAsync();
            if (!data.users.find(u => u.id === id)) {
                data.users.push({ id, username });
                await saveUsersAsync(data);
            }
        } catch (err) {
            console.error('Ошибка при добавлении пользователя:', err);
        }
    })();
}

// --- Обработка команд и текста ---

// Приветствие при первом старте
bot.start(async (ctx) => {
    addUserAsync(ctx.from.id, ctx.from.username);
    await ctx.reply(
        "Hello! I am a bot that automatically translates any text to German. Just send me anything you want to translate."
    );
});

// Команда админа
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== 6313048757) return; // защита
    const data = await loadUsersAsync();
    await ctx.reply("Users JSON:\n```\n" + JSON.stringify(data, null, 2) + "\n```", {
        parse_mode: "Markdown"
    });
});

// 🚀 НОВЫЙ БЛОК: Бесплатный перевод текста через Google Translate
bot.on('text', async (ctx) => {
    addUserAsync(ctx.from.id, ctx.from.username);
    const text = ctx.message.text;

    try {
        // Выполняем перевод
        let result = await translate(text, { to: 'de' });
        
        let translated = result.text;

        if (translated?.length && translated === text) {
            result = await translate(text, { to: 'ua' });
        }
        
        translated = result.text;

        // Отправляем переведенный текст
        await ctx.reply(translated);
        console.log(`✅ Переведено: "${text}" -> "${translated}"`);

    } catch (err) {
        console.error('❌ Ошибка перевода:', err);
        await ctx.reply("❌ Error while translating. Please try again later.");
    }
});

bot.launch();
console.log("Bot started and using FREE Google Translate API...");

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
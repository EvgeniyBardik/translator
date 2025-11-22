const { Telegraf } = require('telegraf');
// 💡 Заменили axios на библиотеку Google Translate API
const { translate } = require('@vitalets/google-translate-api');
const fs = require('fs');

// ⚠️ Вставьте свой токен сюда!
const bot = new Telegraf('7331778858:AAHqt4kJtJjTVByXKGRAeVRwQcXwXcxJgZs'); 
const USERS_FILE = 'users.json';

// --- Функции для работы с пользователями (Оставлены без изменений) ---

// Загружаем JSON или создаём пустой
function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(USERS_FILE));
}
// Сохраняем JSON
function saveUsers(data) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}
// Добавление юзера
function addUser(id, username) {
    const data = loadUsers();
    if (!data.users.find(u => u.id === id)) {
        data.users.push({ id, username });
        saveUsers(data);
    }
}

// --- Обработка команд и текста ---

// Приветствие при первом старте
bot.start(async (ctx) => {
    addUser(ctx.from.id, ctx.from.username);
    await ctx.reply(
        "Hello! I am a bot that automatically translates any text to German. Just send me anything you want to translate."
    );
});

// Команда админа
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== 6313048757) return; // защита
    const data = loadUsers();
    await ctx.reply("Users JSON:\n```\n" + JSON.stringify(data, null, 2) + "\n```", {
        parse_mode: "Markdown"
    });
});

// 🚀 НОВЫЙ БЛОК: Бесплатный перевод текста через Google Translate
bot.on('text', async (ctx) => {
    addUser(ctx.from.id, ctx.from.username);
    const text = ctx.message.text;

    try {
        // Выполняем перевод
        const result = await translate(text, { to: 'de' });
        
        const translated = result.text;
        
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
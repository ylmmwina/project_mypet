import express from "express";
import Pet from "./models/pet.js";
import Storage from "./utils/storage.js";
import registerPetRoutes from "./routes/petRoutes.js";
import cors from "cors";

// --- ІГРОВИЙ ЦИКЛ ---
const GAME_TICK_RATE_MS = 30000; // 30 секунд

console.log(`🐾 Ігровий цикл запущено. Тік кожні ${GAME_TICK_RATE_MS / 1000} сек.`);

setInterval(() => {
    // Використовуємо loadPetSafe, щоб не "впасти", якщо pet.json ще не створено
    const pet = Storage.loadPetSafe();

    // Якщо улюбленець існує і живий (має > 0 здоров'я)
    if (pet && pet.health > 0) {
        pet.live();            // 1. Застосовуємо логіку погіршення
        Storage.savePet(pet);  // 2. Зберігаємо новий стан
    }
}, GAME_TICK_RATE_MS);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

console.log(Storage.loadPetSafe());

// Маршрут для перевірки 
app.get("/", (req, res) => {
    res.send("🐾 MyPet сервер працює!");
});

registerPetRoutes(app);

// Запуск сервера 
app.listen(PORT, () => {
    console.log(`✅ Сервер запущено на http://localhost:${PORT}`);
});

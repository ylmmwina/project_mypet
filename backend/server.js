/**
 * @file server.js
 * @brief Точка входу в бекенд-додаток.
 * * Цей файл налаштовує Express сервер, підключення до бази даних SQLite,
 * WebSocket сервер (Socket.IO) та запускає основний ігровий цикл.
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupDatabase } from "./utils/database.js";
import registerPetRoutes from "./routes/petRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import Pet from "./models/pet.js";
import registerShopRoutes from "./routes/shopRoutes.js";
import registerInventoryRoutes from "./routes/inventoryRoutes.js";

/**
 * @brief Мапа відповідності між ID власника та ID сокета.
 * * Використовується для надсилання персональних оновлень конкретному користувачу.
 * @type {Map<string, string>}
 * Key: ownerId (з cookie), Value: socket.id
 */
const userSocketMap = new Map();

/**
 * @brief Асинхронна функція для ініціалізації та запуску сервера.
 */
async function startServer() {
    // 1. Ініціалізація бази даних
    const db = await setupDatabase();

    // 2. Налаштування Express
    const app = express();
    const PORT = 3000;
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.static("frontend")); // Роздача статики

    // 3. Налаштування HTTP та Socket.IO
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    /**
     * @brief Middleware для ідентифікації гравця.
     * * Перевіряє наявність кукі 'ownerId'. Якщо немає — створює новий UUID
     * і записує його в кукі. Додає ownerId до об'єкта req для використання в маршрутах.
     */
    app.use((req, res, next) => {
        const ownerId = req.cookies.ownerId;
        console.log(req.originalUrl, req.body);
        if (ownerId) {
            req.ownerId = ownerId;
            next();
        } else {
            const newOwnerId = crypto.randomUUID();
            res.cookie('ownerId', newOwnerId, {
                httpOnly: true,
                maxAge: 365 * 24 * 60 * 60 * 1000 // 1 рік
            });
            req.ownerId = newOwnerId;
            next();
        }
    });

    // Базовий маршрут для перевірки працездатності
    app.get("/", (req, res) => {
        res.send(`🐾 MyPet сервер працює! Ваш ID: ${req.ownerId}`);
    });

    // Реєстрація маршрутів API
    registerPetRoutes(app, db, io);
    registerShopRoutes(app, db);
    registerInventoryRoutes(app, db);

    // --- GAME LOOP ---
    const GAME_TICK_RATE_MS = 30000; // 30 секунд
    console.log(`🐾 Ігровий цикл запущено. Тік кожні ${GAME_TICK_RATE_MS / 1000} сек.`);

    /**
     * @brief Основний ігровий цикл.
     * * Виконується кожні 30 секунд.
     * 1. Отримує всіх улюбленців з БД.
     * 2. Викликає pet.live() для симуляції життя (голод, бруд тощо).
     * 3. Оновлює дані в БД.
     * 4. Надсилає оновлений стан власнику через WebSocket (якщо він онлайн).
     */
    setInterval(async () => {
        try {
            // Беремо ВСІХ улюбленців, щоб обробляти навіть тих, у кого 0 здоров'я
            const allPetsData = await db.all("SELECT * FROM Pets");

            for (const petData of allPetsData) {
                const pet = Pet.fromJSON(petData);

                // Застосувати логіку погіршення стану
                pet.live();

                // Оновити запис у БД
                await db.run(
                    `UPDATE Pets SET
                                     health = ?, hunger = ?, happiness = ?,
                                     energy = ?, cleanliness = ?, age = ?
                     WHERE id = ?`,
                    pet.health, pet.hunger, pet.happiness,
                    pet.energy, pet.cleanliness, pet.age,
                    pet.id
                );

                // Знайти сокет власника і надіслати оновлення
                const socketId = userSocketMap.get(pet.ownerId);
                if (socketId) {
                    io.to(socketId).emit('pet-update', pet.toJSON());
                }
            }
        } catch (error) {
            console.error("Помилка в ігровому циклі:", error);
        }
    }, GAME_TICK_RATE_MS);

    // --- SOCKET.IO EVENTS ---
    io.on("connection", (socket) => {
        console.log(`🔌 Клієнт підключився: ${socket.id}`);

        /**
         * @event register
         * @brief Реєстрація сокета за ownerId.
         * * Клієнт надсилає свій ownerId (з кукі), сервер пов'язує його з socket.id.
         * Також сервер одразу надсилає актуальний стан пета.
         */
        socket.on('register', (ownerId) => {
            if (ownerId) {
                console.log(`🔗 Клієнт ${socket.id} зареєстрований для ownerId: ${ownerId}`);
                userSocketMap.set(ownerId, socket.id);

                // Одразу надсилаємо актуальний стан
                db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId)
                    .then(petData => {
                        if (petData) {
                            socket.emit('pet-update', petData);
                        }
                    });
            }
        });

        socket.on("disconnect", () => {
            console.log(`🔌 Клієнт відключився: ${socket.id}`);
            // Очищення мапи сокетів
            for (let [ownerId, id] of userSocketMap.entries()) {
                if (id === socket.id) {
                    userSocketMap.delete(ownerId);
                    console.log(`🔗 Зв'язок для ${ownerId} видалено.`);
                    break;
                }
            }
        });
    });

    // Запуск HTTP сервера
    httpServer.listen(PORT, () => {
        console.log(`✅ Сервер (HTTP, WebSocket, DB) запущено на http://localhost:${PORT}`);
    });
}

// Запускаємо сервер
startServer();
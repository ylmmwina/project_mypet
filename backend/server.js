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

//Тут ми будемо зберігати, який 'ownerId' (з cookie)
//відповідає якому 'socket.id' (з WebSocket)
const userSocketMap = new Map();


//Асинхронна функція для запуску сервера
async function startServer() {
    const db = await setupDatabase();

    //налаштовуємо Express
    const app = express();
    const PORT = 3000;
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.static("frontend"));

    //налаштовуємо HTTP та Socket.IO
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    //"Middleware" для ID Гравця (Cookie)
    app.use((req, res, next) => {
        const ownerId = req.cookies.ownerId;
        if (ownerId) {
            req.ownerId = ownerId;
            next();
        } else {
            const newOwnerId = crypto.randomUUID();
            res.cookie('ownerId', newOwnerId, {
                httpOnly: true,
                maxAge: 365 * 24 * 60 * 60 * 1000
            });
            req.ownerId = newOwnerId;
            next();
        }
    });

    //маршрути
    app.get("/", (req, res) => {
        res.send(`🐾 MyPet сервер працює! Ваш ID: ${req.ownerId}`);
    });

    //передаємо 'db' та 'io' у наші маршрути
    registerPetRoutes(app, db, io);
    registerShopRoutes(app, db);

    const GAME_TICK_RATE_MS = 30000;
    console.log(`🐾 Ігровий цикл запущено. Тік кожні ${GAME_TICK_RATE_MS / 1000} сек.`);

    setInterval(async () => {
        try {
            //знайти ВСІХ живих улюбленців
            const allPetsData = await db.all("SELECT * FROM Pets WHERE health > 0");

            //пройтись по кожному
            for (const petData of allPetsData) {
                //застосувати логіку `live()` з нашого класу Pet
                const pet = Pet.fromJSON(petData);
                pet.live(); // Наш клас Pet сам рахує, як погіршити стан

                //оновити улюбленця в базі даних
                await db.run(
                    `UPDATE Pets SET 
                        health = ?, hunger = ?, happiness = ?, 
                        energy = ?, cleanliness = ?, age = ?
                     WHERE id = ?`,
                    pet.health, pet.hunger, pet.happiness,
                    pet.energy, pet.cleanliness, pet.age,
                    pet.id
                );

                //надіслати оновлення власнику, якщо він online
                const socketId = userSocketMap.get(pet.ownerId);
                if (socketId) {
                    io.to(socketId).emit('pet-update', pet.toJSON());
                }
            }
        } catch (error) {
            console.error("Помилка в ігровому циклі:", error);
        }
    }, GAME_TICK_RATE_MS);

    // --- SOCKET.IO ---
    io.on("connection", (socket) => {
        console.log(`🔌 Клієнт підключився: ${socket.id}`);

        //чекаємо, що клієнт "представиться" і надішле свій ownerId
        socket.on('register', (ownerId) => {
            if (ownerId) {
                console.log(`🔗 Клієнт ${socket.id} зареєстрований для ownerId: ${ownerId}`);
                //зберігаємо зв'язок ownerId <-> socket.id
                userSocketMap.set(ownerId, socket.id);

                //одразу надсилаємо йому актуальний стан
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
            // Видаляємо зв'язок, коли клієнт відключається
            for (let [ownerId, id] of userSocketMap.entries()) {
                if (id === socket.id) {
                    userSocketMap.delete(ownerId);
                    console.log(`🔗 Зв'язок для ${ownerId} видалено.`);
                    break;
                }
            }
        });
    });

    //Запуск сервера
    httpServer.listen(PORT, () => {
        console.log(`✅ Сервер (HTTP, WebSocket, DB) запущено на http://localhost:${PORT}`);
    });
}

//Запускаємо наш сервер
startServer();
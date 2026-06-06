/**
 * @file server.js
 * @brief Точка входу в бекенд-додаток MyPet.
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
    setupDatabase,
    verifyUser,
    createUser,
    getUserByEmail,
    savePet
} from "./utils/database.js";
import registerPetRoutes from "./routes/petRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import Pet from "./models/pet.js";
import registerShopRoutes from "./routes/shopRoutes.js";
import registerInventoryRoutes from "./routes/inventoryRoutes.js";

async function startServer() {
    const db = await setupDatabase();
    const app = express();
    const PORT = 3000;

    app.use(cors({ origin: "http://localhost:3000", credentials: true }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.static("frontend"));

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    /**
     * @brief Реєструє клієнта у Socket.IO кімнаті його користувача.
     *
     * Frontend надсилає ownerId після вибору улюбленця.
     * Сервер використовує цю кімнату, щоб надсилати pet-update
     * лише потрібному користувачу.
     */
    io.on("connection", (socket) => {
        socket.on("register", (ownerId) => {
            if (!ownerId) return;

            socket.join(String(ownerId));
        });
    });

    /**
     * @brief Middleware.
     * Тепер він просто перевіряє кукі, але НЕ створює нові випадкові ID.
     */
    
// MIDDLEWARE
app.use((req, res, next) => {
    const ownerId = req.cookies.ownerId;
    if (ownerId) {
        req.ownerId = ownerId;
    }
    next();
});

// МАРШРУТИ АВТОРИЗАЦІЇ 

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        res.clearCookie('ownerId'); 
        const userId = await createUser(db, username, email, password); 
        res.cookie('ownerId', userId, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
        res.status(201).json({ message: "Успіх!", userId });
    } catch (error) {
        res.status(400).json({ message: error.message || "Помилка реєстрації" });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await verifyUser(db, email, password); //
        if (user) {
            res.clearCookie('ownerId');
            res.cookie('ownerId', user.id, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
            res.json({ message: "Вхід успішний!", user });
        } else {
            res.status(401).json({ message: "Невірний email або пароль!" });
        }
    } catch (error) {
        res.status(500).json({ message: "Помилка сервера" });
    }
});

// Тільки ПІСЛЯ цього реєструємо інші маршрути
registerPetRoutes(app, db, io);
registerShopRoutes(app, db);
registerInventoryRoutes(app, db);

    /**
     * @brief Запускає серверний ігровий цикл для поступового оновлення стану pets.
     *
     * Кожен tick викликає pet.live(), зберігає оновлений стан у БД
     * і надсилає актуальні дані клієнту через Socket.IO.
     */
    setInterval(async () => {
        try {
            const pets = await db.all("SELECT * FROM Pets");

            for (const petData of pets) {
                const pet = Pet.fromJSON(petData);
                pet.live();

                await savePet(db, pet);

                if (pet.ownerId) {
                    io.to(String(pet.ownerId)).emit("pet-update", pet.toJSON());
                }
            }
        } catch (error) {
            console.error("Live update error:", error);
        }
    }, 30000);

    httpServer.listen(PORT, () => {
        console.log(`✅ Сервер запущено на http://localhost:${PORT}`);
    });
}

startServer();
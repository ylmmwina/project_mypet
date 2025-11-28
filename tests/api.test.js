/**
 * @file api.test.js
 * @brief Юніт-тести для перевірки інтеграції API (роутів) бекенду.
 * * Використовує Supertest для симуляції HTTP-запитів до Express-додатку
 * та тестову in-memory базу даних SQLite для ізоляції тестів.
 */

import request from "supertest";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

import registerPetRoutes from "../backend/routes/petRoutes.js";
import registerShopRoutes from "../backend/routes/shopRoutes.js";
import registerInventoryRoutes from "../backend/routes/inventoryRoutes.js";

//  Створення тестової БД
/**
 * @brief Створює та ініціалізує in-memory базу даних SQLite для тестування.
 * * Створює необхідні таблиці (Pets, Purchases, Inventory).
 * @returns {Promise<Object>} Об'єкт підключення до тестової БД.
 */
async function createTestDb() {
    const db = await open({
        filename: ":memory:",
        driver: sqlite3.Database
    });

    // Ініціалізація структури БД
    await db.exec(`
        CREATE TABLE Pets (
                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                              ownerId TEXT NOT NULL,
                              name TEXT NOT NULL,
                              type TEXT NOT NULL,
                              age INTEGER DEFAULT 0,
                              health INTEGER DEFAULT 100,
                              hunger INTEGER DEFAULT 0,
                              happiness INTEGER DEFAULT 0,
                              energy INTEGER DEFAULT 0,
                              cleanliness INTEGER DEFAULT 0,
                              coins INTEGER DEFAULT 0,
                              createdAt INTEGER NOT NULL
        );
    `);

    await db.exec(`
        CREATE TABLE Purchases (
                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                   petId INTEGER NOT NULL,
                                   itemId TEXT NOT NULL,
                                   price INTEGER NOT NULL,
                                   createdAt TEXT NOT NULL
        );
    `);

    await db.exec(`
        CREATE TABLE Inventory (
                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                   petId INTEGER NOT NULL,
                                   itemId TEXT NOT NULL,
                                   quantity INTEGER NOT NULL DEFAULT 0,
                                   createdAt TEXT NOT NULL,
                                   updatedAt TEXT NOT NULL,
                                   UNIQUE(petId, itemId)
        );
    `);

    return db;
}

//  Створення тестового Express-додатку
/**
 * @brief Створює тестовий Express-додаток та реєструє всі маршрути.
 * * Встановлює mock-middleware для ownerId.
 * @returns {Promise<Object>} Об'єкт з екземпляром Express-додатку (app) та БД (db).
 */
async function createTestApp() {
    const db = await createTestDb();
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());

    // Мокаємо ownerId, щоб не чіпати реальні кукі
    app.use((req, res, next) => {
        req.ownerId = "test-owner";
        next();
    });

    // Важливо: IO не передається, оскільки ми тестуємо HTTP, а не WebSockets
    registerPetRoutes(app, db, { emit: jest.fn(), to: jest.fn().mockReturnThis() });
    registerShopRoutes(app, db);
    registerInventoryRoutes(app, db);

    return { app, db };
}

/**
 * @namespace APITestSuite
 * @brief Інтеграційні тести для перевірки всіх API-маршрутів (CRUD та ігрова логіка).
 */
describe("MyPet API integration tests", () => {
    /** @type {Object} app - Екземпляр Express-додатку. */
    let app;
    /** @type {Object} db - Екземпляр тестової БД. */
    let db;
    /** @type {Object} agent - Агент Supertest для виконання запитів. */
    let agent;
    /** @type {number} petId - ID створеного тестового улюбленця. */
    let petId;

    /**
     * @brief Налаштування перед запуском усіх тестів.
     * * Створює тестову БД та Express-додаток.
     */
    beforeAll(async () => {
        const setup = await createTestApp();
        app = setup.app;
        db = setup.db;
        agent = request(app);
    });

    /**
     * @brief Очищення після виконання всіх тестів.
     * * Закриває підключення до тестової БД.
     */
    afterAll(async () => {
        await db.close();
    });

    /**
     * @test POST /create-pet
     * @brief Перевіряє, чи маршрут коректно створює нового улюбленця.
     * * Зберігає ID створеного улюбленця для подальших тестів.
     */
    test("POST /create-pet створює нового пета", async () => {
        const res = await agent
            .post("/create-pet")
            .send({ name: "Testik", type: "dog" })
            .expect(200);

        expect(res.body).toHaveProperty("id");
        expect(res.body.name).toBe("Testik");
        expect(res.body.type).toBe("dog");

        petId = res.body.id;

        const dbPet = await db.get("SELECT * FROM Pets WHERE id = ?", petId);
        expect(dbPet).toBeDefined();
    });

    /**
     * @test POST /pet/feed
     * @brief Перевіряє, чи коректно оновлюється стан улюбленця після годування.
     * * Тестує логіку з `pet.js` (здоров'я +5, голод -15).
     */
    test("POST /pet/feed коректно оновлює стан пета", async () => {
        // Встановлюємо початкові значення
        await db.run(
            "UPDATE Pets SET health = ?, hunger = ?, coins = ? WHERE id = ?",
            80,
            20,
            0,
            petId
        );

        const res = await agent
            .post("/pet/feed")
            .send({ petId })
            .expect(200);

        const after = await db.get("SELECT * FROM Pets WHERE id = ?", petId);

        // Перевірка змін: health 80 -> 85, hunger 20 -> 5
        expect(after.health).toBe(85);
        expect(after.hunger).toBe(5);
        expect(after.coins).toBe(0);

        expect(res.body.health).toBe(after.health);
        expect(res.body.hunger).toBe(after.hunger);
    });

    /**
     * @test POST /shop/buy
     * @brief Перевіряє покупку: списання монет та додавання предмета в інвентар.
     */
    test("POST /shop/buy купує предмет і додає в інвентар", async () => {
        // даємо монети
        await db.run(
            "UPDATE Pets SET coins = ? WHERE id = ?",
            100,
            petId
        );

        const res = await agent
            .post("/shop/buy")
            .send({ itemId: "basic_food", petId })
            .expect(200);

        // Ціна basic_food: 10. Баланс має бути 90.
        expect(res.body.coins).toBe(90);

        const inv = await db.get(
            "SELECT * FROM Inventory WHERE petId = ? AND itemId = ?",
            petId,
            "basic_food"
        );

        expect(inv).toBeDefined();
        expect(inv.quantity).toBe(1);
    });

    /**
     * @test POST /inventory/use
     * @brief Перевіряє використання предмета: списання з інвентарю та застосування ефектів.
     */
    test("POST /inventory/use використовує предмет і змінює стани пета", async () => {
        // Гарантуємо, що предмет є в інвентарі
        const now = new Date().toISOString();
        await db.run(
            "INSERT OR REPLACE INTO Inventory (petId, itemId, quantity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
            petId,
            "basic_food",
            1,
            now,
            now
        );

        // Встановлюємо голод, щоб побачити ефект
        await db.run(
            "UPDATE Pets SET hunger = ? WHERE id = ?",
            40,
            petId
        );

        const before = await db.get("SELECT * FROM Pets WHERE id = ?", petId);

        const res = await agent
            .post("/inventory/use")
            .send({ petId, itemId: "basic_food" })
            .expect(200);

        expect(res.body).toHaveProperty("pet");
        expect(res.body).toHaveProperty("remainingQuantity");

        const after = await db.get("SELECT * FROM Pets WHERE id = ?", petId);

        // basic_food: hunger -20. Було 40, стало 20.
        expect(after.hunger).toBe(20);
        expect(after.hunger).toBeLessThan(before.hunger);
        expect(res.body.pet.hunger).toBe(after.hunger);

        // Перевіряємо, що предмет списано (залишок 0, запис видалено)
        expect(res.body.remainingQuantity).toBe(0);
        const afterInv = await db.get(
            "SELECT quantity FROM Inventory WHERE petId = ? AND itemId = ?",
            petId,
            "basic_food"
        );
        expect(afterInv).toBeUndefined();
    });

    /**
     * @test GET /inventory
     * @brief Перевіряє отримання вмісту інвентарю улюбленця.
     */
    test("GET /inventory повертає список предметів пета", async () => {
        // Додаємо 2 предмети для тесту
        const now = new Date().toISOString();
        await db.run(
            "INSERT OR REPLACE INTO Inventory (petId, itemId, quantity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
            petId,
            "soap_basic",
            2,
            now,
            now
        );

        const res = await agent
            .get(`/inventory?petId=${petId}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        const item = res.body.find(i => i.itemId === "soap_basic");
        expect(item).toBeDefined();
        expect(item.quantity).toBe(2);
    });

    /**
     * @test GET /shop/items
     * @brief Перевіряє, чи повертає API статичний список товарів магазину.
     */
    test("GET /shop/items повертає список товарів магазину", async () => {
        const res = await agent
            .get("/shop/items")
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        const sample = res.body[0];
        expect(sample).toHaveProperty("id");
        expect(sample).toHaveProperty("name");
        expect(sample).toHaveProperty("type");
        expect(sample).toHaveProperty("price");
        expect(sample).toHaveProperty("effects");
    });

    /**
     * @test GET /shop/history
     * @brief Перевіряє отримання історії покупок для улюбленця.
     */
    test("GET /shop/history повертає історію покупок пета", async () => {
        // Створимо тестовий запис покупки
        const now = new Date().toISOString();
        await db.run(
            "INSERT INTO Purchases (petId, itemId, price, createdAt) VALUES (?, ?, ?, ?)",
            petId,
            "premium_food",
            25,
            now
        );

        const res = await agent
            .get(`/shop/history?petId=${petId}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        const purchase = res.body.find(p => p.itemId === "premium_food");
        expect(purchase).toBeDefined();
        expect(purchase.price).toBe(25);
    });
});
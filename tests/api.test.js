/**
 * @file api.test.js
 * @brief Юніт-тести для перевірки інтеграції API (роутів) бекенду.
 *
 * Використовує Supertest для симуляції HTTP-запитів до Express-додатку
 * та тестову in-memory базу даних SQLite для ізоляції тестів.
 */

import request from "supertest";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { jest } from "@jest/globals";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

import registerPetRoutes from "../backend/routes/petRoutes.js";
import registerShopRoutes from "../backend/routes/shopRoutes.js";
import registerInventoryRoutes from "../backend/routes/inventoryRoutes.js";

/**
 * @brief Створює та ініціалізує in-memory базу даних SQLite для тестування.
 *
 * Створює необхідні таблиці Pets, Purchases та Inventory.
 *
 * @returns {Promise<Object>} Об'єкт підключення до тестової БД.
 */
async function createTestDb() {
    const db = await open({
        filename: ":memory:",
        driver: sqlite3.Database
    });

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
                              xp INTEGER DEFAULT 0,
                              level INTEGER DEFAULT 1,
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

/**
 * @brief Створює тестовий Express-додаток та реєструє всі маршрути.
 *
 * Встановлює mock-middleware для ownerId.
 *
 * @returns {Promise<Object>} Об'єкт з Express-додатком та БД.
 */
async function createTestApp() {
    const db = await createTestDb();
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());

    app.use((req, res, next) => {
        req.ownerId = "test-owner";
        next();
    });

    registerPetRoutes(app, db, {
        emit: jest.fn(),
        to: jest.fn().mockReturnThis()
    });
    registerShopRoutes(app, db);
    registerInventoryRoutes(app, db);

    return { app, db };
}

/**
 * @namespace APITestSuite
 * @brief Інтеграційні тести для перевірки API-маршрутів.
 */
describe("MyPet API integration tests", () => {
    let app;
    let db;
    let agent;
    let petId;

    /**
     * @brief Налаштування перед запуском усіх тестів.
     */
    beforeAll(async () => {
        const setup = await createTestApp();
        app = setup.app;
        db = setup.db;
        agent = request(app);
    });

    /**
     * @brief Очищення після виконання всіх тестів.
     */
    afterAll(async () => {
        if (db) {
            await db.close();
        }
    });

    /**
     * @test POST /create-pet
     * @brief Перевіряє створення нового улюбленця.
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
     * @brief Перевіряє оновлення стану улюбленця після годування.
     */
    test("POST /pet/feed коректно оновлює стан пета", async () => {
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

        expect(after.health).toBe(85);
        expect(after.hunger).toBe(5);
        expect(after.coins).toBe(0);

        expect(res.body.health).toBe(after.health);
        expect(res.body.hunger).toBe(after.hunger);
    });

    /**
     * @test POST /shop/buy
     * @brief Перевіряє покупку предмета і додавання його в інвентар.
     */
    test("POST /shop/buy купує предмет і додає в інвентар", async () => {
        await db.run(
            "UPDATE Pets SET coins = ? WHERE id = ?",
            100,
            petId
        );

        const res = await agent
            .post("/shop/buy")
            .send({ itemId: "basic_food", petId })
            .expect(200);

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
     * @brief Перевіряє використання предмета з інвентарю.
     */
    test("POST /inventory/use використовує предмет і змінює стани пета", async () => {
        const now = new Date().toISOString();

        await db.run(
            "INSERT OR REPLACE INTO Inventory (petId, itemId, quantity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
            petId,
            "basic_food",
            1,
            now,
            now
        );

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

        expect(after.hunger).toBe(20);
        expect(after.hunger).toBeLessThan(before.hunger);
        expect(res.body.pet.hunger).toBe(after.hunger);

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
     * @brief Перевіряє отримання інвентарю улюбленця.
     */
    test("GET /inventory повертає список предметів пета", async () => {
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

        const item = res.body.find((inventoryItem) => inventoryItem.itemId === "soap_basic");
        expect(item).toBeDefined();
        expect(item.quantity).toBe(2);
    });

    /**
     * @test GET /shop/items
     * @brief Перевіряє отримання списку товарів магазину.
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

        const purchase = res.body.find((historyItem) => historyItem.itemId === "premium_food");

        expect(purchase).toBeDefined();
        expect(purchase.price).toBe(25);
    });

    /**
     * @test POST /pet/sleep
     * @brief Перевіряє, що сон відновлює енергію улюбленця.
     */
    test("POST /pet/sleep відновлює енергію пета", async () => {
        await db.run(
            "UPDATE Pets SET energy = ? WHERE id = ?",
            30,
            petId
        );

        const res = await agent
            .post("/pet/sleep")
            .send({ petId })
            .expect(200);

        const after = await db.get("SELECT * FROM Pets WHERE id = ?", petId);

        expect(after.energy).toBeGreaterThan(30);
        expect(res.body.energy).toBe(after.energy);
    });

    /**
     * @test POST /pet/finish-game
     * @brief Перевіряє нарахування монет, XP та зміну статистики після міні-гри.
     */
    test("POST /pet/finish-game нараховує монети, XP і змінює статистику пета", async () => {
        await db.run(
            "UPDATE Pets SET coins = ?, xp = ?, level = ?, happiness = ?, energy = ?, hunger = ? WHERE id = ?",
            10,
            0,
            1,
            20,
            80,
            10,
            petId
        );

        const res = await agent
            .post("/pet/finish-game")
            .send({
                petId,
                score: 50,
                coinsEarned: 15
            })
            .expect(200);

        const after = await db.get("SELECT * FROM Pets WHERE id = ?", petId);

        expect(after.coins).toBe(25);
        expect(after.xp).toBe(5);
        expect(after.level).toBe(1);
        expect(after.happiness).toBe(45);
        expect(after.energy).toBe(60);
        expect(after.hunger).toBe(25);

        expect(res.body.coins).toBe(after.coins);
        expect(res.body.xp).toBe(after.xp);
        expect(res.body.level).toBe(after.level);
    });
});
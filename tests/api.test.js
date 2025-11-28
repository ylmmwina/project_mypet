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

  registerPetRoutes(app, db);
  registerShopRoutes(app, db);
  registerInventoryRoutes(app, db);

  return { app, db };
}

// Тести API
describe("MyPet API integration tests", () => {
  let app;
  let db;
  let agent;
  let petId;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    db = setup.db;
    agent = request(app);
  });

  afterAll(async () => {
    await db.close();
  });

  // 1) Створення пета
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

  // 2) Feed — оновлення станів
  test("POST /pet/feed коректно оновлює стан пета", async () => {
    await db.run(
      "UPDATE Pets SET health = ?, hunger = ?, coins = ? WHERE id = ?",
      80,  
      20,  
      0,   
      petId
    );

    const before = await db.get("SELECT * FROM Pets WHERE id = ?", petId);

    const res = await agent
      .post("/pet/feed")
      .send({ petId })
      .expect(200);

    const after = await db.get("SELECT * FROM Pets WHERE id = ?", petId);

    // feed(): +5 health, -15 hunger
    expect(after.health).toBe(85);  
    expect(after.hunger).toBe(5);   
    expect(after.coins).toBe(0);    

    expect(res.body.health).toBe(after.health);
    expect(res.body.hunger).toBe(after.hunger);
  });

  // 3) Покупка предмета
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

    expect(res.body.coins).toBeLessThan(100);

    const inv = await db.get(
      "SELECT * FROM Inventory WHERE petId = ? AND itemId = ?",
      petId,
      "basic_food"
    );

    expect(inv).toBeDefined();
    expect(inv.quantity).toBe(1);
  });

  // 4) Використання предмета
  test("POST /inventory/use використовує предмет і змінює стани пета", async () => {
    const row = await db.get(
      "SELECT quantity FROM Inventory WHERE petId = ? AND itemId = ?",
      petId,
      "basic_food"
    );

    if (!row) {
      const now = new Date().toISOString();
      await db.run(
        "INSERT INTO Inventory (petId, itemId, quantity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        petId,
        "basic_food",
        1,
        now,
        now
      );
    }

    // задаємо hunger > 0, щоб його можна було зменшити
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

    // basic_food: hunger -20
    expect(after.hunger).toBe(20); 
    expect(after.hunger).toBeLessThan(before.hunger);

    const afterInv = await db.get(
      "SELECT quantity FROM Inventory WHERE petId = ? AND itemId = ?",
      petId,
      "basic_food"
    );

    if (res.body.remainingQuantity === 0) {
      expect(afterInv).toBeUndefined();
    } else {
      expect(afterInv.quantity).toBe(res.body.remainingQuantity);
    }
  });
   
  test("GET /inventory повертає список предметів пета", async () => {
    // Для цього тесту потрібно, щоб у пета був хоча б 1 предмет
    const now = new Date().toISOString();
    await db.run(
      "INSERT OR REPLACE INTO Inventory (petId, itemId, quantity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      petId,
      "basic_food",
      2,
      now,
      now
    );

    const res = await agent
      .get(`/inventory?petId=${petId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const item = res.body.find(i => i.itemId === "basic_food");
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
  });

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

  test("GET /shop/history повертає історію покупок пета", async () => {
    // Створимо ще одну покупку
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

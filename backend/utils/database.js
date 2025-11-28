import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";

export async function setupDatabase() {

    const dbFilename = "pets.db"
    const path = "./backend/storage";
    fs.mkdirSync(path, { recursive: true });

    const db = await open({
        filename: path + '/' + dbFilename,
        driver: sqlite3.Database
    });

    // Таблиця улюбленців
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Pets (
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

    // Таблиця історії покупок
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            petId INTEGER NOT NULL,
            itemId TEXT NOT NULL,
            price INTEGER NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (petId) REFERENCES Pets(id)
        );
    `);

    // Інвентар
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            petId INTEGER NOT NULL,
            itemId TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            UNIQUE(petId, itemId),
            FOREIGN KEY (petId) REFERENCES Pets(id)
        );
    `);

    console.log("✅ База даних SQLite готова.");
    return db;
}

// Отримати улюбленця за ownerId (повний запис з БД)
export async function getPetByOwnerId(db, ownerId) {
    return await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
}

export async function getPetByOwnerIdAndPetId(db, ownerId, petId) {
    return await db.get("SELECT * FROM Pets WHERE ownerId = ? AND id = ?", ownerId, petId)
}

// Отримати тільки id улюбленця за ownerId
export async function getPetIdByOwnerId(db, ownerId) {
    const row = await db.get(
        "SELECT id FROM Pets WHERE ownerId = ?",
        ownerId
    );
    return row ? row.id : null;
}

// Зберегти (оновити) улюбленця в БД
export async function savePet(db, pet) {
    if (!pet.id) {
        throw new Error("Pet must have id to be saved");
    }

    await db.run(
        `UPDATE Pets SET 
            health = ?, hunger = ?, happiness = ?, 
            energy = ?, cleanliness = ?, age = ?, coins = ?
         WHERE id = ?`,
        pet.health,
        pet.hunger,
        pet.happiness,
        pet.energy,
        pet.cleanliness,
        pet.age,
        pet.coins,
        pet.id
    );
}

// Отримати повний список предметів інвентаря для petId
export async function getInventoryForPet(db, petId) {
    return await db.all(
        `
        SELECT itemId, quantity, createdAt, updatedAt
        FROM Inventory
        WHERE petId = ?
        ORDER BY updatedAt DESC
        `,
        petId
    );
}

// Отримати конкретний предмет з інвентаря
export async function getInventoryItem(db, petId, itemId) {
    return await db.get(
        "SELECT id, quantity, createdAt, updatedAt FROM Inventory WHERE petId = ? AND itemId = ?",
        petId,
        itemId
    );
}

// Додати предмет в інвентар (або збільшити quantity, якщо вже є)
export async function addInventoryItem(db, petId, itemId) {
    const now = new Date().toISOString();
    const existing = await getInventoryItem(db, petId, itemId);

    if (existing) {
        await db.run(
            "UPDATE Inventory SET quantity = ?, updatedAt = ? WHERE id = ?",
            existing.quantity + 1,
            now,
            existing.id
        );
        return existing.quantity + 1;
    } else {
        await db.run(
            "INSERT INTO Inventory (petId, itemId, quantity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
            petId,
            itemId,
            1,
            now,
            now
        );
        return 1;
    }
}

// "Використати" 1 предмет з інвентаря (зменшуємо quantity або видаляємо)
// Повертаємо нову кількість (0, якщо предмет вилучено)
export async function consumeInventoryItem(db, petId, itemId, now) {
    const existing = await getInventoryItem(db, petId, itemId);

    if (!existing || existing.quantity <= 0) {
        throw new Error("Item not found in inventory");
    }

    const newQuantity = existing.quantity - 1;

    if (newQuantity > 0) {
        await db.run(
            "UPDATE Inventory SET quantity = ?, updatedAt = ? WHERE id = ?",
            newQuantity,
            now,
            existing.id
        );
    } else {
        await db.run("DELETE FROM Inventory WHERE id = ?", existing.id);
    }

    return newQuantity > 0 ? newQuantity : 0;
}

// Додати запис в історію покупок
export async function addPurchaseHistoryEntry(db, petId, itemId, price) {
    const now = new Date().toISOString();
    await db.run(
        "INSERT INTO Purchases (petId, itemId, price, createdAt) VALUES (?, ?, ?, ?)",
        petId,
        itemId,
        price,
        now
    );
}

// Отримати останні покупки
export async function getPurchaseHistory(db, petId, limit = 20) {
    return await db.all(
        `
        SELECT itemId, price, createdAt
        FROM Purchases
        WHERE petId = ?
        ORDER BY createdAt DESC
        LIMIT ?
        `,
        petId,
        limit
    );
}

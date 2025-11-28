/**
 * @file database.js
 * @brief Модуль для роботи з базою даних SQLite.
 * * Цей файл містить функції для ініціалізації бази даних, створення таблиць,
 * а також методи CRUD (Create, Read, Update, Delete) для сутностей Pets, Inventory та Purchases.
 */

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";

/**
 * @brief Ініціалізує базу даних.
 * * Створює файл бази даних (якщо його немає), підключається до нього
 * та створює необхідні таблиці:
 * - **Pets**: Зберігає інформацію про улюбленців.
 * - **Purchases**: Історія покупок.
 * - **Inventory**: Інвентар предметів для кожного улюбленця.
 * * @returns {Promise<Object>} Екземпляр підключення до бази даних.
 */
export async function setupDatabase() {
    const dbFilename = "pets.db";
    const path = "./backend/storage";
    try {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    } catch (e) { console.error(e); }

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

    // Таблиця інвентарю
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

/**
 * @brief Отримати всіх улюбленців конкретного власника.
 * @param {Object} db - Підключення до БД.
 * @param {string} ownerId - ID власника.
 * @returns {Promise<Array>} Масив об'єктів улюбленців.
 */
export async function getAllPetsByOwnerId(db, ownerId) {
    return await db.all("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
}

/**
 * @brief Отримати улюбленця за його ID та ID власника.
 * * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} ownerId - ID власника (для перевірки доступу).
 * @returns {Promise<Object|undefined>} Об'єкт улюбленця або undefined.
 */
export async function getPetById(db, petId, ownerId) {
    return await db.get("SELECT * FROM Pets WHERE id = ? AND ownerId = ?", petId, ownerId);
}

/**
 * @brief Аліас для getPetById (для зручності імпорту).
 */
export const getPetByOwnerIdAndPetId = (db, ownerId, petId) => getPetById(db, petId, ownerId);

/**
 * @brief Отримати першого знайденого улюбленця власника.
 * @param {Object} db - Підключення до БД.
 * @param {string} ownerId - ID власника.
 * @returns {Promise<Object|undefined>} Об'єкт улюбленця.
 */
export async function getPetByOwnerId(db, ownerId) {
    return await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
}

/**
 * @brief Отримати тільки ID улюбленця власника.
 * @param {Object} db - Підключення до БД.
 * @param {string} ownerId - ID власника.
 * @returns {Promise<number|null>} ID улюбленця або null.
 */
export async function getPetIdByOwnerId(db, ownerId) {
    const row = await db.get("SELECT id FROM Pets WHERE ownerId = ?", ownerId);
    return row ? row.id : null;
}

/**
 * @brief Зберегти змінений стан улюбленця в БД.
 * * Оновлює основні показники (здоров'я, голод, щастя, монети тощо).
 * * @param {Object} db - Підключення до БД.
 * @param {Object} pet - Об'єкт улюбленця (має містити id).
 * @throws {Error} Якщо у об'єкта немає ID.
 */
export async function savePet(db, pet) {
    if (!pet.id) throw new Error("Pet must have id to be saved");

    await db.run(
        `UPDATE Pets SET
                         health = ?, hunger = ?, happiness = ?,
                         energy = ?, cleanliness = ?, age = ?, coins = ?
         WHERE id = ?`,
        pet.health, pet.hunger, pet.happiness,
        pet.energy, pet.cleanliness, pet.age, pet.coins,
        pet.id
    );
}

/**
 * @brief Отримати весь інвентар улюбленця.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @returns {Promise<Array>} Список предметів в інвентарі.
 */
export async function getInventoryForPet(db, petId) {
    return await db.all("SELECT itemId, quantity, createdAt, updatedAt FROM Inventory WHERE petId = ? ORDER BY updatedAt DESC", petId);
}

/**
 * @brief Отримати конкретний предмет з інвентарю.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} itemId - ID предмета.
 * @returns {Promise<Object|undefined>} Запис про предмет в інвентарі.
 */
export async function getInventoryItem(db, petId, itemId) {
    return await db.get("SELECT id, quantity, createdAt, updatedAt FROM Inventory WHERE petId = ? AND itemId = ?", petId, itemId);
}

/**
 * @brief Додати предмет в інвентар.
 * * Якщо предмет вже є, збільшує кількість (stacking).
 * Якщо немає — створює новий запис.
 * * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} itemId - ID предмета.
 * @returns {Promise<number>} Нова кількість предметів цього типу.
 */
export async function addInventoryItem(db, petId, itemId) {
    const now = new Date().toISOString();
    const existing = await getInventoryItem(db, petId, itemId);

    if (existing) {
        await db.run("UPDATE Inventory SET quantity = ?, updatedAt = ? WHERE id = ?", existing.quantity + 1, now, existing.id);
        return existing.quantity + 1;
    } else {
        await db.run("INSERT INTO Inventory (petId, itemId, quantity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)", petId, itemId, 1, now, now);
        return 1;
    }
}

/**
 * @brief Використати (списати) предмет з інвентарю.
 * * Зменшує кількість на 1. Якщо кількість стає 0, видаляє запис.
 * * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} itemId - ID предмета.
 * @param {string} now - Поточна дата (ISO string).
 * @returns {Promise<number>} Залишок предметів.
 * @throws {Error} Якщо предмета немає або його кількість <= 0.
 */
export async function consumeInventoryItem(db, petId, itemId, now) {
    const existing = await getInventoryItem(db, petId, itemId);
    if (!existing || existing.quantity <= 0) throw new Error("Item not found in inventory");

    const newQuantity = existing.quantity - 1;
    if (newQuantity > 0) {
        await db.run("UPDATE Inventory SET quantity = ?, updatedAt = ? WHERE id = ?", newQuantity, now, existing.id);
    } else {
        await db.run("DELETE FROM Inventory WHERE id = ?", existing.id);
    }
    return newQuantity;
}

/**
 * @brief Записати факт покупки в історію.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} itemId - ID товару.
 * @param {number} price - Ціна покупки.
 */
export async function addPurchaseHistoryEntry(db, petId, itemId, price) {
    const now = new Date().toISOString();
    await db.run("INSERT INTO Purchases (petId, itemId, price, createdAt) VALUES (?, ?, ?, ?)", petId, itemId, price, now);
}

/**
 * @brief Отримати історію покупок (останні N записів).
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {number} [limit=20] - Максимальна кількість записів.
 * @returns {Promise<Array>} Список покупок.
 */
export async function getPurchaseHistory(db, petId, limit = 20) {
    return await db.all("SELECT itemId, price, createdAt FROM Purchases WHERE petId = ? ORDER BY createdAt DESC LIMIT ?", petId, limit);
}

/**
 * @brief Видалити улюбленця та всі пов'язані дані.
 * * Видаляє записи з таблиць Inventory, Purchases та Pets (каскадне видалення вручну,
 * оскільки в SQLite foreign keys не завжди увімкнені за замовчуванням або налаштовані на CASCADE).
 * * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} ownerId - ID власника (для безпеки).
 * @throws {Error} Якщо улюбленця не знайдено або немає доступу.
 */
export async function deletePet(db, petId, ownerId) {
    const pet = await getPetById(db, petId, ownerId);
    if (!pet) throw new Error("Pet not found or access denied");

    await db.run("DELETE FROM Inventory WHERE petId = ?", petId);
    await db.run("DELETE FROM Purchases WHERE petId = ?", petId);
    await db.run("DELETE FROM Pets WHERE id = ?", petId);
}
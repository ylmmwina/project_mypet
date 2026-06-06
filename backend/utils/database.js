/**
 * @file database.js
 * @brief Модуль для роботи з базою даних SQLite.
 * 
 * Цей файл містить функції для ініціалізації бази даних, створення таблиць,
 * а також методи CRUD (Create, Read, Update, Delete) для сутностей Users, Friendships, Pets, Inventory та Purchases.
 */

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";

/**
 * @brief Ініціалізує базу даних.
 * 
 * Створює файл бази даних (якщо його немає), підключається до нього
 * та створює необхідні таблиці:
 * - Users: Зберігає акаунти користувачів.
 * - Friendships: Зберігає зв'язки (дружбу) між користувачами.
 * - Pets: Зберігає інформацію про улюбленців (включно з XP та рівнем).
 * - Purchases: Історія покупок.
 * - Inventory: Інвентар предметів для кожного улюбленця.
 * 
 * @returns {Promise<Object>} Екземпляр підключення до бази даних.
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

    // Таблиця Користувачів (Акаунти)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            passwordHash TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Таблиця улюбленців
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ownerId INTEGER NOT NULL,
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
            createdAt INTEGER NOT NULL,
            FOREIGN KEY (ownerId) REFERENCES Users(id) ON DELETE CASCADE
        );
    `);

    // Таблиця Друзів
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Friendships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId1 INTEGER NOT NULL,
            userId2 INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            createdAt TEXT NOT NULL,
            FOREIGN KEY (userId1) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (userId2) REFERENCES Users(id) ON DELETE CASCADE,
            UNIQUE(userId1, userId2)
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
            FOREIGN KEY (petId) REFERENCES Pets(id) ON DELETE CASCADE
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
            FOREIGN KEY (petId) REFERENCES Pets(id) ON DELETE CASCADE
        );
    `);

    // Таблиця прогресу квестів
    await db.exec(`
        CREATE TABLE IF NOT EXISTS QuestProgress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            petId INTEGER NOT NULL,
            questId TEXT NOT NULL,
            progress INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            claimed INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            UNIQUE(petId, questId),
            FOREIGN KEY (petId) REFERENCES Pets(id) ON DELETE CASCADE
        );
    `);

    const petColumns = await db.all("PRAGMA table_info(Pets)");
    const petColumnNames = petColumns.map((column) => column.name);

    if (!petColumnNames.includes("xp")) {
        await db.exec("ALTER TABLE Pets ADD COLUMN xp INTEGER DEFAULT 0");
    }

    if (!petColumnNames.includes("level")) {
        await db.exec("ALTER TABLE Pets ADD COLUMN level INTEGER DEFAULT 1");
    }

    if (!petColumnNames.includes("coins")) {
        await db.exec("ALTER TABLE Pets ADD COLUMN coins INTEGER DEFAULT 0");
    }

    console.log("✅ База даних SQLite готова (з підтримкою акаунтів, друзів та XP).");
    return db;
}

// CRUD ДЛЯ АКАУНТІВ

/**
 * @brief Створює нового користувача.
 * @param {Object} db - Підключення до БД.
 * @param {string} username - Нікнейм.
 * @param {string} email - Електронна пошта.
 * @param {string} passwordHash - Хешований пароль.
 * @returns {Promise<number>} ID новоствореного користувача.
 */
export async function createUser(db, username, email, passwordHash) {
    const now = new Date().toISOString();
    const result = await db.run(
        "INSERT INTO Users (username, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
        username, email, passwordHash, now
    );
    return result.lastID;
}

/**
 * @brief Знаходить користувача за електронною поштою.
 * @param {Object} db - Підключення до БД.
 * @param {string} email - Електронна пошта.
 * @returns {Promise<Object|undefined>} Об'єкт користувача.
 */
export async function getUserByEmail(db, email) {
    return await db.get("SELECT * FROM Users WHERE email = ?", email);
}

/**
 * @brief Перевіряє, чи співпадає введений пароль із тим, що в базі.
 * @param {Object} db - Підключення до БД.
 * @param {string} email - Електронна пошта.
 * @param {string} password - Пароль, який ввів користувач.
 * @returns {Promise<Object|null>} Об'єкт користувача, якщо пароль ок, або null.
 */
export async function verifyUser(db, email, password) {
    const user = await getUserByEmail(db, email);
    
    if (!user) {
        return null; // Користувача з такою поштою немає
    }

    // УВАГА: Оскільки ми зберігаємо passwordHash, тут має бути логіка bcrypt.
    // Ми поки що зберігаємо паролі текстом, перевірка така:
    if (user.passwordHash === password) {
        return { id: user.id, username: user.username, email: user.email };
    }

    return null; // Пароль не підійшов
}

/**
 * @brief Знаходить користувача за його ID.
 * @param {Object} db - Підключення до БД.
 * @param {number} userId - ID користувача.
 * @returns {Promise<Object|undefined>} Об'єкт користувача без хешу пароля.
 */
export async function getUserById(db, userId) {
    return await db.get("SELECT id, username, email, createdAt FROM Users WHERE id = ?", userId);
}

// CRUD ДЛЯ ДРУЗІВ

/**
 * @brief Відправляє запит на додавання у друзі.
 * @param {Object} db - Підключення до БД.
 * @param {number} fromUserId - ID користувача, який відправляє запит.
 * @param {number} toUserId - ID користувача, якому відправляють запит.
 */
export async function sendFriendRequest(db, fromUserId, toUserId) {
    const now = new Date().toISOString();
    await db.run(
        "INSERT INTO Friendships (userId1, userId2, status, createdAt) VALUES (?, ?, 'pending', ?)",
        fromUserId, toUserId, now
    );
}

/**
 * @brief Приймає запит на додавання у друзі.
 * @param {Object} db - Підключення до БД.
 * @param {number} fromUserId - ID користувача, який відправляв запит.
 * @param {number} toUserId - ID користувача, який приймає запит.
 */
export async function acceptFriendRequest(db, fromUserId, toUserId) {
    await db.run(
        "UPDATE Friendships SET status = 'accepted' WHERE userId1 = ? AND userId2 = ?",
        fromUserId, toUserId
    );
}

/**
 * @brief Отримує список підтверджених друзів користувача.
 * @param {Object} db - Підключення до БД.
 * @param {number} userId - ID користувача.
 * @returns {Promise<Array>} Список друзів (масив об'єктів з id та username).
 */
export async function getFriendsList(db, userId) {
    return await db.all(`
        SELECT u.id, u.username 
        FROM Users u
        JOIN Friendships f ON (u.id = f.userId1 OR u.id = f.userId2)
        WHERE f.status = 'accepted' 
          AND u.id != ? 
          AND (f.userId1 = ? OR f.userId2 = ?)
    `, userId, userId, userId);
}

// CRUD ДЛЯ ПЕТІВ

/**
 * @brief Отримати всіх улюбленців конкретного власника.
 * @param {Object} db - Підключення до БД.
 * @param {number} ownerId - ID власника.
 * @returns {Promise<Array>} Масив об'єктів улюбленців.
 */
export async function getAllPetsByOwnerId(db, ownerId) {
    return await db.all("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
}

/**
 * @brief Отримати улюбленця за його ID та ID власника.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {number} ownerId - ID власника (для перевірки доступу).
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
 * @param {number} ownerId - ID власника.
 * @returns {Promise<Object|undefined>} Об'єкт улюбленця.
 */
export async function getPetByOwnerId(db, ownerId) {
    return await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
}

/**
 * @brief Отримати тільки ID улюбленця власника.
 * @param {Object} db - Підключення до БД.
 * @param {number} ownerId - ID власника.
 * @returns {Promise<number|null>} ID улюбленця або null.
 */
export async function getPetIdByOwnerId(db, ownerId) {
    const row = await db.get("SELECT id FROM Pets WHERE ownerId = ?", ownerId);
    return row ? row.id : null;
}

/**
 * @brief Зберегти змінений стан улюбленця в БД.
 * 
 * Оновлює основні показники (здоров'я, голод, щастя, монети, XP, рівень тощо).
 * 
 * @param {Object} db - Підключення до БД.
 * @param {Object} pet - Об'єкт улюбленця (має містити id).
 * @throws {Error} Якщо у об'єкта немає ID.
 */
export async function savePet(db, pet) {
    if (!pet.id) throw new Error("Pet must have id to be saved");

    await db.run(
        `UPDATE Pets SET 
            health = ?, hunger = ?, happiness = ?, 
            energy = ?, cleanliness = ?, age = ?, coins = ?, 
            xp = ?, level = ?
         WHERE id = ?`,
        pet.health, pet.hunger, pet.happiness,
        pet.energy, pet.cleanliness, pet.age, pet.coins,
        pet.xp, pet.level,
        pet.id
    );
}

// ІНВЕНТАР ТА ПОКУПКИ

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
 * 
 * Якщо предмет вже є, збільшує кількість (stacking).
 * Якщо немає — створює новий запис.
 * 
 * @param {Object} db - Підключення до БД.
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
 * 
 * Зменшує кількість на 1. Якщо кількість стає 0, видаляє запис.
 * 
 * @param {Object} db - Підключення до БД.
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
 * 
 * Видаляє записи з таблиць Inventory, Purchases та Pets.
 * 
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {number} ownerId - ID власника (для безпеки).
 * @throws {Error} Якщо улюбленця не знайдено або немає доступу.
 */
export async function deletePet(db, petId, ownerId) {
    const pet = await getPetById(db, petId, ownerId);
    if (!pet) throw new Error("Pet not found or access denied");

    await db.run("DELETE FROM Inventory WHERE petId = ?", petId);
    await db.run("DELETE FROM Purchases WHERE petId = ?", petId);
    await db.run("DELETE FROM Pets WHERE id = ?", petId);
}

// CRUD ДЛЯ КВЕСТІВ

/**
 * @brief Отримати прогрес усіх квестів для улюбленця.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @returns {Promise<Array>} Список записів прогресу квестів.
 */
export async function getQuestProgressForPet(db, petId) {
    return await db.all(
        "SELECT * FROM QuestProgress WHERE petId = ?",
        petId
    );
}

/**
 * @brief Отримати прогрес конкретного квесту для улюбленця.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} questId - ID квесту.
 * @returns {Promise<Object|undefined>} Запис прогресу квесту або undefined.
 */
export async function getQuestProgressById(db, petId, questId) {
    return await db.get(
        "SELECT * FROM QuestProgress WHERE petId = ? AND questId = ?",
        petId,
        questId
    );
}

/**
 * @brief Створити початковий запис прогресу квесту.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} questId - ID квесту.
 * @returns {Promise<Object>} Створений або вже існуючий запис прогресу.
 */
export async function createQuestProgress(db, petId, questId) {
    const now = new Date().toISOString();

    await db.run(
        `INSERT OR IGNORE INTO QuestProgress 
            (petId, questId, progress, completed, claimed, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        petId,
        questId,
        0,
        0,
        0,
        now,
        now
    );

    return await getQuestProgressById(db, petId, questId);
}

/**
 * @brief Оновити прогрес квесту.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} questId - ID квесту.
 * @param {number} progress - Нове значення прогресу.
 * @param {boolean} completed - Чи виконаний квест.
 * @returns {Promise<Object>} Оновлений запис прогресу.
 */
export async function updateQuestProgress(db, petId, questId, progress, completed) {
    const now = new Date().toISOString();

    await db.run(
        `UPDATE QuestProgress 
         SET progress = ?, completed = ?, updatedAt = ?
         WHERE petId = ? AND questId = ?`,
        progress,
        completed ? 1 : 0,
        now,
        petId,
        questId
    );

    return await getQuestProgressById(db, petId, questId);
}

/**
 * @brief Позначити нагороду за квест як отриману.
 * @param {Object} db - Підключення до БД.
 * @param {number} petId - ID улюбленця.
 * @param {string} questId - ID квесту.
 * @returns {Promise<Object>} Оновлений запис прогресу.
 */
export async function markQuestClaimed(db, petId, questId) {
    const now = new Date().toISOString();

    await db.run(
        `UPDATE QuestProgress 
         SET claimed = 1, updatedAt = ?
         WHERE petId = ? AND questId = ?`,
        now,
        petId,
        questId
    );

    return await getQuestProgressById(db, petId, questId);
}
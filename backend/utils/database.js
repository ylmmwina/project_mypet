import sqlite3 from "sqlite3";
import { open } from "sqlite";

//ця функція буде запускатися один раз при старті сервера
export async function setupDatabase() {
    //відкриваємо (або створюємо, якщо немає) файл бази даних
    const db = await open({
        filename: './backend/storage/pets.db',
        driver: sqlite3.Database
    });

    //Виконуємо запит на створення таблиці, ЯКЩО вона ще не існує
    //Це безпечно запускати кожного разу
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ownerId TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            age INTEGER DEFAULT 0,
            health INTEGER DEFAULT 100,
            hunger INTEGER DEFAULT 0,
            happiness INTEGER DEFAULT 0,
            energy INTEGER DEFAULT 0,
            cleanliness INTEGER DEFAULT 0,
            coins INTEGER DEFAULT 0
        );
    `);

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

    console.log("✅ База даних SQLite готова.");
    return db;
}
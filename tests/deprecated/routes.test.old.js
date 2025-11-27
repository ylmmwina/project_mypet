import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express'; // Беремо експрес, щоб створити тестовий додаток
import registerPetRoutes from '../../backend/routes/petRoutes.js'; // Імпортуємо тільки функцію маршрутів
import Storage from '../backend/utils/storage.js';
import Pet from '../../backend/models/pet.js';

// Створюємо окремий тестовий додаток, щоб не чіпати server.js
const app = express();
app.use(express.json()); // Обов'язково додаємо парсер JSON, як у вас в server.js
registerPetRoutes(app);  // Підключаємо ваші маршрути до цього тестового додатку

describe("API Routes Integration Tests", () => {

    // Глушимо консоль, щоб звіт був чистим
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- ТЕСТ 1: Отримання даних (GET) ---
    test("GET /pet should return empty object if no pet exists", async () => {
        // Обманюємо Storage: кажемо, що файлу немає (повертає null)
        jest.spyOn(Storage, 'loadPetSafe').mockReturnValue(null);

        // Робимо запит до нашого тестового server
        const response = await request(app).get('/pet');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    test("GET /pet should return pet data if pet exists", async () => {
        // Обманюємо Storage: кажемо, що він знайшов кота Барсіка
        const mockPet = new Pet("Barsik", "cat", 1, 100, 0, 100, 100);
        jest.spyOn(Storage, 'loadPetSafe').mockReturnValue(mockPet);

        const response = await request(app).get('/pet');

        expect(response.status).toBe(200);
        expect(response.body.name).toBe("Barsik");
        expect(response.body.type).toBe("cat");
    });

    // --- ТЕСТ 2: Створення (POST) ---
    test("POST /create-pet should create a new pet", async () => {
        // 1. Шпигуємо за createPet, щоб він НЕ писав реальний файл
        const createSpy = jest.spyOn(Storage, 'createPet').mockImplementation(() => {});

        // 2. Шпигуємо за loadPetSafe (бо сервер повертає створеного улюбленця)
        const mockPet = new Pet("Rex", "dog", 0, 100, 0, 100, 100);
        jest.spyOn(Storage, 'loadPetSafe').mockReturnValue(mockPet);

        // 3. Відправляємо дані
        const response = await request(app)
            .post('/create-pet')
            .send({ name: "Rex", type: "dog" });

        // 4. Перевірки
        expect(response.status).toBe(200);
        // Перевіряємо, що функція createPet викликалась з правильними аргументами
        expect(createSpy).toHaveBeenCalledWith("Rex", "dog");
        // Перевіряємо, що сервер відповів даними про Рекса
        expect(response.body.name).toBe("Rex");
    });
});
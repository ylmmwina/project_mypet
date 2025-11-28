/**
 * @file shopItems.test.js
 * @brief Юніт-тести для перевірки логіки застосування ефектів предметів (applyItemEffects).
 * * Перевіряє коректність роботи функції clamp та найважливіше — поліморфну
 * логіку, де ефекти предметів залежать від типу улюбленця (cat, dog, monkey).
 */

import { describe, test, expect } from "@jest/globals";
import {
    clamp,
    shopItems,
    findShopItem,
    applyItemEffects
} from "../backend/shop/shopItems.js";
import Pet from "../backend/models/pet.js";

// Хелпер для створення пета з дефолтами
/**
 * @brief Допоміжна функція для створення тестового об'єкта Pet.
 * @param {string} [type='dog'] - Тип улюбленця.
 * @param {Object} [overrides={}] - Параметри, що перезаписують дефолтні.
 * @returns {Pet} Новий екземпляр класу Pet.
 */
function createPet(type = "dog", overrides = {}) {
    return new Pet(
        overrides.name ?? "TestPet",
        type,
        overrides.age ?? 0,
        overrides.health ?? 50,
        overrides.hunger ?? 50,
        overrides.happiness ?? 50,
        overrides.energy ?? 50,
        overrides.cleanliness ?? 50,
        overrides.coins ?? 0,
        overrides.id ?? 1,
        overrides.ownerId ?? "owner-1"
    );
}

/**
 * @namespace ShopItemsTestSuite
 * @brief Набір тестів для утиліт та ефектів предметів.
 */
describe("shopItems utilities", () => {
    /**
     * @test clamp
     * @brief Перевіряє, чи коректно функція clamp обмежує значення.
     */
    test("clamp обмежує значення в діапазоні [min, max]", () => {
        expect(clamp(50, 0, 100)).toBe(50);
        expect(clamp(-10, 0, 100)).toBe(0);
        expect(clamp(150, 0, 100)).toBe(100);
    });

    /**
     * @test findShopItem
     * @brief Перевіряє, чи коректно функція findShopItem знаходить товар.
     */
    test("findShopItem знаходить товар по id або повертає undefined", () => {
        const item = findShopItem("basic_food");
        expect(item).toBeDefined();
        expect(item.id).toBe("basic_food");

        const unknown = findShopItem("unknown_id");
        expect(unknown).toBeUndefined();
    });

    /**
     * @test shopItems structure
     * @brief Перевіряє, чи має масив shopItems коректну структуру об'єктів.
     */
    test("shopItems містить валідні товари (id, name, type, price, effects)", () => {
        expect(Array.isArray(shopItems)).toBe(true);
        expect(shopItems.length).toBeGreaterThan(0);

        for (const item of shopItems) {
            expect(typeof item.id).toBe("string");
            expect(typeof item.name).toBe("string");
            expect(typeof item.type).toBe("string");
            expect(typeof item.price).toBe("number");
            expect(typeof item.effects).toBe("object");
        }
    });

    /**
     * @test applyItemEffects - межі
     * @brief Перевіряє, чи applyItemEffects поважає обмеження 0-100.
     */
    test("applyItemEffects: стандартні ефекти не виходять за межі 0–100", () => {
        const pet = createPet("dog", {
            health: 95,
            hunger: 10,
            happiness: 90,
            energy: 95,
            cleanliness: 95
        });

        const item = {
            id: "test_item",
            type: "food",
            effects: {
                health: +10,   // 95 + 10 = 105 -> 100
                hunger: -30,   // 10 - 30 = -20 -> 0
                happiness: +20,
                energy: +20,
                cleanliness: -50
            }
        };

        applyItemEffects(pet, item);

        expect(pet.health).toBe(100);
        expect(pet.hunger).toBe(0);
        expect(pet.happiness).toBe(100);
        expect(pet.energy).toBe(100);
        expect(pet.cleanliness).toBeGreaterThanOrEqual(0);
    });

    /**
     * @test applyItemEffects - monkey logic
     * @brief Перевіряє бонусні ефекти для мавпи (любов до бананового снеку).
     */
    test("applyItemEffects: monkey отримує бонус від banana_snack", () => {
        const pet = createPet("monkey", {
            happiness: 50,
            energy: 10,
            hunger: 60
        });

        const banana = findShopItem("banana_snack");
        expect(banana).toBeDefined();

        applyItemEffects(pet, banana);

        // Очікуваний результат: happiness +25, energy +5, hunger -25
        expect(pet.happiness).toBe(75);
        expect(pet.energy).toBe(15);
        expect(pet.hunger).toBe(35);
    });

    /**
     * @test applyItemEffects - dog logic
     * @brief Перевіряє бонусні ефекти для собаки (енергія від їжі та радість від миття).
     */
    test("applyItemEffects: dog отримує +energy від food і +happiness від soap", () => {
        const dogFood = findShopItem("basic_food");
        const dog = createPet("dog", {
            energy: 40,
            hunger: 70
        });

        // Тест 1: Їжа
        applyItemEffects(dog, dogFood);

        // energy: 40 + 5 (dog bonus) = 45
        expect(dog.energy).toBe(45);
        expect(dog.hunger).toBe(50); // 70 - 20 (base effect)

        const soap = findShopItem("soap_basic");
        const dog2 = createPet("dog", {
            cleanliness: 80,
            happiness: 40
        });

        // Тест 2: Мило
        applyItemEffects(dog2, soap);
        // happiness: 40 + 5 (base effect) + 5 (dog bonus) = 50
        expect(dog2.cleanliness).toBe(30); // 80 - 50 (base effect)
        expect(dog2.happiness).toBe(50);
    });

    /**
     * @test applyItemEffects - cat logic
     * @brief Перевіряє специфічні ефекти для кота (любов до преміум-їжі та нелюбов до мила).
     */
    test("applyItemEffects: cat любить premium_food і не любить soap", () => {
        const premium = findShopItem("premium_food");
        const cat = createPet("cat", {
            happiness: 60,
            energy: 10,
            hunger: 80
        });

        // Тест 1: Premium Food (бонус +10 happiness, +5 energy)
        applyItemEffects(cat, premium);

        // happiness: 60 + 5 (base) + 10 (cat bonus) = 75
        // energy: 10 + 5 (cat bonus) = 15
        expect(cat.happiness).toBe(75);
        expect(cat.energy).toBe(15);
        expect(cat.hunger).toBe(40);

        const soap = findShopItem("soap_basic");
        const cat2 = createPet("cat", {
            cleanliness: 70,
            happiness: 50
        });

        // Тест 2: Soap (базово +5 happiness, cat penalty -5 happiness)
        applyItemEffects(cat2, soap);

        // happiness: 50 + 5 (base) - 5 (cat penalty) = 50
        expect(cat2.cleanliness).toBe(20);
        expect(cat2.happiness).toBe(50); // Без змін
    });
});
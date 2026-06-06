/**
 * @file shopItems.test.js
 * @brief Юніт-тести для перевірки логіки товарів магазину.
 *
 * Перевіряє clamp, структуру shopItems, rarity, нові предмети
 * та логіку застосування ефектів предметів до різних типів улюбленців.
 */

import { describe, test, expect } from "@jest/globals";
import {
    clamp,
    shopItems,
    findShopItem,
    applyItemEffects
} from "../backend/shop/shopItems.js";
import Pet from "../backend/models/pet.js";

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
        overrides.ownerId ?? "owner-1",
        overrides.xp ?? 0,
        overrides.level ?? 1
    );
}

/**
 * @namespace ShopItemsTestSuite
 * @brief Набір тестів для утиліт, rarity та ефектів предметів.
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
     * @brief Перевіряє базову структуру всіх товарів магазину.
     */
    test("shopItems містить валідні товари", () => {
        expect(Array.isArray(shopItems)).toBe(true);
        expect(shopItems.length).toBeGreaterThan(0);

        for (const item of shopItems) {
            expect(typeof item.id).toBe("string");
            expect(typeof item.name).toBe("string");
            expect(typeof item.type).toBe("string");
            expect(typeof item.rarity).toBe("string");
            expect(typeof item.price).toBe("number");
            expect(typeof item.effects).toBe("object");
        }
    });

    /**
     * @test rarity
     * @brief Перевіряє, що всі товари мають дозволене значення rarity.
     */
    test("кожен товар має валідну rarity", () => {
        const allowedRarities = ["common", "rare", "epic"];

        for (const item of shopItems) {
            expect(allowedRarities).toContain(item.rarity);
        }
    });

    /**
     * @test new shop items
     * @brief Перевіряє, що нові предмети фінальної версії існують у магазині.
     */
    test("магазин містить нові предмети фінальної версії", () => {
        const expectedNewItems = [
            "energy_drink",
            "vitamin_boost",
            "bubble_bath",
            "golden_toy",
            "royal_treat"
        ];

        for (const itemId of expectedNewItems) {
            const item = findShopItem(itemId);

            expect(item).toBeDefined();
            expect(item.id).toBe(itemId);
            expect(item.price).toBeGreaterThan(0);
            expect(item.effects).toBeDefined();
        }
    });

    /**
     * @test rarity distribution
     * @brief Перевіряє, що в магазині є товари різних рівнів рідкості.
     */
    test("магазин містить common, rare та epic предмети", () => {
        const rarities = shopItems.map((item) => item.rarity);

        expect(rarities).toContain("common");
        expect(rarities).toContain("rare");
        expect(rarities).toContain("epic");
    });

    /**
     * @test base item rarity
     * @brief Перевіряє rarity для базових предметів магазину.
     */
    test("базові предмети мають очікувану rarity", () => {
        expect(findShopItem("basic_food").rarity).toBe("common");
        expect(findShopItem("soap_basic").rarity).toBe("common");
        expect(findShopItem("banana_snack").rarity).toBe("common");
        expect(findShopItem("medkit_small").rarity).toBe("common");
        expect(findShopItem("premium_food").rarity).toBe("rare");
    });

    /**
     * @test specific rarity
     * @brief Перевіряє конкретні rarity для нових предметів.
     */
    test("нові предмети мають очікувану rarity", () => {
        expect(findShopItem("energy_drink").rarity).toBe("rare");
        expect(findShopItem("vitamin_boost").rarity).toBe("rare");
        expect(findShopItem("bubble_bath").rarity).toBe("rare");
        expect(findShopItem("golden_toy").rarity).toBe("epic");
        expect(findShopItem("royal_treat").rarity).toBe("epic");
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
                health: +10,
                hunger: -30,
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
     * @test applyItemEffects - XP
     * @brief Перевіряє, що використання предмета додає XP.
     */
    test("applyItemEffects додає XP після використання предмета", () => {
        const pet = createPet("dog", {
            xp: 0,
            level: 1
        });

        const item = findShopItem("basic_food");

        applyItemEffects(pet, item);

        expect(pet.xp).toBe(15);
        expect(pet.level).toBe(1);
    });

    /**
     * @test applyItemEffects - monkey logic
     * @brief Перевіряє бонусні ефекти для мавпи.
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

        expect(pet.happiness).toBe(75);
        expect(pet.energy).toBe(15);
        expect(pet.hunger).toBe(35);
    });

    /**
     * @test applyItemEffects - dog logic
     * @brief Перевіряє бонусні ефекти для собаки.
     */
    test("applyItemEffects: dog отримує +energy від food і +happiness від soap", () => {
        const dogFood = findShopItem("basic_food");
        const dog = createPet("dog", {
            energy: 40,
            hunger: 70
        });

        applyItemEffects(dog, dogFood);

        expect(dog.energy).toBe(45);
        expect(dog.hunger).toBe(50);

        const soap = findShopItem("soap_basic");
        const dog2 = createPet("dog", {
            cleanliness: 80,
            happiness: 40
        });

        applyItemEffects(dog2, soap);

        expect(dog2.cleanliness).toBe(30);
        expect(dog2.happiness).toBe(50);
    });

    /**
     * @test applyItemEffects - cat logic
     * @brief Перевіряє специфічні ефекти для кота.
     */
    test("applyItemEffects: cat любить premium_food і не любить soap", () => {
        const premium = findShopItem("premium_food");
        const cat = createPet("cat", {
            happiness: 60,
            energy: 10,
            hunger: 80
        });

        applyItemEffects(cat, premium);

        expect(cat.happiness).toBe(75);
        expect(cat.energy).toBe(15);
        expect(cat.hunger).toBe(40);

        const soap = findShopItem("soap_basic");
        const cat2 = createPet("cat", {
            cleanliness: 70,
            happiness: 50
        });

        applyItemEffects(cat2, soap);

        expect(cat2.cleanliness).toBe(20);
        expect(cat2.happiness).toBe(50);
    });

    /**
     * @test new rare items effects
     * @brief Перевіряє ефекти нових rare-предметів.
     */
    test("нові rare предмети коректно змінюють стани пета", () => {
        const energyPet = createPet("dog", {
            energy: 30,
            hunger: 20,
            happiness: 40
        });

        applyItemEffects(energyPet, findShopItem("energy_drink"));

        expect(energyPet.energy).toBe(65);
        expect(energyPet.hunger).toBe(25);
        expect(energyPet.happiness).toBe(45);

        const vitaminPet = createPet("cat", {
            health: 60,
            energy: 20
        });

        applyItemEffects(vitaminPet, findShopItem("vitamin_boost"));

        expect(vitaminPet.health).toBe(85);
        expect(vitaminPet.energy).toBe(35);

        const bathPet = createPet("dog", {
            cleanliness: 90,
            happiness: 40
        });

        applyItemEffects(bathPet, findShopItem("bubble_bath"));

        expect(bathPet.cleanliness).toBe(20);
        expect(bathPet.happiness).toBe(60);
    });

    /**
     * @test new epic items effects
     * @brief Перевіряє ефекти нових epic-предметів.
     */
    test("нові epic предмети коректно змінюють стани пета", () => {
        const toyPet = createPet("dog", {
            happiness: 40,
            energy: 50
        });

        applyItemEffects(toyPet, findShopItem("golden_toy"));

        expect(toyPet.happiness).toBe(90);
        expect(toyPet.energy).toBe(40);

        const treatPet = createPet("cat", {
            hunger: 70,
            happiness: 40,
            health: 60
        });

        applyItemEffects(treatPet, findShopItem("royal_treat"));

        expect(treatPet.hunger).toBe(25);
        expect(treatPet.happiness).toBe(65);
        expect(treatPet.health).toBe(75);
    });
});
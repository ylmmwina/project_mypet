import { describe, test, expect } from "@jest/globals";
import {
  clamp,
  shopItems,
  findShopItem,
  applyItemEffects
} from "../backend/shop/shopItems.js";
import Pet from "../backend/models/pet.js";

// Хелпер для створення пета з дефолтами
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

describe("shopItems utilities", () => {
  test("clamp обмежує значення в діапазоні [min, max]", () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
  });

  test("findShopItem знаходить товар по id або повертає undefined", () => {
    const item = findShopItem("basic_food");
    expect(item).toBeDefined();
    expect(item.id).toBe("basic_food");

    const unknown = findShopItem("unknown_id");
    expect(unknown).toBeUndefined();
  });

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

  test("applyItemEffects: monkey отримує бонус від banana_snack", () => {
    const pet = createPet("monkey", {
      happiness: 50,
      energy: 10,
      hunger: 60
    });

    const banana = findShopItem("banana_snack");
    expect(banana).toBeDefined();

    applyItemEffects(pet, banana);

    /*
    базовий ефект banana_snack:
       happiness +10, hunger -25
    бонуси для monkey:
       +10 happiness (за banana_snack)
       +5 energy (за banana_snack)
       +5 happiness (за будь-яку food)
    разом: happiness +25, energy +5
    */

    expect(pet.happiness).toBe(75); 
    expect(pet.energy).toBe(15);    
    expect(pet.hunger).toBe(35);    
  });

  test("applyItemEffects: dog отримує +energy від food і +happiness від soap", () => {
    const dogFood = findShopItem("basic_food");
    const dog = createPet("dog", {
      energy: 40,
      hunger: 70
    });

    applyItemEffects(dog, dogFood);

    // basic_food: hunger -20, health +5
    // dog-бонус: energy +5 для будь-якого food
    expect(dog.energy).toBe(45);
    expect(dog.hunger).toBe(50);

    const soap = findShopItem("soap_basic");
    const dog2 = createPet("dog", {
      cleanliness: 80,
      happiness: 40
    });

    applyItemEffects(dog2, soap);
    // soap_basic: cleanliness -50, happiness +5
    // dog-бонус: happiness +5 для soap → разом happiness +10
    expect(dog2.cleanliness).toBe(30);
    expect(dog2.happiness).toBe(50);
  });

  test("applyItemEffects: cat любить premium_food і не любить soap", () => {
    const premium = findShopItem("premium_food");
    const cat = createPet("cat", {
      happiness: 60,
      energy: 10,
      hunger: 80
    });

    applyItemEffects(cat, premium);

    /*базовий ефект premium_food:
       happiness +5, health +10, hunger -40
    бонуси для cat з premium_food:
       +10 happiness
       +5 energy
    разом: happiness +15, energy +5
    */
    expect(cat.happiness).toBe(75); 
    expect(cat.energy).toBe(15);    
    expect(cat.hunger).toBe(40);    

    const soap = findShopItem("soap_basic");
    const cat2 = createPet("cat", {
      cleanliness: 70,
      happiness: 50
    });

    applyItemEffects(cat2, soap);

    // soap_basic: cleanliness -50, happiness +5
    // cat-бонус: happiness -5 для soap → сумарно 0
    expect(cat2.cleanliness).toBe(20);
    expect(cat2.happiness).toBe(50);
  });
});

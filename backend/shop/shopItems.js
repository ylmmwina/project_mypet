// Обмеження значень 0–100
export const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

// Список товарів магазину
export const shopItems = [
    {
        id: "basic_food",
        name: "Звичайний корм",
        type: "food",
        price: 10,
        effects: {
            hunger: -20,
            health: +5
        }
    },
    {
        id: "premium_food",
        name: "Преміум корм",
        type: "food",
        price: 25,
        effects: {
            hunger: -40,
            health: +10,
            happiness: +5
        }
    },
    {
        id: "banana_snack",
        name: "Банановий снек",
        type: "food",
        price: 15,
        effects: {
            hunger: -25,
            happiness: +10
        }
    },
    {
        id: "soap_basic",
        name: "Мило для купання",
        type: "soap",
        price: 15,
        effects: {
            cleanliness: -50,
            happiness: +5
        }
    },
    {
        id: "medkit_small",
        name: "Аптечка",
        type: "medkit",
        price: 30,
        effects: {
            health: +40,
            hunger: +5
        }
    }
];

// Знайти товар по id
export const findShopItem = (itemId) =>
    shopItems.find((item) => item.id === itemId);

// Застосувати ефекти товару
export function applyItemEffects(pet, item) {
    const effects = item.effects || {};

    if (effects.health) {
        pet.health = clamp(pet.health + effects.health, 0, 100);
    }
    if (effects.hunger) {
        pet.hunger = clamp(pet.hunger + effects.hunger, 0, 100);
    }
    if (effects.happiness) {
        pet.happiness = clamp(pet.happiness + effects.happiness, 0, 100);
    }
    if (effects.energy) {
        pet.energy = clamp(pet.energy + effects.energy, 0, 100);
    }
    if (effects.cleanliness) {
        pet.cleanliness = clamp(pet.cleanliness + effects.cleanliness, 0, 100);
    }
}

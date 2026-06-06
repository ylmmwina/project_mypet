/**
 * @file shopItems.js
 * @brief Конфігурація товарів та логіка їх впливу.
 *
 * Цей файл містить базу даних доступних для покупки предметів,
 * а також логіку застосування їх ефектів на улюбленців з урахуванням
 * особливостей кожного типу тварини.
 */

/**
 * @brief Обмежує числове значення заданим діапазоном.
 *
 * Використовується для того, щоб показники здоров'я, голоду,
 * щастя, енергії та чистоти не виходили за межі 0-100.
 *
 * @param {number} value - Вхідне значення.
 * @param {number} min - Мінімальна межа.
 * @param {number} max - Максимальна межа.
 * @returns {number} Значення в межах [min, max].
 */
export const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

/**
 * @brief Список товарів, доступних у магазині.
 *
 * Кожен товар має унікальний ID, назву, тип, рідкість,
 * ціну та об'єкт ефектів.
 *
 * Rarity використовується для фінальної версії проєкту:
 * common, rare або epic.
 *
 * @type {Array<Object>}
 * @property {string} id - Унікальний ідентифікатор товару.
 * @property {string} name - Назва для відображення.
 * @property {string} type - Тип предмета.
 * @property {string} rarity - Рідкість предмета: common, rare або epic.
 * @property {number} price - Вартість у монетах.
 * @property {Object} effects - Зміни показників.
 */
export const shopItems = [
    {
        id: "basic_food",
        name: "Звичайний корм",
        type: "food",
        rarity: "common",
        price: 10,
        effects: {
            hunger: -20,
            health: +5
        }
    },
    {
        id: "soap_basic",
        name: "Мило для купання",
        type: "soap",
        rarity: "common",
        price: 15,
        effects: {
            cleanliness: -50,
            happiness: +5
        }
    },
    {
        id: "banana_snack",
        name: "Банановий снек",
        type: "food",
        rarity: "common",
        price: 15,
        effects: {
            hunger: -25,
            happiness: +10
        }
    },
    {
        id: "premium_food",
        name: "Преміум корм",
        type: "food",
        rarity: "rare",
        price: 25,
        effects: {
            hunger: -40,
            health: +10,
            happiness: +5
        }
    },
    {
        id: "medkit_small",
        name: "Аптечка",
        type: "medkit",
        rarity: "common",
        price: 30,
        effects: {
            health: +40,
            hunger: +5
        }
    },
    {
        id: "energy_drink",
        name: "Енергетичний напій",
        type: "energy",
        rarity: "rare",
        price: 35,
        effects: {
            energy: +35,
            hunger: +5,
            happiness: +5
        }
    },
    {
        id: "vitamin_boost",
        name: "Вітамінний буст",
        type: "medkit",
        rarity: "rare",
        price: 40,
        effects: {
            health: +25,
            energy: +15
        }
    },
    {
        id: "bubble_bath",
        name: "Пінна ванна",
        type: "soap",
        rarity: "rare",
        price: 35,
        effects: {
            cleanliness: -70,
            happiness: +15
        }
    },
    {
        id: "golden_toy",
        name: "Золота іграшка",
        type: "toy",
        rarity: "epic",
        price: 60,
        effects: {
            happiness: +45,
            energy: -10
        }
    },
    {
        id: "royal_treat",
        name: "Королівський смаколик",
        type: "food",
        rarity: "epic",
        price: 75,
        effects: {
            hunger: -45,
            happiness: +20,
            health: +15
        }
    }

];

/**
 * @brief Знаходить товар за його ID.
 *
 * @param {string} itemId - Ідентифікатор товару.
 * @returns {Object|undefined} Об'єкт товару або undefined, якщо товар не знайдено.
 */
export const findShopItem = (itemId) =>
    shopItems.find((item) => item.id === itemId);

/**
 * @brief Застосовує ефекти предмета до улюбленця.
 *
 * Функція враховує базові ефекти предмета та додаткові особливості
 * для різних типів тварин.
 *
 * @param {Object} pet - Об'єкт улюбленця.
 * @param {Object} item - Об'єкт предмета з shopItems.
 */
export function applyItemEffects(pet, item) {
    const effects = { ...item.effects };

    pet.addXp(15);

    // Мавпа особливо любить банани та будь-яку їжу.
    if (pet.type === "monkey") {
        if (item.id === "banana_snack") {
            effects.happiness = (effects.happiness || 0) + 10;
            effects.energy = (effects.energy || 0) + 5;
        }

        if (item.type === "food") {
            effects.happiness = (effects.happiness || 0) + 5;
        }
    }

    // Собака отримує додаткову енергію від їжі та краще реагує на миття.
    if (pet.type === "dog") {
        if (item.type === "food") {
            effects.energy = (effects.energy || 0) + 5;
        }

        if (item.type === "soap") {
            effects.happiness = (effects.happiness || 0) + 5;
        }

        if (item.id === "golden_toy") {
            effects.happiness = (effects.happiness || 0) + 5;
        }
    }

    // Кіт любить преміум-їжу, але не дуже любить миття.
    if (pet.type === "cat") {
        if (item.id === "basic_food") {
            effects.happiness = (effects.happiness || 0) + 5;
        }

        if (item.id === "premium_food") {
            effects.happiness = (effects.happiness || 0) + 10;
            effects.energy = (effects.energy || 0) + 5;
        }

        if (item.type === "soap") {
            effects.happiness = (effects.happiness || 0) - 5;
        }

        if (item.id === "royal_treat") {
            effects.happiness = (effects.happiness || 0) + 5;
        }
    }

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
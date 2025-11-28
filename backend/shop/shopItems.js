/**
 * @file shopItems.js
 * @brief Конфігурація товарів та логіка їх впливу.
 * * Цей файл містить базу даних доступних для покупки предметів,
 * а також логіку застосування їх ефектів на улюбленців з урахуванням
 * особливостей кожного типу тварини (поліморфізм).
 */

/**
 * @brief Обмежує числове значення заданим діапазоном.
 * * Використовується для того, щоб показники (здоров'я, голод тощо) не виходили
 * за межі 0-100.
 * * @param {number} value - Вхідне значення.
 * @param {number} min - Мінімальна межа.
 * @param {number} max - Максимальна межа.
 * @returns {number} Значення в межах [min, max].
 */
export const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

/**
 * @brief Список товарів, доступних у магазині.
 * * Кожен товар має унікальний ID, назву, тип, ціну та об'єкт ефектів.
 * * @type {Array<Object>}
 * @property {string} id - Унікальний ідентифікатор товару.
 * @property {string} name - Назва для відображення.
 * @property {string} type - Тип предмета ('food', 'soap', 'medkit').
 * @property {number} price - Вартість у монетах.
 * @property {Object} effects - Зміни показників (ключ: параметр, значення: дельта).
 */
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

/**
 * @brief Знайти товар за його ID.
 * * @param {string} itemId - Ідентифікатор товару.
 * @returns {Object|undefined} Об'єкт товару або undefined, якщо не знайдено.
 */
export const findShopItem = (itemId) =>
    shopItems.find((item) => item.id === itemId);

/**
 * @brief Застосувати ефекти предмета до улюбленця.
 * * Ця функція реалізує складну логіку взаємодії предметів з різними типами тварин.
 * Наприклад, мавпи отримують бонуси від бананів, а коти можуть вередувати.
 * * @param {Object} pet - Об'єкт улюбленця (екземпляр класу Pet).
 * @param {Object} item - Об'єкт предмета з shopItems.
 */
export function applyItemEffects(pet, item) {
    const effects = { ...item.effects }; // копія, щоб можна було змінювати

    // МАВПА — обожнює банани
    if (pet.type === "monkey") {
        if (item.id === "banana_snack") {
            effects.happiness = (effects.happiness || 0) + 10;
            effects.energy = (effects.energy || 0) + 5;
        }
        if (item.type === "food") {
            effects.happiness = (effects.happiness || 0) + 5;
        }
    }

    // СОБАКА — активна, отримує енергію від будь-якої їжі, любить миття
    if (pet.type === "dog") {
        if (item.type === "food") {
            effects.energy = (effects.energy || 0) + 5;
        }
        if (item.type === "soap") {
            effects.happiness = (effects.happiness || 0) + 5;
        }
    }

    // КІТ — вибагливий
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
    }

    // Застосування базових ефектів з обмеженням (clamp)
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
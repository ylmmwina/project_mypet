/**
 * @file pet.js
 * Модель, що описує сутність улюбленця (Pet).
 *
 * Цей файл містить клас Pet, який реалізує основну ігрову логіку:
 * стани улюбленця (здоров'я, голод, щастя тощо) та методи взаємодії з ним.
 */

/**
 * Клас для представлення віртуального улюбленця.
 *
 * Зберігає поточні показники стану тварини та надає методи для їх зміни
 * (годування, гра, сон, лікування тощо). Також містить метод live(),
 * який викликається ігровим циклом для симуляції плину часу.
 *
 * @class Pet
 */
export default class Pet {
    /**
     * Конструктор класу Pet.
     * Створює новий екземпляр віртуального улюбленця з заданими параметрами.
     *
     * @constructor
     * @param {string} name - Ім'я улюбленця
     * @param {string} type - Тип улюбленця (наприклад, 'cat', 'dog', 'monkey')
     * @param {number} age - Вік улюбленця
     * @param {number} health - Рівень здоров'я (0-100)
     * @param {number} hunger - Рівень голоду (0-100, де 100 - дуже голодний)
     * @param {number} happiness - Рівень щастя (0-100)
     * @param {number} energy - Рівень енергії (0-100)
     * @param {number} cleanliness - Рівень забруднення (0-100, де 100 - дуже брудний)
     * @param {number} coins - Кількість монет у власника (за замовчуванням 0)
     * @param {number} id - Унікальний ідентифікатор улюбленця в базі даних (за замовчуванням null)
     * @param {string} ownerId - Ідентифікатор власника користувача (за замовчуванням null)
     */
    constructor(name, type, age, health, hunger, happiness, energy, cleanliness, coins = 0, id = null, ownerId = null) {
        /**
         * Унікальний ID улюбленця в базі даних.
         * @type {number|null}
         */
        this.id = id;

        /**
         * Ім'я улюбленця.
         * @type {string}
         */
        this.name = name;

        /**
         * Тип тварини (cat, dog, monkey тощо).
         * @type {string}
         */
        this.type = type;

        /**
         * Вік тварини.
         * @type {number}
         */
        this.age = age;

        /**
         * Поточне здоров'я (0-100).
         * @type {number}
         */
        this.health = health;

        /**
         * Поточний рівень голоду (0-100).
         * @type {number}
         */
        this.hunger = hunger;

        /**
         * Поточне щастя (0-100).
         * @type {number}
         */
        this.happiness = happiness;

        /**
         * Поточна енергія (0-100).
         * @type {number}
         */
        this.energy = energy;

        /**
         * Рівень забруднення (0-100).
         * @type {number}
         */
        this.cleanliness = cleanliness;

        /**
         * ID власника улюбленця.
         * @type {string|null}
         */
        this.ownerId = ownerId;

        /**
         * Баланс монет власника.
         * @type {number}
         */
        this.coins = coins;
    }

    /**
     * Створює екземпляр Pet з JSON-об'єкта.
     *
     * Використовується для відновлення об'єкта після отримання даних
     * з бази даних або API.
     *
     * @static
     * @param {object} json - Об'єкт з даними улюбленця
     * @returns {Pet} Новий екземпляр класу Pet
     *
     * @example
     * const petData = { name: "Fluffy", type: "cat", age: 2, ... };
     * const pet = Pet.fromJSON(petData);
     */
    static fromJSON(json) {
        return new Pet(
            json.name,
            json.type,
            json.age,
            json.health,
            json.hunger,
            json.happiness,
            json.energy,
            json.cleanliness,
            json.coins,
            json.id,
            json.ownerId
        );
    }

    /**
     * Перетворює екземпляр Pet у простий об'єкт (JSON).
     *
     * Використовується перед збереженням у базу даних або відправкою на клієнт.
     *
     * @returns {object} Об'єкт з властивостями улюбленця
     *
     * @example
     * const pet = new Pet("Fluffy", "cat", 2, ...);
     * const jsonData = pet.toJSON();
     * // jsonData = { id: 1, name: "Fluffy", type: "cat", ... }
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            age: this.age,
            health: this.health,
            hunger: this.hunger,
            happiness: this.happiness,
            energy: this.energy,
            cleanliness: this.cleanliness,
            ownerId: this.ownerId,
            coins: this.coins
        };
    }

    /**
     * Симуляція життєвого циклу (викликається за таймером).
     *
     * Метод відповідає за природні зміни станів з часом:
     * - Збільшується голод і рівень бруду
     * - Зменшується щастя
     * - Якщо показники критичні (сильний голод, бруд, нещастя), зменшується здоров'я
     *
     * @note Здоров'я не може впасти нижче 1 (безсмертя).
     * @returns {void}
     */
    live() {
        // Стандартне погіршення
        this.hunger += 1;
        if (this.hunger > 100) this.hunger = 100;

        this.happiness -= 1;
        if (this.happiness < 0) this.happiness = 0;

        // Логіка бруду
        this.cleanliness += 1;
        if (this.cleanliness > 100) this.cleanliness = 100;

        // Шкода здоров'ю
        let healthDamage = 0;
        if (this.hunger >= 80) healthDamage = 1;
        if (this.hunger >= 95) healthDamage = 3;
        if (this.hunger === 100) healthDamage = 5;

        if (healthDamage === 0 && this.happiness === 0) {
            healthDamage = 1;
        }
        if (this.cleanliness === 100) {
            healthDamage += 1;
        }

        if (healthDamage > 0) {
            this.health -= healthDamage;
        }
        // Запобігаємо смерті (мінімум 1 HP)
        if (this.health < 1) this.health = 1;
    }

    /**
     * Годування улюбленця.
     *
     * - Зменшує голод на 15 пунктів
     * - Підвищує здоров'я на 5 пунктів
     * - Нараховує 15 монет, якщо улюбленець був голодний і став повністю ситим
     *
     * @returns {void}
     */
    feed() {
        // Запам'ятовуємо, чи був він голодний
        const wasHungry = this.hunger > 0;
        this.hunger -= 15;
        if (this.hunger < 0) this.hunger = 0;
        this.health += 5;
        if (this.health > 100) this.health = 100;
        // Даємо монети ТІЛЬКИ якщо він був голодний і ми його ПОВНІСТЮ нагодували
        if (wasHungry && this.hunger === 0) {
            this.coins += 15; // Нагорода
        }
    }

    /**
     * Гра з улюбленцем.
     *
     * - Підвищує щастя на 20 пунктів
     * - Витрачає 10 пунктів енергії
     * - Збільшує голод на 10 пунктів
     *
     * @returns {void}
     */
    play() {
        this.happiness += 20;
        if (this.happiness > 100) this.happiness = 100;
        this.energy -= 10;
        if (this.energy < 0) this.energy = 0;
        this.hunger += 10;
        if (this.hunger > 100) this.hunger = 100;
    }

    /**
     * Сон улюбленця.
     *
     * - Відновлює 30 пунктів енергії
     * - Збільшує голод на 15 пунктів (час йде)
     *
     * @returns {void}
     */
    sleep() {
        this.energy += 30;
        if (this.energy > 100) this.energy = 100;
        this.hunger += 15;
        if (this.hunger > 100) this.hunger = 100;
    }

    /**
     * Лікування улюбленця.
     *
     * - Відновлює 25 пунктів здоров'я
     * - Зменшує щастя на 10 пунктів (ліки несмачні)
     *
     * @returns {void}
     */
    heal() {
        this.health += 25;
        if (this.health > 100) this.health = 100;
        this.happiness -= 10;
        if (this.happiness < 0) this.happiness = 0;
    }

    /**
     * Миття улюбленця.
     *
     * - Повністю прибирає бруд (cleanliness стає 0)
     * - Підвищує щастя на 10 пунктів
     * - Нараховує 20 монет, якщо улюбленець справді був брудним
     *
     * @returns {void}
     */
    clean() {
        // Запам'ятовуємо, чи був він брудний
        const wasDirty = this.cleanliness > 0;
        this.cleanliness = 0;
        this.happiness += 10;
        if (this.happiness > 100) this.happiness = 100;
        // Нагорода тільки якщо справді помили
        if (wasDirty) {
            this.coins += 20; // Нагорода
        }
    }
}
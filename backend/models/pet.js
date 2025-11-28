/**
 * @file pet.js
 * @brief Модель, що описує сутність улюбленця (Pet).
 * * Цей файл містить клас Pet, який реалізує основну ігрову логіку:
 * стани улюбленця (здоров'я, голод, щастя тощо) та методи взаємодії з ним.
 */

/**
 * @class Pet
 * @brief Клас для представлення віртуального улюбленця.
 * * Зберігає поточні показники стану тварини та надає методи для їх зміни
 * (годування, гра, сон, лікування тощо). Також містить метод live(),
 * який викликається ігровим циклом для симуляції плину часу.
 */
export default class Pet {
    /**
     * @brief Конструктор класу Pet.
     * * @param {string} name - Ім'я улюбленця.
     * @param {string} type - Тип улюбленця (наприклад, 'cat', 'dog', 'monkey').
     * @param {number} age - Вік улюбленця.
     * @param {number} health - Рівень здоров'я (0-100).
     * @param {number} hunger - Рівень голоду (0-100, де 100 - дуже голодний).
     * @param {number} happiness - Рівень щастя (0-100).
     * @param {number} energy - Рівень енергії (0-100).
     * @param {number} cleanliness - Рівень забруднення (0-100, де 100 - дуже брудний).
     * @param {number} [coins=0] - Кількість монет у власника (за замовчуванням 0).
     * @param {number|null} [id=null] - Унікальний ідентифікатор улюбленця в базі даних.
     * @param {string|null} [ownerId=null] - Ідентифікатор власника (користувача).
     */
    constructor(name, type, age, health, hunger, happiness, energy, cleanliness, coins = 0, id = null, ownerId = null) {
        /** @property {number|null} id - Унікальний ID улюбленця. */
        this.id = id;
        /** @property {string} name - Ім'я улюбленця. */
        this.name = name;
        /** @property {string} type - Тип тварини. */
        this.type = type;
        /** @property {number} age - Вік тварини. */
        this.age = age;
        /** @property {number} health - Поточне здоров'я. */
        this.health = health;
        /** @property {number} hunger - Поточний голод. */
        this.hunger = hunger;
        /** @property {number} happiness - Поточне щастя. */
        this.happiness = happiness;
        /** @property {number} energy - Поточна енергія. */
        this.energy = energy;
        /** @property {number} cleanliness - Рівень забруднення. */
        this.cleanliness = cleanliness;
        /** @property {string|null} ownerId - ID власника. */
        this.ownerId = ownerId;
        /** @property {number} coins - Баланс монет. */
        this.coins = coins;
    }

    /**
     * @brief Створює екземпляр Pet з JSON-об'єкта.
     * * Використовується для відновлення об'єкта після отримання даних з бази даних або API.
     * * @param {Object} json - Об'єкт з даними улюбленця.
     * @returns {Pet} Новий екземпляр класу Pet.
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
     * @brief Перетворює екземпляр Pet у простий об'єкт (JSON).
     * * Використовується перед збереженням у базу даних або відправкою на клієнт.
     * * @returns {Object} Об'єкт з властивостями улюбленця.
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
     * @brief Симуляція життєвого циклу (викликається за таймером).
     * * Метод відповідає за природні зміни станів з часом:
     * - Збільшується голод і рівень бруду.
     * - Зменшується щастя.
     * - Якщо показники критичні (сильний голод, бруд, нещастя), зменшується здоров'я.
     * * @note Здоров'я не може впасти нижче 1 (безсмертя).
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
     * @brief Годування улюбленця.
     * * - Зменшує голод (-15).
     * - Трохи підвищує здоров'я (+5).
     * - Нараховує монети (+15), якщо улюбленець був голодний і став повністю ситим.
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
     * @brief Гра з улюбленцем.
     * * - Значно підвищує щастя (+20).
     * - Витрачає енергію (-10).
     * - Збільшує голод (+10).
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
     * @brief Сон улюбленця.
     * * - Відновлює енергію (+30).
     * - Збільшує голод (+15), бо час йде.
     */
    sleep() {
        this.energy += 30;
        if (this.energy > 100) this.energy = 100;
        this.hunger += 15;
        if (this.hunger > 100) this.hunger = 100;
    }

    /**
     * @brief Лікування улюбленця.
     * * - Відновлює здоров'я (+25).
     * - Трохи зменшує щастя (-10), бо ліки несмачні.
     */
    heal() {
        this.health += 25;
        if (this.health > 100) this.health = 100;
        this.happiness -= 10;
        if (this.happiness < 0) this.happiness = 0;
    }

    /**
     * @brief Миття улюбленця.
     * * - Повністю прибирає бруд (cleanliness стає 0).
     * - Підвищує щастя (+10).
     * - Нараховує монети (+20), якщо улюбленець справді був брудним.
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
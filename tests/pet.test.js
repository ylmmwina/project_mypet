/**
 * @file pet.test.js
 * @brief Юніт-тести для перевірки логіки класу Pet.
 * * Перевіряє, чи коректно функціонують методи життєвого циклу (live) та взаємодії
 * (feed, play, clean) відповідно до бізнес-логіки Tamagotchi.
 */

import Pet from "../backend/models/pet.js";

// Допоміжна функція для створення пета з дефолтами
/**
 * @brief Допоміжна функція для створення тестового об'єкта Pet.
 * * Спрощує налаштування початкових параметрів для кожного тесту.
 * * @param {Object} [overrides={}] - Об'єкт з параметрами, що перезаписують значення за замовчуванням.
 * @returns {Pet} Новий екземпляр класу Pet.
 */
function createPet(overrides = {}) {
    return new Pet(
        overrides.name ?? "TestPet",
        overrides.type ?? "dog",
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
 * @namespace PetModelTestSuite
 * @brief Набір тестів для перевірки коректності бізнес-логіки класу Pet.
 */
describe("Pet model", () => {
    /**
     * @test toJSON() і fromJSON()
     * @brief Перевіряє, чи коректно об'єкт серіалізується та десеріалізується.
     */
    test("toJSON() і fromJSON() працюють симетрично", () => {
        const pet = createPet({
            name: "Mimi",
            type: "cat",
            age: 3,
            health: 80,
            hunger: 10,
            happiness: 90,
            energy: 40,
            cleanliness: 20,
            coins: 100,
            id: 5,
            ownerId: "abc-123"
        });

        const json = pet.toJSON();
        const restored = Pet.fromJSON(json);

        expect(restored).toBeInstanceOf(Pet);
        expect(restored.toJSON()).toEqual(json);
    });

    /**
     * @test feed() - монети за повну ситість
     * @brief Перевіряє, чи дає `feed()` монети, якщо улюбленець був голодний і став повністю ситий (hunger = 0).
     */
    test("feed() зменшує hunger, піднімає health і дає монети, якщо був голодний і став повністю ситий", () => {
        const pet = createPet({
            health: 90,
            hunger: 10, // Мале значення, щоб досягти 0
            coins: 0
        });

        pet.feed();

        expect(pet.hunger).toBe(0);       // 10-15, але не нижче 0
        expect(pet.health).toBe(95);      // 90+5
        expect(pet.coins).toBe(15);       // нагорода
    });

    /**
     * @test feed() - не дає монети, якщо залишився голодний
     * @brief Перевіряє відсутність нагороди, якщо після годування голод не обнулився.
     */
    test("feed() не дає монети, якщо залишився голодний", () => {
        const pet = createPet({
            health: 90,
            hunger: 100, // 100-15=85 - ще голодний
            coins: 0
        });

        pet.feed();

        expect(pet.hunger).toBe(85);
        expect(pet.health).toBe(95);
        expect(pet.coins).toBe(0);
    });

    /**
     * @test feed() - не дає монети, якщо не був голодний
     * @brief Перевіряє відсутність нагороди, якщо улюбленець вже був ситий (hunger = 0).
     */
    test("feed() не дає монети, якщо не був голодний", () => {
        const pet = createPet({
            health: 90,
            hunger: 0,
            coins: 0
        });

        pet.feed();

        expect(pet.hunger).toBe(0);
        expect(pet.health).toBe(95);
        expect(pet.coins).toBe(0);
    });

    /**
     * @test play()
     * @brief Перевіряє вплив гри на щастя, енергію та голод.
     */
    test("play() піднімає happiness, але зменшує energy і збільшує hunger", () => {
        const pet = createPet({
            happiness: 90,
            energy: 15,
            hunger: 95
        });

        pet.play();

        expect(pet.happiness).toBe(100);  // 90+20, але максимум 100
        expect(pet.energy).toBe(5);       // 15-10
        expect(pet.hunger).toBe(100);     // 95+10, але максимум 100
    });

    /**
     * @test sleep()
     * @brief Перевіряє вплив сну на енергію та голод.
     */
    test("sleep() піднімає energy і hunger з обмеженням 0–100", () => {
        const pet = createPet({
            energy: 80,
            hunger: 90
        });

        pet.sleep();

        expect(pet.energy).toBe(100);     // 80+30, але максимум 100
        expect(pet.hunger).toBe(100);     // 90+15, але максимум 100
    });

    /**
     * @test heal()
     * @brief Перевіряє вплив лікування на здоров'я та щастя.
     */
    test("heal() піднімає health і знижує happiness в межах 0–100", () => {
        const pet = createPet({
            health: 90,
            happiness: 5
        });

        pet.heal();

        expect(pet.health).toBe(100);     // 90+25, але максимум 100
        expect(pet.happiness).toBe(0);    // 5-10, але не нижче 0
    });

    /**
     * @test clean() - монети за бруд
     * @brief Перевіряє, чи обнуляється бруд і чи дається нагорода, якщо улюбленець був брудний.
     */
    test("clean() обнуляє cleanliness, піднімає happiness і дає монети, якщо був брудний", () => {
        const pet = createPet({
            cleanliness: 50,
            happiness: 80,
            coins: 0
        });

        pet.clean();

        expect(pet.cleanliness).toBe(0);
        expect(pet.happiness).toBe(90);   // 80+10
        expect(pet.coins).toBe(20);       // нагорода за прибирання
    });

    /**
     * @test clean() - без монет
     * @brief Перевіряє відсутність нагороди, якщо улюбленець вже був чистий (cleanliness = 0).
     */
    test("clean() не дає монет, якщо cleanliness вже був 0", () => {
        const pet = createPet({
            cleanliness: 0,
            happiness: 80,
            coins: 5
        });

        pet.clean();

        expect(pet.cleanliness).toBe(0);
        expect(pet.happiness).toBe(90);
        expect(pet.coins).toBe(5);        // без нагороди
    });

    /**
     * @test live() - базове погіршення
     * @brief Перевіряє, чи коректно змінюються показники при "тіку" без шкоди здоров'ю.
     */
    test("live(): базові зміни показників (hunger↑, happiness↓, cleanliness↑)", () => {
        const pet = createPet({
            hunger: 10,
            happiness: 50,
            cleanliness: 20,
            health: 80
        });

        pet.live();

        expect(pet.hunger).toBe(11);
        expect(pet.happiness).toBe(49);
        expect(pet.cleanliness).toBe(21);
        // при таких значеннях здоров'я не повинно змінитись
        expect(pet.health).toBe(80);
    });

    /**
     * @test live() - шкода від голоду
     * @brief Перевіряє, чи правильно розраховується шкода здоров'ю при критичному голоді (hunger=100).
     */
    test("live(): сильний голод 100 забирає 5 здоров'я", () => {
        const pet = createPet({
            hunger: 100,
            happiness: 50,
            cleanliness: 0,
            health: 40
        });

        pet.live();

        // hunger 100 -> healthDamage = 5
        expect(pet.health).toBe(35);
    });

    /**
     * @test live() - шкода від нещастя і бруду
     * @brief Перевіряє сумарну шкоду здоров'ю від мінімального щастя (0) та максимального бруду (100).
     */
    test("live(): без голоду, але 0 happiness і cleanliness=100 теж шкодять здоров'ю", () => {
        const pet = createPet({
            hunger: 10,
            happiness: 0,
            cleanliness: 100,
            health: 50
        });

        pet.live();

        // healthDamage = 1 (через happiness=0) + 1 (через cleanliness=100) = 2
        expect(pet.health).toBe(48);
    });
});
export default class Pet {
    constructor(name, type, age, health, hunger, happiness, energy, cleanliness, coins = 0, id = null, ownerId = null) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.age = age;
        this.health = health;
        this.hunger = hunger;
        this.happiness = happiness;
        this.energy = energy;
        this.cleanliness = cleanliness;
        this.ownerId = ownerId;
        this.coins = coins;
    }

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
        if (this.health < 0) this.health = 0;
    }

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

    play() {
        this.happiness += 20;
        if (this.happiness > 100) this.happiness = 100;
        this.energy -= 10;
        if (this.energy < 0) this.energy = 0;
        this.hunger += 10;
        if (this.hunger > 100) this.hunger = 100;
    }

    sleep() {
        this.energy += 30;
        if (this.energy > 100) this.energy = 100;
        this.hunger += 15;
        if (this.hunger > 100) this.hunger = 100;
    }

    heal() {
        this.health += 25;
        if (this.health > 100) this.health = 100;
        this.happiness -= 10;
        if (this.happiness < 0) this.happiness = 0;
    }

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
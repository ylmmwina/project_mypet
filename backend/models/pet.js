export default class Pet {
    constructor(name, type, age, health, hunger, happiness, energy) {
        this.name = name;
        this.type = type;
        this.age = age;
        this.health = health;
        this.hunger = hunger;
        this.happiness = happiness;
        this.energy = energy;
    }

    static fromJSON(json) {
        return new Pet(
            json.name,
            json.type,
            json.age,
            json.health,
            json.hunger,
            json.happiness,
            json.energy
        );
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            age: this.age,
            health: this.health,
            hunger: this.hunger,
            happiness: this.happiness,
            energy: this.energy
        };
    }

    feed() {
        //зменшує голод та покращує здоров'я
        this.hunger -= 15;
        if (this.hunger < 0) this.hunger = 0;

        this.health += 5;
        if (this.health > 100) this.health = 100;
    }

    play() {
        //збільшує щастя, але тваринка втомлюється і стає голодною
        this.happiness += 20;
        if (this.happiness > 100) this.happiness = 100;

        this.energy -= 10;
        if (this.energy < 0) this.energy = 0;

        this.hunger += 10;
        if (this.hunger > 100) this.hunger = 100;
    }

    sleep() {
        //відновлює енергію, але збільшує голод
        this.energy += 30;
        if (this.energy > 100) this.energy = 100;

        this.hunger += 15;
        if (this.hunger > 100) this.hunger = 100;
    }

    heal() {
        //відновлює здоров'я, але коштує енергії або щастя
        this.health += 25;
        if (this.health > 100) this.health = 100;

        this.happiness -= 10;
        if (this.happiness < 0) this.happiness = 0;
    }

    clean() {
        //покращує щастя та здоров'я
        this.happiness += 5;
        if (this.happiness > 100) this.happiness = 100;

        this.health += 5;
        if (this.health > 100) this.health = 100;
    }

    live() {
        // --- 1. Стандартне погіршення (завжди відбувається) ---
        this.hunger += 1;
        if (this.hunger > 100) this.hunger = 100;

        this.happiness -= 1;
        if (this.happiness < 0) this.happiness = 0;

        // --- 2. Нова логіка: шкода здоров'ю від голоду ---
        let healthDamage = 0;

        if (this.hunger >= 80) {
            healthDamage = 1; // Улюбленець дуже голодний, -1 здоров'я
        }
        if (this.hunger >= 95) {
            healthDamage = 3; // Улюбленець на межі, -3 здоров'я
        }
        if (this.hunger === 100) {
            healthDamage = 5; // Критичний голод, -5 здоров'я!
        }

        // Застосовуємо шкоду від голоду
        if (healthDamage > 0) {
            this.health -= healthDamage;
        }
        // Якщо не голодний, але дуже сумний, теж втрачає здоров'я
        else if (this.happiness === 0) {
            this.health -= 1;
        }

        // Переконуємось, що здоров'я не падає нижче 0
        if (this.health < 0) this.health = 0;
    }
}
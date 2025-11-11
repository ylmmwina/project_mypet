export default class Pet {
    constructor(name, type, age, health, hunger, happiness, energy,cleanliness) {
        this.name = name;
        this.type = type;
        this.age = age;
        this.health = health;
        this.hunger = hunger;
        this.happiness = happiness;
        this.energy = energy;
        this.cleanliness = cleanliness;
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
            json.cleanliness
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
            energy: this.energy,
            cleanliness: this.cleanliness
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
        // Прибирання повністю скидає бруд
        this.cleanliness = 0;

        // і трохи піднімає настрій
        this.happiness += 10;
        if (this.happiness > 100) this.happiness = 100;
    }

    live() {
        //Стандартне погіршення (Голод і Щастя)
        this.hunger += 1;
        if (this.hunger > 100) this.hunger = 100;

        this.happiness -= 1;
        if (this.happiness < 0) this.happiness = 0;

        //Логіка бруду
        this.cleanliness += 1; // Улюбленець потроху брудниться
        if (this.cleanliness > 100) this.cleanliness = 100;

        // Шкода здоров'ю (від голоду, суму АБО бруду)
        let healthDamage = 0;

        // Прогресивна шкода від голоду (з твоєї ідеї)
        if (this.hunger >= 80) healthDamage = 1;
        if (this.hunger >= 95) healthDamage = 3;
        if (this.hunger === 100) healthDamage = 5;

        // Шкода від суму (якщо не голодний)
        if (healthDamage === 0 && this.happiness === 0) {
            healthDamage = 1;
        }

        // Шкода від бруду (додається до іншої шкоди!)
        if (this.cleanliness === 100) {
            healthDamage += 1; // Бруд додатково шкодить здоров'ю
        }

        // Застосовуємо загальну шкоду
        if (healthDamage > 0) {
            this.health -= healthDamage;
        }

        //переконуємось, що здоров'я не падає нижче 0
        if (this.health < 0) this.health = 0;
    }
}
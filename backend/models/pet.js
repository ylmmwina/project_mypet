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
}
import Pet from "../backend/models/pet.js";

describe("Pet Model", () => {
    test("should create a pet with correct properties via constructor", () => {
        const pet = new Pet("Barsik", "cat", 1, 100, 0, 100, 100);

        expect(pet.name).toBe("Barsik");
        expect(pet.type).toBe("cat");
        expect(pet.health).toBe(100);
        expect(pet.hunger).toBe(0);
    });

    test("should serialize to JSON correctly", () => {
        const pet = new Pet("Rex", "dog", 2, 90, 10, 80, 50);
        const json = pet.toJSON();

        expect(json).toEqual({
            name: "Rex",
            type: "dog",
            age: 2,
            health: 90,
            hunger: 10,
            happiness: 80,
            energy: 50
        });
    });

    test("should create a Pet instance from JSON", () => {
        const rawData = {
            name: "Bunny",
            type: "rabbit",
            age: 1,
            health: 100,
            hunger: 20,
            happiness: 100,
            energy: 90
        };

        const pet = Pet.fromJSON(rawData);

        expect(pet).toBeInstanceOf(Pet);
        // Перевіряємо дані
        expect(pet.name).toBe("Bunny");
        expect(pet.type).toBe("rabbit");
    });
});
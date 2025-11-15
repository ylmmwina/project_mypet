import Pet from "../models/pet.js";

export default function registerPetRoutes(app, db, io) {

    // --- Універсальна функція для оновлення улюбленця ---
    /**
     * Знаходить улюбленця за ownerId, застосовує до нього дію (pet => pet.feed()),
     * і оновлює його в базі даних.
     */
    async function updatePet(ownerId, actionCallback) {
        // Знайти поточні дані улюбленця
        const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);

        if (!petData) {
            throw new Error("Pet not found for this owner.");
        }

        // Створити об'єкт Pet з даними з БД
        // Ми використовуємо fromJSON, щоб перетворити дані з БД на наш клас Pet
        const pet = Pet.fromJSON(petData);

        actionCallback(pet);

        // оновити дані в базі даних
        // Ми беремо оновлені значення з об'єкта 'pet'
        await db.run(
            `UPDATE Pets SET 
                health = ?, hunger = ?, happiness = ?, 
                energy = ?, cleanliness = ?, age = ?
             WHERE ownerId = ?`,
            pet.health, pet.hunger, pet.happiness,
            pet.energy, pet.cleanliness, pet.age,
            ownerId
        );

        //повернути оновлений об'єкт
        return pet.toJSON();
    }


    // --- Маршрути ---

    app.get("/pet", async (req, res) => {
        const ownerId = req.ownerId;
        const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);

        if (petData) {
            res.send(petData);
        } else {
            res.send({});
        }
    });

    app.post("/create-pet", async (req, res) => {
        const { name, type } = req.body;
        const ownerId = req.ownerId;

        const validTypes = ["dog", "cat", "monkey"];
        if (!validTypes.includes(type)) {
            return res.status(400).send({ error: "Invalid pet type. Must be 'dog', 'cat', or 'monkey'." });
        }

        try {
            await db.run(
                "INSERT OR IGNORE INTO Pets (ownerId, name, type) VALUES (?, ?, ?)",
                ownerId, name, type
            );

            const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
            res.send(petData);
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Could not create pet" });
        }
    });

    //універсальний обробник для всіх дій
    const handlePetAction = (actionCallback) => async (req, res) => {
        const ownerId = req.ownerId;
        try {
            //використовуємо нашу нову функцію
            const updatedPet = await updatePet(ownerId, actionCallback);
            //відправляємо оновленого улюбленця
            res.send(updatedPet);
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    };

    app.post("/pet/feed", handlePetAction((pet) => pet.feed()));
    app.post("/pet/play", handlePetAction((pet) => pet.play()));
    app.post("/pet/sleep", handlePetAction((pet) => pet.sleep()));
    app.post("/pet/heal", handlePetAction((pet) => pet.heal()));
    app.post("/pet/clean", handlePetAction((pet) => pet.clean()));
}
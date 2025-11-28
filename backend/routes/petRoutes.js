import Pet from "../models/pet.js";

export default function registerPetRoutes(app, db, io) {

    async function updatePet(ownerId, petId, actionCallback) {
        const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ? AND id = ?", ownerId, petId);
        if (!petData) throw new Error("Pet not found for this owner.");

        const pet = Pet.fromJSON(petData);
        actionCallback(pet); // Виконуємо дію

        // Оновлюємо ВСІ поля, включаючи coins
        await db.run(
            `UPDATE Pets SET 
                health = ?, hunger = ?, happiness = ?, 
                energy = ?, cleanliness = ?, age = ?, coins = ?
             WHERE ownerId = ? AND id = ?`,
            pet.health, pet.hunger, pet.happiness,
            pet.energy, pet.cleanliness, pet.age, pet.coins,
            ownerId, petId
        );

        return pet.toJSON();
    }

    app.get("/pet", async (req, res) => {
        const ownerId = req.ownerId;
        const petId = req.query.id;
        const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ? AND id = ?", ownerId, petId);
        if (petData) res.send(petData); else res.send({});
    });

    app.get("/pets", async (req, res) => {
        const ownerId = req.ownerId;
        const pets = await db.all("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
        console.log(pets)
        res.send(pets || []); 
    });

    app.post("/create-pet", async (req, res) => {
        const { name, type } = req.body;
        const ownerId = req.ownerId;
        const validTypes = ["dog", "cat", "monkey"];
        if (!validTypes.includes(type)) return res.status(400).send({ error: "Invalid type." });

        try {
            await db.run("INSERT INTO Pets (ownerId, name, type, createdAt) VALUES (?, ?, ?, ?)", ownerId, name, type, Date.now());
            const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ? ORDER BY createdAt DESC", ownerId);
            res.send(petData);
        } catch (error) {
            console.log(error)
            res.status(500).send({ error: "Creation failed" });
        }
    });

    // МАРШРУТ: КІНЕЦЬ ГРИ 
    app.post("/pet/finish-game", async (req, res) => {
        const ownerId = req.ownerId;
        // Очікуємо, що фронтенд надішле, скільки монет зібрав гравець
        const { score, coinsEarned, petId } = req.body;

        if (score === undefined || coinsEarned === undefined) {
            return res.status(400).send({ error: "Score and coinsEarned are required" });
        }

        try {
            const updatedPet = await updatePet(ownerId, petId, (pet) => {
                // 1. Додаємо зароблені в грі монети
                pet.coins += Math.floor(coinsEarned);

                // 2. Вплив на стани
                // Очки впливають на щастя
                pet.happiness += Math.floor(score / 2);
                if (pet.happiness > 100) pet.happiness = 100;

                // Гра втомлює
                pet.energy -= 20;
                if (pet.energy < 0) pet.energy = 0;

                // Гра викликає апетит
                pet.hunger += 15;
                if (pet.hunger > 100) pet.hunger = 100;

                // Здоров'я НЕ чіпаємо
            });

            res.send(updatedPet);
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    // --- Звичайні дії ---
    const handlePetAction = (actionCallback) => async (req, res) => {
        const ownerId = req.ownerId;
        const petId = req.body.petId;
        if (!petId) return res.status(400).send({ error: "Pet ID is required" });
        try {
            const updatedPet = await updatePet(ownerId, petId, actionCallback);
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
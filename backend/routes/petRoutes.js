import Pet from "../models/pet.js";

export default function registerPetRoutes(app, db, io) {

    async function updatePet(ownerId, actionCallback) {
        const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
        if (!petData) throw new Error("Pet not found for this owner.");

        const pet = Pet.fromJSON(petData);
        actionCallback(pet); // Виконуємо дію

        // Оновлюємо ВСІ поля, включаючи coins
        await db.run(
            `UPDATE Pets SET 
                health = ?, hunger = ?, happiness = ?, 
                energy = ?, cleanliness = ?, age = ?, coins = ?
             WHERE ownerId = ?`,
            pet.health, pet.hunger, pet.happiness,
            pet.energy, pet.cleanliness, pet.age, pet.coins,
            ownerId
        );

        return pet.toJSON();
    }

    // ... (app.get і app.post/create-pet ті самі) ...
    app.get("/pet", async (req, res) => {
        const ownerId = req.ownerId;
        const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
        if (petData) res.send(petData); else res.send({});
    });

    app.post("/create-pet", async (req, res) => {
        const { name, type } = req.body;
        const ownerId = req.ownerId;
        const validTypes = ["dog", "cat", "monkey"];
        if (!validTypes.includes(type)) return res.status(400).send({ error: "Invalid type." });

        try {
            await db.run("INSERT OR IGNORE INTO Pets (ownerId, name, type) VALUES (?, ?, ?)", ownerId, name, type);
            const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
            res.send(petData);
        } catch (error) {
            res.status(500).send({ error: "Creation failed" });
        }
    });

    // --- 🎮 МАРШРУТ: КІНЕЦЬ ГРИ ---
    app.post("/pet/finish-game", async (req, res) => {
        const ownerId = req.ownerId;
        // Очікуємо, що фронтенд надішле, скільки монет зібрав гравець
        const { score, coinsEarned } = req.body;

        if (score === undefined || coinsEarned === undefined) {
            return res.status(400).send({ error: "Score and coinsEarned are required" });
        }

        try {
            const updatedPet = await updatePet(ownerId, (pet) => {
                // 1. Додаємо зароблені в грі монети
                pet.coins += Math.floor(coinsEarned);

                // 2. Вплив на стани (як ти просив)
                // Очки впливають на щастя
                pet.happiness += Math.floor(score / 2);
                if (pet.happiness > 100) pet.happiness = 100;

                // Гра втомлює
                pet.energy -= 20;
                if (pet.energy < 0) pet.energy = 0;

                // Гра викликає апетит
                pet.hunger += 15;
                if (pet.hunger > 100) pet.hunger = 100;

                // Здоров'я НЕ чіпаємо (нереалістично, щоб спорт вбивав)
            });

            res.send(updatedPet);
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    // --- Звичайні дії ---
    const handlePetAction = (actionCallback) => async (req, res) => {
        const ownerId = req.ownerId;
        try {
            const updatedPet = await updatePet(ownerId, actionCallback);
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
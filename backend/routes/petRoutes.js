import Pet from "../models/pet.js";
import { getAllPetsByOwnerId, getPetById, deletePet } from "../utils/database.js";

export default function registerPetRoutes(app, db, io) {

    async function updatePetAction(ownerId, petId, actionCallback) {
        if (!petId) throw new Error("petId is required");

        const petData = await getPetById(db, petId, ownerId);
        if (!petData) throw new Error("Pet not found or does not belong to you.");

        const pet = Pet.fromJSON(petData);
        actionCallback(pet);

        await db.run(
            `UPDATE Pets SET
                             health = ?, hunger = ?, happiness = ?,
                             energy = ?, cleanliness = ?, age = ?, coins = ?
             WHERE id = ?`,
            pet.health, pet.hunger, pet.happiness,
            pet.energy, pet.cleanliness, pet.age, pet.coins,
            pet.id
        );

        return pet.toJSON();
    }

    app.get("/pets", async (req, res) => {
        const ownerId = req.ownerId;
        try {
            const pets = await getAllPetsByOwnerId(db, ownerId);
            res.json(pets || []);
        } catch (e) {
            console.error(e);
            res.json([]);
        }
    });

    app.get("/pet", async (req, res) => {
        const ownerId = req.ownerId;
        try {
            const pets = await getAllPetsByOwnerId(db, ownerId);
            res.json(pets || []);
        } catch (e) {
            console.error(e);
            res.json([]);
        }
    });

    app.post("/create-pet", async (req, res) => {
        const { name, type } = req.body;
        const ownerId = req.ownerId;
        const validTypes = ["dog", "cat", "monkey"];

        if (!validTypes.includes(type)) return res.status(400).send({ error: "Invalid type." });

        try {
            const result = await db.run(
                "INSERT INTO Pets (ownerId, name, type, createdAt) VALUES (?, ?, ?, ?)",
                ownerId, name, type, Date.now()
            );
            const newPet = await getPetById(db, result.lastID, ownerId);
            res.json(newPet);
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Creation failed" });
        }
    });

    app.post("/pet/finish-game", async (req, res) => {
        const ownerId = req.ownerId;
        const { score, coinsEarned, petId } = req.body;

        if (score === undefined || coinsEarned === undefined || !petId) {
            return res.status(400).send({ error: "Data missing" });
        }

        try {
            const updatedPet = await updatePetAction(ownerId, petId, (pet) => {
                pet.coins += Math.floor(coinsEarned);
                pet.happiness += Math.floor(score / 2);
                if (pet.happiness > 100) pet.happiness = 100;
                pet.energy -= 20;
                if (pet.energy < 0) pet.energy = 0;
                pet.hunger += 15;
                if (pet.hunger > 100) pet.hunger = 100;
            });
            res.send(updatedPet);
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    const handlePetAction = (actionCallback) => async (req, res) => {
        const ownerId = req.ownerId;
        const { petId } = req.body;

        try {
            const updatedPet = await updatePetAction(ownerId, petId, actionCallback);
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

    app.post("/pet/delete", async (req, res) => {
        const ownerId = req.ownerId;
        const { petId } = req.body;

        if (!petId) return res.status(400).send({ error: "petId is required" });

        try {
            await deletePet(db, petId, ownerId);
            res.send({ message: "Deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: error.message });
        }
    });
}
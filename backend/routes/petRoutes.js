import Pet from "../models/pet.js";

export default function registerPetRoutes(app, db, io) {

// Допоміжна функція для обмеження значень 0–100
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Список товарів магазину
const shopItems = [
    {
        id: "basic_food",
        name: "Звичайний корм",
        type: "food",
        price: 10,
        effects: {
            hunger: -20,   // менше голодний
            health: +5
        }
    },
    {
        id: "premium_food",
        name: "Преміум корм",
        type: "food",
        price: 25,
        effects: {
            hunger: -40,
            health: +10,
            happiness: +5
        }
    },
    {
        id: "banana_snack",
        name: "Банановий снек",
        type: "food",
        price: 15,
        effects: {
            hunger: -25,
            happiness: +10
        }
    },
    {
        id: "soap_basic",
        name: "Мило для купання",
        type: "soap",
        price: 15,
        effects: {
            cleanliness: -50, // робимо чистішим (0 = чистий, 100 = дуже брудний)
            happiness: +5
        }
    },
    {
        id: "medkit_small",
        name: "Аптечка",
        type: "medkit",
        price: 30,
        effects: {
            health: +40,
            hunger: +5
        }
    }
];

// Знайти товар по id
const findShopItem = (itemId) => shopItems.find((item) => item.id === itemId);

// Застосувати ефекти товару до улюбленця
function applyItemEffects(pet, item) {
    const effects = item.effects || {};

    if (effects.health) {
        pet.health = clamp(pet.health + effects.health, 0, 100);
    }
    if (effects.hunger) {
        pet.hunger = clamp(pet.hunger + effects.hunger, 0, 100);
    }
    if (effects.happiness) {
        pet.happiness = clamp(pet.happiness + effects.happiness, 0, 100);
    }
    if (effects.energy) {
        pet.energy = clamp(pet.energy + effects.energy, 0, 100);
    }
    if (effects.cleanliness) {
        pet.cleanliness = clamp(pet.cleanliness + effects.cleanliness, 0, 100);
    }
}

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

        // МАГАЗИН: список товарів 
    app.get("/shop/items", (req, res) => {
        res.send(shopItems);
    });

    // МАГАЗИН: покупка товару
    app.post("/shop/buy", async (req, res) => {
        const ownerId = req.ownerId;
        const { itemId } = req.body;

        if (!itemId) {
            return res.status(400).send({ error: "itemId is required" });
        }

        const item = findShopItem(itemId);
        if (!item) {
            return res.status(404).send({ error: "Item not found" });
        }

        try {
            const updatedPet = await updatePet(ownerId, (pet) => {
                if (pet.health <= 0) {
                    throw new Error("Pet is dead. Shop is unavailable.");
                }

                if (pet.coins < item.price) {
                    throw new Error("Not enough coins");
                }

                // списуємо монети
                pet.coins -= item.price;

                // застосовуємо ефекти товару
                applyItemEffects(pet, item);
            });

            res.send(updatedPet);
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    // МАРШРУТ: КІНЕЦЬ ГРИ 
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
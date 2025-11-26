import { shopItems, findShopItem, applyItemEffects } from "../shop/shopItems.js";
import Pet from "../models/pet.js";

export default function registerShopRoutes(app, db) {

    // Список товарів
    app.get("/shop/items", (req, res) => {
        res.send(shopItems);
    });

    // Купівля товару
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
            const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
            if (!petData) throw new Error("Pet not found");

            const pet = Pet.fromJSON(petData);

            if (pet.health <= 0) throw new Error("Pet is dead");
            if (pet.coins < item.price) throw new Error("Not enough coins");

            // списуємо монети
            pet.coins -= item.price;

            // застосовуємо ефекти товару
            applyItemEffects(pet, item);

            // зберігаємо
            await db.run(
                `UPDATE Pets SET 
                    health = ?, hunger = ?, happiness = ?, 
                    energy = ?, cleanliness = ?, age = ?, coins = ?
                 WHERE ownerId = ?`,
                pet.health, pet.hunger, pet.happiness,
                pet.energy, pet.cleanliness, pet.age, pet.coins,
                ownerId
            );

            res.send(pet.toJSON());

        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });
}

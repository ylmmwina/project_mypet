import { shopItems, findShopItem, applyItemEffects } from "../shop/shopItems.js";
import Pet from "../models/pet.js";

export default function registerShopRoutes(app, db) {

    // Список товарів 
    app.get("/shop/items", (req, res) => {
        res.json(shopItems);
    });

    // Купівля товару 
    app.post("/shop/buy", async (req, res) => {
        const ownerId = req.ownerId;
        const { itemId } = req.body;

        if (!itemId) {
            return res.status(400).json({
                error: "ITEM_ID_REQUIRED",
                message: "You must provide itemId"
            });
        }

        const item = findShopItem(itemId);
        if (!item) {
            return res.status(404).json({
                error: "ITEM_NOT_FOUND",
                message: "This item does not exist"
            });
        }

        try {
            // отримуємо тваринку
            const petData = await db.get("SELECT * FROM Pets WHERE ownerId = ?", ownerId);
            if (!petData) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Create a pet first"
                });
            }

            const pet = Pet.fromJSON(petData);

            // перевірки
            if (pet.health <= 0) {
                return res.status(400).json({
                    error: "PET_DEAD",
                    message: "Your pet is dead. Shop is unavailable."
                });
            }

            if (pet.coins < item.price) {
                return res.status(400).json({
                    error: "NOT_ENOUGH_COINS",
                    message: "Not enough coins to buy this item"
                });
            }

            // списуємо монети
            pet.coins -= item.price;

            // застосовуємо ефекти товару
            applyItemEffects(pet, item);

            // зберігаємо оновлення тваринки
            await db.run(
                `UPDATE Pets SET 
                    health = ?, hunger = ?, happiness = ?, 
                    energy = ?, cleanliness = ?, age = ?, coins = ?
                 WHERE ownerId = ?`,
                pet.health, pet.hunger, pet.happiness,
                pet.energy, pet.cleanliness, pet.age, pet.coins,
                ownerId
            );

            // логування покупки
            await db.run(
                "INSERT INTO Purchases (petId, itemId, price, createdAt) VALUES (?, ?, ?, ?)",
                pet.id,
                item.id,
                item.price,
                new Date().toISOString()
            );

            res.json(pet.toJSON());

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "SHOP_UNKNOWN_ERROR",
                message: "Unexpected error while buying item"
            });
        }
    });

    // Історія покупок 
    app.get("/shop/history", async (req, res) => {
        const ownerId = req.ownerId;

        // отримуємо id тваринки
        const pet = await db.get("SELECT id FROM Pets WHERE ownerId = ?", ownerId);

        if (!pet) {
            return res.status(404).json({
                error: "PET_NOT_FOUND",
                message: "Create a pet first"
            });
        }

        // витягуємо історію покупок
        const history = await db.all(
            "SELECT itemId, price, createdAt FROM Purchases WHERE petId = ? ORDER BY createdAt DESC LIMIT 20",
            pet.id
        );

        res.json(history);
    });
}

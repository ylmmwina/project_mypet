import { shopItems, findShopItem } from "../shop/shopItems.js";
import Pet from "../models/pet.js";
import {
    getPetByOwnerIdAndPetId, // Використовуємо це для конкретного пета
    savePet,
    addInventoryItem,
    addPurchaseHistoryEntry,
    getPurchaseHistory
} from "../utils/database.js";

export default function registerShopRoutes(app, db) {

    // Список товарів
    app.get("/shop/items", (req, res) => {
        res.json(shopItems);
    });

    // Купівля товару → додати в інвентар
    app.post("/shop/buy", async (req, res) => {
        const ownerId = req.ownerId;
        const { itemId, petId } = req.body;

        if (!itemId) {
            return res.status(400).json({
                error: "ITEM_ID_REQUIRED",
                message: "You must provide itemId"
            });
        }

        if (!petId) {
            return res.status(400).json({
                error: "PET_ID_REQUIRED",
                message: "You must provide petId"
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
            // Отримуємо КОНКРЕТНУ тваринку
            const petData = await getPetByOwnerIdAndPetId(db, ownerId, petId);

            if (!petData) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Pet not found or access denied"
                });
            }

            const pet = Pet.fromJSON(petData);

            if (pet.coins < item.price) {
                return res.status(400).json({
                    error: "NOT_ENOUGH_COINS",
                    message: "Not enough coins to buy this item"
                });
            }

            // Списуємо монети
            pet.coins -= item.price;

            // Зберігаємо оновленого пета
            await savePet(db, pet);

            const now = new Date().toISOString();

            // Додаємо товар до інвентаря САМЕ ЦЬОГО пета
            await addInventoryItem(db, petId, item.id);

            // Логування покупки
            await addPurchaseHistoryEntry(db, petId, item.id, item.price);

            // Повертаємо оновленого пета (з новим балансом)
            res.json(pet.toJSON());

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "SHOP_UNKNOWN_ERROR",
                message: "Unexpected error while buying item"
            });
        }
    });

    // Історія покупок (Тепер приймає petId як параметр: /shop/history?petId=1)
    app.get("/shop/history", async (req, res) => {
        const ownerId = req.ownerId;
        const petId = req.query.petId;

        if (!petId) {
            return res.status(400).json({ error: "PET_ID_REQUIRED", message: "petId query param required" });
        }

        try {
            // Перевіряємо права доступу
            const petData = await getPetByOwnerIdAndPetId(db, ownerId, petId);
            if (!petData) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Pet not found or access denied"
                });
            }

            const history = await getPurchaseHistory(db, petId);
            res.json(history);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "HISTORY_ERROR",
                message: "Failed to load purchase history"
            });
        }
    });
}
import Pet from "../models/pet.js";
import { findShopItem, applyItemEffects } from "../shop/shopItems.js";
import {
    getInventoryForPet,
    getInventoryItem,
    consumeInventoryItem,
    savePet,
    getPetByOwnerIdAndPetId // Імпортуємо правильну функцію
} from "../utils/database.js";

export default function registerInventoryRoutes(app, db) {

    // Отримати інвентар поточного улюбленця
    app.get("/inventory", async (req, res) => {
        const ownerId = req.ownerId;
        const petId = req.query.petId;

        if (!petId) {
            return res.status(400).json({ error: "PET_ID_REQUIRED", message: "petId query param required" });
        }

        try {
            // 1. Перевіряємо, чи належить цей petId цьому власнику (TODO виконано ✅)
            const petData = await getPetByOwnerIdAndPetId(db, ownerId, petId);
            if (!petData) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Pet not found or access denied"
                });
            }

            // 2. Якщо перевірка пройшла, беремо інвентар
            const rows = await getInventoryForPet(db, petId);

            // Додаємо опис товару з shopItems
            const inventory = rows.map((row) => {
                const item = findShopItem(row.itemId);
                return {
                    itemId: row.itemId,
                    quantity: row.quantity,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    item: item || null
                };
            });

            res.json(inventory);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "INVENTORY_UNKNOWN_ERROR",
                message: "Failed to load inventory"
            });
        }
    });

    // Використати предмет з інвентаря
    app.post("/inventory/use", async (req, res) => {
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

        try {
            // Перевіряємо власника і отримуємо пета
            const petData = await getPetByOwnerIdAndPetId(db, ownerId, petId);
            if (!petData) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Pet not found or access denied"
                });
            }

            const pet = Pet.fromJSON(petData);

            const item = findShopItem(itemId);
            if (!item) {
                return res.status(404).json({
                    error: "ITEM_NOT_FOUND",
                    message: "Item config not found"
                });
            }

            const inventoryItem = await getInventoryItem(db, petId, itemId);

            if (!inventoryItem || inventoryItem.quantity <= 0) {
                return res.status(400).json({
                    error: "ITEM_NOT_IN_INVENTORY",
                    message: "You don't have this item in your inventory"
                });
            }

            // Застосовуємо ефекти
            applyItemEffects(pet, item);

            // Зберігаємо пета
            await savePet(db, pet);

            // Списуємо предмет
            const now = new Date().toISOString();
            const remainingQuantity = await consumeInventoryItem(db, petId, itemId, now);

            res.json({
                pet: pet.toJSON(),
                itemId,
                remainingQuantity
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "INVENTORY_USE_ERROR",
                message: "Failed to use item from inventory"
            });
        }
    });
}
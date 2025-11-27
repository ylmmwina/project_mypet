import Pet from "../models/pet.js";
import { findShopItem, applyItemEffects } from "../shop/shopItems.js";
import {
    getPetByOwnerId,
    getPetIdByOwnerId,
    getInventoryForPet,
    getInventoryItem,
    consumeInventoryItem,
    savePet
} from "../utils/database.js";

export default function registerInventoryRoutes(app, db) {

    // Отримати інвентар поточного улюбленця
    app.get("/inventory", async (req, res) => {
        const ownerId = req.ownerId;

        try {
            const petId = await getPetIdByOwnerId(db, ownerId);
            if (!petId) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Create a pet first"
                });
            }

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
        const { itemId } = req.body;

        if (!itemId) {
            return res.status(400).json({
                error: "ITEM_ID_REQUIRED",
                message: "You must provide itemId"
            });
        }

        try {
            const petData = await getPetByOwnerId(db, ownerId);
            if (!petData) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Create a pet first"
                });
            }

            const pet = Pet.fromJSON(petData);

            if (pet.health <= 0) {
                return res.status(400).json({
                    error: "PET_DEAD",
                    message: "Your pet is dead. You cannot use items."
                });
            }

            const petId = pet.id;
            if (!petId) {
                return res.status(500).json({
                    error: "PET_ID_MISSING",
                    message: "Pet record has no id"
                });
            }

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

            applyItemEffects(pet, item);

            await savePet(db, pet);

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

import { shopItems, findShopItem } from "../shop/shopItems.js";
import Pet from "../models/pet.js";
import {
    getPetIdByOwnerId,
    savePet,
    addInventoryItem,
    addPurchaseHistoryEntry,
    getPurchaseHistory,
    getPetByOwnerIdAndPetId
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

        const item = findShopItem(itemId);
        if (!item) {
            return res.status(404).json({
                error: "ITEM_NOT_FOUND",
                message: "This item does not exist"
            });
        }

        try {
            // отримуємо тваринку за ownerId
            const petData = await getPetByOwnerIdAndPetId(db, ownerId, petId);
            if (!petData) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Create a pet first"
                });
            }

            const pet = Pet.fromJSON(petData);

            // перевірки стану
            // if (pet.health <= 0) {
            //     return res.status(400).json({
            //         error: "PET_DEAD",
            //         message: "Your pet is dead. Shop is unavailable."
            //     });
            // }

            if (pet.coins < item.price) {
                return res.status(400).json({
                    error: "NOT_ENOUGH_COINS",
                    message: "Not enough coins to buy this item"
                });
            }

            // списуємо монети
            pet.coins -= item.price;

            // зберігаємо оновленого пета
            await savePet(db, pet);
            

            // додаємо товар до інвентаря
            await addInventoryItem(db, petId, item.id);

            // логування покупки
            await addPurchaseHistoryEntry(db, petId, item.id, item.price);

            // повертаємо оновленого пета
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

        try {
            const petId = await getPetIdByOwnerId(db, ownerId);
            if (!petId) {
                return res.status(404).json({
                    error: "PET_NOT_FOUND",
                    message: "Create a pet first"
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

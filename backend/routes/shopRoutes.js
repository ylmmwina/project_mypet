/**
 * @file shopRoutes.js
 * @brief Маршрути API для роботи з магазином (Shop).
 * * Цей файл містить логіку, що дозволяє користувачам переглядати доступні товари,
 * купувати їх для своїх улюбленців та переглядати історію витрат.
 */

import { shopItems, findShopItem } from "../shop/shopItems.js";
import Pet from "../models/pet.js";
import {
    getPetByOwnerIdAndPetId, // Використовуємо це для конкретного пета
    savePet,
    addInventoryItem,
    addPurchaseHistoryEntry,
    getPurchaseHistory
} from "../utils/database.js";

/**
 * @brief Реєструє маршрути магазину у додатку Express.
 * * Ця функція встановлює обробники для наступних дій:
 * - Перегляд вітрини магазину.
 * - Покупка предмета.
 * - Перегляд історії транзакцій.
 * * @param {Object} app - Екземпляр додатка Express.
 * @param {Object} db - Екземпляр бази даних SQLite.
 */
export default function registerShopRoutes(app, db) {

    /**
     * @brief Отримати список доступних товарів.
     * @route GET /shop/items
     * * Повертає масив об'єктів товарів, які визначені у конфігурації (shopItems.js).
     * Клієнт використовує цей список для малювання інтерфейсу магазину.
     * * @param {Object} req - Об'єкт запиту Express.
     * @param {Object} res - Об'єкт відповіді Express.
     * @returns {JSON} Масив товарів. Кожен товар містить id, назву, ціну та ефекти.
     */
    app.get("/shop/items", (req, res) => {
        res.json(shopItems);
    });

    /**
     * @brief Купівля товару.
     * @route POST /shop/buy
     * * Здійснює покупку предмета для конкретного улюбленця.
     * Алгоритм:
     * 1. Перевіряє наявність ID товару та ID улюбленця.
     * 2. Перевіряє існування товару в конфігурації.
     * 3. Перевіряє, чи належить улюбленець поточному користувачу.
     * 4. Перевіряє, чи вистачає монет.
     * 5. Якщо все ок: списує монети, додає предмет в інвентар, записує в історію.
     * * @param {Object} req - Об'єкт запиту.
     * @param {string} req.body.itemId - ID товару (наприклад, 'basic_food').
     * @param {number} req.body.petId - ID улюбленця, для якого купується товар.
     * @param {string} req.ownerId - ID власника (встановлюється middleware з cookie).
     * @param {Object} res - Об'єкт відповіді.
     * * @returns {JSON} Оновлений об'єкт улюбленця (зокрема, оновлений баланс монет).
     * @returns {JSON} Error 400 - Якщо не вистачає грошей або невірні параметри.
     * @returns {JSON} Error 404 - Якщо товар або улюбленця не знайдено.
     */
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

    /**
     * @brief Отримати історію покупок для улюбленця.
     * @route GET /shop/history
     * * Дозволяє переглянути, що купували для конкретної тваринки.
     * * @param {Object} req - Об'єкт запиту.
     * @param {number} req.query.petId - ID улюбленця (Query Parameter).
     * @param {string} req.ownerId - ID власника.
     * @param {Object} res - Об'єкт відповіді.
     * * @returns {JSON} Список транзакцій (товар, ціна, дата).
     */
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
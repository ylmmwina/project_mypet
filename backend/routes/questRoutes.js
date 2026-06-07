/**
 * @file questRoutes.js
 * @brief API routes for the MyPet quest system.
 */

import { QUEST_ITEMS, getQuestById } from "../quests/questItems.js";
import {
    createQuestProgress,
    getQuestProgressById,
    markQuestClaimed,
    updateQuestProgress
} from "../utils/database.js";

/**
 * @brief Registers quest-related API routes.
 *
 * Routes:
 * - GET /quests
 * - POST /quests/claim
 *
 * @param {Object} app Express application.
 * @param {Object} db SQLite database connection.
 */
export default function registerQuestRoutes(app, db) {
    /**
     * @route GET /quests
     * @brief Returns all quests with progress for a selected pet.
     *
     * Query params:
     * - petId: selected pet id
     */
    app.get("/quests", async (req, res) => {
        try {
            const petId = Number(req.query.petId);

            if (!petId) {
                return res.status(400).json({
                    error: "petId is required"
                });
            }

            const questsWithProgress = [];

            for (const quest of QUEST_ITEMS) {
                const progressRecord = await createQuestProgress(db, petId, quest.id);

                questsWithProgress.push({
                    ...quest,
                    progress: progressRecord.progress,
                    completed: Boolean(progressRecord.completed),
                    claimed: Boolean(progressRecord.claimed)
                });
            }

            return res.json(questsWithProgress);
        } catch (error) {
            console.error("GET /quests error:", error);

            return res.status(500).json({
                error: "Failed to load quests"
            });
        }
    });

    /**
     * @route POST /quests/progress
     * @brief Updates quest progress for a selected pet.
     *
     * Body:
     * - petId: selected pet id
     * - questId: quest id
     * - progress: new progress value
     */
    app.post("/quests/progress", async (req, res) => {
        try {
            const { petId, questId, progress } = req.body;

            if (!petId || !questId || progress === undefined) {
                return res.status(400).json({
                    error: "petId, questId and progress are required"
                });
            }

            const quest = getQuestById(questId);

            if (!quest) {
                return res.status(404).json({
                    error: "Quest not found"
                });
            }

            const pet = await db.get(
                "SELECT * FROM Pets WHERE id = ?",
                petId
            );

            if (!pet) {
                return res.status(404).json({
                    error: "Pet not found"
                });
            }

            await createQuestProgress(db, petId, questId);

            const normalizedProgress = Math.max(0, Number(progress));
            const completed = normalizedProgress >= quest.requiredProgress;

            const updatedProgress = await updateQuestProgress(
                db,
                petId,
                questId,
                normalizedProgress,
                completed
            );

            return res.json({
                message: "Quest progress updated",
                questId,
                progress: {
                    ...updatedProgress,
                    completed: Boolean(updatedProgress.completed),
                    claimed: Boolean(updatedProgress.claimed)
                }
            });
        } catch (error) {
            console.error("POST /quests/progress error:", error);

            return res.status(500).json({
                error: "Failed to update quest progress"
            });
        }
    });

    /**
     * @route POST /quests/claim
     * @brief Claims reward for a completed quest.
     *
     * Body:
     * - petId: selected pet id
     * - questId: quest id
     */
    app.post("/quests/claim", async (req, res) => {
        try {
            const { petId, questId } = req.body;

            if (!petId || !questId) {
                return res.status(400).json({
                    error: "petId and questId are required"
                });
            }

            const quest = getQuestById(questId);

            if (!quest) {
                return res.status(404).json({
                    error: "Quest not found"
                });
            }

            const progressRecord = await getQuestProgressById(db, petId, questId);

            if (!progressRecord) {
                return res.status(404).json({
                    error: "Quest progress not found"
                });
            }

            if (!progressRecord.completed) {
                return res.status(400).json({
                    error: "Quest is not completed yet"
                });
            }

            if (progressRecord.claimed) {
                return res.status(400).json({
                    error: "Quest reward already claimed"
                });
            }

            const pet = await db.get(
                "SELECT * FROM Pets WHERE id = ?",
                petId
            );

            if (!pet) {
                return res.status(404).json({
                    error: "Pet not found"
                });
            }

            const newCoins = pet.coins + quest.rewardCoins;
            const newXp = pet.xp + quest.rewardXp;

            await db.run(
                "UPDATE Pets SET coins = ?, xp = ? WHERE id = ?",
                newCoins,
                newXp,
                petId
            );

            const updatedProgress = await markQuestClaimed(db, petId, questId);

            const updatedPet = await db.get(
                "SELECT * FROM Pets WHERE id = ?",
                petId
            );

            return res.json({
                message: "Quest reward claimed",
                questId,
                rewardCoins: quest.rewardCoins,
                rewardXp: quest.rewardXp,
                progress: {
                    ...updatedProgress,
                    completed: Boolean(updatedProgress.completed),
                    claimed: Boolean(updatedProgress.claimed)
                },
                pet: updatedPet
            });
        } catch (error) {
            console.error("POST /quests/claim error:", error);

            return res.status(500).json({
                error: "Failed to claim quest reward"
            });
        }
    });
    /**
     * @route POST /quests/reset
     * @brief Скидає весь прогрес квестів для улюбленця (видаляє записи з БД).
     */
    app.post("/quests/reset", async (req, res) => {
        try {
            const { petId } = req.body;
            if (!petId) return res.status(400).json({ error: "petId is required" });

            await db.run("DELETE FROM QuestProgress WHERE petId = ?", petId);

            return res.json({ message: "Quests reset successfully" });
        } catch (error) {
            console.error("POST /quests/reset error:", error);
            return res.status(500).json({ error: "Failed to reset quests" });
        }
    });
}
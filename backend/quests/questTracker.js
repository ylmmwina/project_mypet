import { QUEST_ITEMS } from "./questItems.js";
import { createQuestProgress, updateQuestProgress } from "../utils/database.js";

/**
 * @brief Оновлює прогрес квесту на основі виконаної дії.
 * @param {Object} db - Екземпляр бази даних SQLite.
 * @param {number} petId - ID улюбленця.
 * @param {string} targetAction - Дія, яка була виконана (наприклад, 'feed_pet').
 */
export async function trackQuestProgress(db, petId, targetAction) {
    try {
        const quest = QUEST_ITEMS.find((q) => q.targetAction === targetAction);
        if (!quest) return; 
     
        const progressRecord = await createQuestProgress(db, petId, quest.id);

        if (progressRecord.completed) return;

        const newProgress = progressRecord.progress + 1;
        const completed = newProgress >= quest.requiredProgress;

        await updateQuestProgress(db, petId, quest.id, newProgress, completed);
        console.log(`[Quests] Progress updated for pet ${petId}, quest: ${quest.id}, completed: ${completed}`);
    } catch (error) {
        console.error(`[Quests] Failed to update progress for action ${targetAction}:`, error);
    }
}
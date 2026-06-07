import { QUEST_ITEMS } from "./questItems.js";
import { createQuestProgress, updateQuestProgress, getQuestProgressById } from "../utils/database.js";

/**
 * @brief Оновлює прогрес квесту на основі виконаної дії.
 */
export async function trackQuestProgress(db, petId, targetAction) {
    try {
        const quest = QUEST_ITEMS.find((q) => q.targetAction === targetAction);
        if (!quest) return; 

        await createQuestProgress(db, petId, quest.id);

        const progressRecord = await getQuestProgressById(db, petId, quest.id);

        if (!progressRecord || progressRecord.completed) return; 

        const newProgress = progressRecord.progress + 1;
        const completed = newProgress >= quest.requiredProgress;

        await updateQuestProgress(db, petId, quest.id, newProgress, completed);
        console.log(`[Quests] Progress updated for pet ${petId}, quest: ${quest.id}, completed: ${completed}`);
    } catch (error) {
        console.error(`[Quests] Failed to update progress for action ${targetAction}:`, error);
    }
}
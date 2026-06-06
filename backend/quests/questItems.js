/**
 * @file questItems.js
 * @brief Static quest definitions for the MyPet quest system.
 */

/**
 * @constant {Array<Object>} QUEST_ITEMS
 * @brief List of available base quests.
 *
 * Each quest has:
 * - id: unique quest identifier;
 * - title: display name;
 * - description: short explanation for the player;
 * - targetAction: action that should complete the quest;
 * - requiredProgress: amount of actions required;
 * - rewardCoins: coins received after claiming reward;
 * - rewardXp: XP received after claiming reward.
 */
export const QUEST_ITEMS = [
    {
        id: "feed_pet",
        title: "Погодуй улюбленця",
        description: "Погодуй улюбленця один раз.",
        targetAction: "feed_pet",
        requiredProgress: 1,
        rewardCoins: 10,
        rewardXp: 10
    },
    {
        id: "sleep_pet",
        title: "Час для відпочинку",
        description: "Поклади улюбленця спати один раз.",
        targetAction: "sleep_pet",
        requiredProgress: 1,
        rewardCoins: 10,
        rewardXp: 10
    },
    {
        id: "play_game",
        title: "Міні-гра",
        description: "Заверши міні-гру один раз.",
        targetAction: "play_game",
        requiredProgress: 1,
        rewardCoins: 15,
        rewardXp: 15
    },
    {
        id: "buy_item",
        title: "Перша покупка",
        description: "Купи будь-який предмет у магазині.",
        targetAction: "buy_item",
        requiredProgress: 1,
        rewardCoins: 5,
        rewardXp: 10
    },
    {
        id: "use_item",
        title: "Корисний предмет",
        description: "Використай будь-який предмет з інвентарю.",
        targetAction: "use_item",
        requiredProgress: 1,
        rewardCoins: 5,
        rewardXp: 10
    }
];

/**
 * @brief Finds quest definition by quest id.
 *
 * @param {string} questId Quest identifier.
 * @returns {Object|undefined} Quest definition or undefined.
 */
export function getQuestById(questId) {
    return QUEST_ITEMS.find((quest) => quest.id === questId);
}
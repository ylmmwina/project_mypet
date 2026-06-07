/**
 * @file script.js
 * @brief Основний файл клієнтської логіки (Frontend).
 *
 * Керує відображенням інтерфейсу, обробляє авторизацію користувачів,
 * взаємодіє з бекенд API через REST та WebSockets, а також
 * реалізує ігрову логіку догляду за улюбленцем та міні-гру Phaser.
 */

const API_URL = "http://localhost:3000";
/** @type {Object|null} currentPet - Об'єкт поточного обраного улюбленця. */
let currentPet = null;
/** @type {Array<Object>} myPets - Масив усіх улюбленців, що належать користувачу. */
let myPets = [];
/** @type {number|null} happyTimer - Таймер для тимчасового "щасливого" стану спрайта. */
let happyTimer = null;
/** @type {number|null} notificationTimer - Таймер для автоматичного приховування сповіщень. */
let notificationTimer = null;
/** @type {boolean} isSavingGame - Запобіжник від подвійного нарахування результатів гри. */
let isSavingGame = false;

// --- СЛОВНИК АСЕТІВ ---
/** @type {Object} itemIcons - Мапа для зіставлення ID предмета та імені файлу іконки. */
const itemIcons = {
    "basic_food": "regular_feed.png",
    "premium_food": "premium_feed.png",
    "banana_snack": "banana_snack.png",
    "soap_basic": "soap.png",
    "medkit_small": "medicine.png",
    "energy_drink": "energy_drink.png",
    "vitamin_boost": "vitamin_boost.png",
    "bubble_bath": "bubble_bath.png",
    "golden_toy": "golden_toy.png",
    "royal_treat": "royal_treat.png"
};

// --- ЕЛЕМЕНТИ DOM ---
/** @type {HTMLElement} screenAuth - Екран авторизації (вхід/реєстрація). */
const screenAuth = document.getElementById("screen-auth");
/** @type {HTMLElement} screenMenu - Екран вибору улюбленців.*/
const screenMenu = document.getElementById("screen-menu");
/** @type {HTMLElement} screenCreate - Екран створення нового улюбленця. */
const screenCreate = document.getElementById("screen-create");
/** @type {HTMLElement} screenGame - Екран догляду за улюбленцем. */
const screenGame = document.getElementById("screen-game");
/** @type {HTMLElement} gameWrapper - Контейнер для Phaser. */
const gameWrapper = document.getElementById("phaser-game");

const petsListContainer = document.getElementById("pets-list");
const createForm = document.getElementById("create-form");
const petSprite = document.getElementById("pet-sprite");
const thoughtCloud = document.getElementById("thought-cloud");
const cloudImg = document.getElementById("cloud-img");
const sleepOverlay = document.getElementById("sleep-overlay");

const modalShop = document.getElementById("modal-shop");
const modalInventory = document.getElementById("modal-inventory");
const shopContainer = document.getElementById("shop-items-container");
const invContainer = document.getElementById("inventory-items-container");

const notificationBox = document.getElementById("pixel-notification");
const notificationText = document.getElementById("notification-text");
const petArea = document.querySelector(".pet-area");

const LOCATION_CLASSES = [
    "location-home",
    "location-kitchen",
    "location-bedroom",
    "location-park",
    "location-bathroom",
    "location-clinic"
];

const ACTION_LOCATIONS = {
    feed: "location-kitchen",
    sleep: "location-bedroom",
    play: "location-park",
    clean: "location-bathroom",
    heal: "location-clinic"
};

const FOOD_ITEM_IDS = ["basic_food", "premium_food", "banana_snack"];
const MYSTERY_BOX_PRICE = 25;

// СИСТЕМА ЕКРАНІВ ТА АВТОРИЗАЦІЯ

/**
 * @brief Відображає кастомне піксельне сповіщення.
 * @param {string} message - Текст сповіщення.
 * @param {string} [type='info'] - Тип ('info', 'error', 'success').
 */
function showNotification(message, type = 'info') {
    if (!notificationBox || !notificationText) return;
    notificationText.textContent = message;
    notificationBox.classList.remove("hidden");
    notificationBox.className = "notification-box";
    if (type === 'error') notificationBox.classList.add("error");
    else if (type === 'success') notificationBox.classList.add("success");

    if (notificationTimer) clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => { notificationBox.classList.add("hidden"); }, 3000);
}

/**
 * @brief Змінює локацію ігрової зони улюбленця.
 * @param {string} locationClass - CSS-клас локації.
 */
function setPetLocation(locationClass = "location-home") {
    if (!petArea) return;

    petArea.classList.remove(...LOCATION_CLASSES);
    petArea.classList.add(locationClass);
}

/**
 * @brief Показує локацію, пов'язану з дією користувача.
 * @param {string} action - Назва дії: feed, sleep, play, clean або heal.
 */
function showActionLocation(action) {
    const locationClass = ACTION_LOCATIONS[action] || "location-home";

    setPetLocation(locationClass);

    if (action !== "sleep" && action !== "play") {
        setTimeout(() => {
            setPetLocation("location-home");
        }, 4000);
    }
}

/**
 * @brief Перемикає відображення головних екранів.
 * @param {HTMLElement} screenToShow - Екран, який потрібно показати.
 */
function showScreen(screenToShow) {
    [screenAuth, screenMenu, screenCreate, screenGame].forEach(s => {
        if(s) s.classList.add("hidden");
    });
    if (gameWrapper) gameWrapper.style.display = "none";
    const forceExit = document.getElementById("btn-force-exit");
    if (forceExit) forceExit.style.display = "none";

    if (screenToShow) screenToShow.classList.remove("hidden");
}

/** @brief Перемикає видимість між формами входу та реєстрації. */
window.toggleAuth = (view) => {
    const loginSec = document.getElementById("login-section");
    const regSec = document.getElementById("register-section");
    if (view === 'register') {
        loginSec.classList.add("hidden");
        regSec.classList.remove("hidden");
    } else {
        regSec.classList.add("hidden");
        loginSec.classList.remove("hidden");
    }
};

/** @brief Обробка входу з очищенням стану */
window.handleLogin = async () => {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;

    if (!email || !pass) return showNotification("Введи дані!", "error");

    try {
        // Чекаємо відповіді від сервера
        const response = await apiRequest('/login', 'POST', { email, password: pass });

        showNotification("Успішний вхід!", "success");

        // Очищаємо старі дані перед завантаженням нових
        myPets = [];
        currentPet = null;

        await loadPetsList();
        showScreen(screenMenu);
    } catch (error) {
        showNotification(error.message, "error"); // Тут вилетить "Невірні дані"
    }
};

/** @brief Обробка реєстрації */
window.handleRegister = async () => {
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-password").value;

    if (!username || !email || !pass) return showNotification("Заповни все!", "error");

    try {
        await apiRequest('/register', 'POST', { username, email, password: pass });
        showNotification("Реєстрація успішна! Тепер увійди.", "success");
        toggleAuth('login');
    } catch (error) {
        showNotification(error.message, "error");
    }
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.add("hidden");
};

/**
 * @brief Виконує запит до бекенд API.
 */
async function apiRequest(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${endpoint}`, options);
    let errData;
    try { errData = await res.json(); } catch (e) { errData = { message: res.statusText }; }
    if (!res.ok) {
        throw new Error(errData.message || errData.error || "Помилка сервера");
    }
    return errData;
}

document.addEventListener("DOMContentLoaded", () => {
    showScreen(screenAuth); // Починаємо з авторизації
});

// РОБОТА З УЛЮБЛЕНЦЯМИ

/** @brief Завантажує список улюбленців. */
async function loadPetsList() {
    showScreen(screenMenu);
    petsListContainer.innerHTML = '<p>Завантаження...</p>';
    try {
        const data = await apiRequest('/pets', 'GET');
        petsListContainer.innerHTML = '';
        myPets = Array.isArray(data) ? data : (data && data.name ? [data] : []);

        if (myPets.length === 0) {
            petsListContainer.innerHTML = '<p>Немає улюбленців.</p>';
        } else {
            myPets.forEach(pet => {
                const card = document.createElement('div');
                card.className = 'pet-card';
                const iconType = pet.type || 'cat';
                card.innerHTML = `
                    <div class="pet-info-click" style="display:flex; align-items:center; gap:10px; flex-grow:1;">
                        <img src="assets/${iconType}_normal.png" style="width:40px;">
                        <span class="pet-card-name">${pet.name}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span>🪙 ${pet.coins || 0}</span>
                        <button class="delete-btn" title="Видалити"><img src="assets/button_delete.png" alt="Delete"></button>
                    </div>
                `;
                card.querySelector('.pet-info-click').onclick = () => startGame(pet);
                card.querySelector('.delete-btn').onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Видалити ${pet.name}?`)) deletePet(pet.id, pet.name);
                };
                petsListContainer.appendChild(card);
            });
        }
    } catch (e) { petsListContainer.innerHTML = '<p style="color:red">Помилка з\'єднання</p>'; }
}

async function deletePet(petId, petName) {
    try {
        await apiRequest('/pet/delete', "POST", { petId });
        showNotification(`${petName} видалено.`, "success");
        loadPetsList();
    } catch (e) { showNotification("Помилка: " + e.message, "error"); }
}

document.getElementById("btn-to-create").onclick = () => {
    if (myPets.length >= 3) return showNotification("Максимум 3 улюбленці!", "error");
    createForm.reset();
    showScreen(screenCreate);
};

document.getElementById("btn-cancel-create").onclick = () => showScreen(screenMenu);

createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("pet-name").value;
    const type = document.querySelector('input[name="pet-type"]:checked')?.value || 'cat';
    try {
        const newPet = await apiRequest('/create-pet', "POST", { name, type });
        myPets.push(newPet);
        startGame(newPet);
        showNotification("Улюбленця створено!", "success");
    } catch (e) { showNotification("Помилка: " + e.message, "error"); }
});

/** @brief Запускає ігровий екран.*/
function startGame(pet) {
    currentPet = pet;
    showScreen(screenGame);
    setPetLocation("location-home");
    updateUI(pet);
    startLiveUpdates();
}

/** @brief Оновлює інтерфейс (Показники, XP, Рівень). */
function updateUI(pet) {
    if (!pet) return;
    document.getElementById("display-name").textContent = pet.name;
    document.getElementById("stat-coins").textContent = pet.coins || 0;

    // Оновлення характеристик
    document.getElementById("val-hunger").textContent = (100 - pet.hunger) + "%";
    document.getElementById("val-happiness").textContent = pet.happiness + "%";
    document.getElementById("val-energy").textContent = pet.energy + "%";
    document.getElementById("val-health").textContent = pet.health + "%";
    document.getElementById("val-cleanliness").textContent = (100 - pet.cleanliness) + "%";

    // Оновлення рівня та прогресу XP
    const levelElem = document.getElementById("pet-level");
    const xpBar = document.getElementById("xp-progress-bar");
    const xpText = document.getElementById("xp-text");
    if (levelElem) levelElem.textContent = pet.level || 1;
    if (xpBar && xpText) {
        const nextXp = (pet.level || 1) * 100;
        const percent = ((pet.xp || 0) / nextXp) * 100;
        xpBar.style.width = Math.min(percent, 100) + "%";
        xpText.textContent = `${pet.xp || 0} / ${nextXp} XP`;
    }

    // Логіка спрайта
    let state = "normal";
    if (happyTimer) { }
    else if (sleepOverlay.classList.contains('active')) state = "sleep";
    else if (pet.health < 30 || pet.happiness < 30 || pet.hunger > 70 || pet.energy < 10) state = "sad";

    if (!happyTimer) petSprite.src = `assets/${pet.type}_${state}.png`;

    // Хмаринка думок
    let need = null;
    if (pet.health < 50) need = "heal";
    else if (pet.hunger > 50) need = "eat";
    else if (pet.energy < 30) need = "sleep";
    else if (pet.cleanliness > 50) need = "wash";
    else if (pet.happiness < 40) need = "play";

    if (need && !sleepOverlay.classList.contains('active')) {
        cloudImg.src = `assets/cloud_${need}.png`;
        thoughtCloud.classList.remove("hidden");
    } else { thoughtCloud.classList.add("hidden"); }
}

// ДІЇ ТА МАГАЗИН

document.getElementById("btn-feed").onclick = () => openInventory(true);

document.getElementById("btn-play-game").onclick = () => {
    if (!currentPet) return;
    showActionLocation("play");
    screenGame.classList.add("hidden");
    gameWrapper.style.display = "flex";
    document.getElementById("btn-force-exit").style.display = "block";
    setTimeout(() => { if (window.launchGame) window.launchGame(currentPet.type); }, 100);
};

document.getElementById("btn-sleep").onclick = async () => {
    showActionLocation("sleep");
    sleepOverlay.classList.add("active");
    triggerHappyState('sleep');

    try {
        currentPet = await apiRequest('/pet/sleep', "POST", { petId: currentPet.id });
        updateUI(currentPet);
    } catch(e) {
        showNotification(e.message, "error");
        console.error(e);
    }

    setTimeout(() => {
        sleepOverlay.classList.remove("active");
        setPetLocation("location-home");
        happyTimer = null;
        updateUI(currentPet);
        triggerHappyState('happy');
    }, 8000);
};

document.getElementById("btn-heal").onclick = () => useSpecificItem("medkit_small", "лікування", "heal");
document.getElementById("btn-clean").onclick = () => useSpecificItem("soap_basic", "миття", "clean");

async function useSpecificItem(itemId, actionName, actionLocation = null) {
    try {
        const items = await apiRequest(`/inventory?petId=${currentPet.id}`);
        const hasItem = items.find(i => i.itemId === itemId && i.quantity > 0);
        if (hasItem) useItem(itemId, actionLocation);
        else { showNotification(`Треба купити ${actionName}!`, "error"); openShop(); }
    } catch(e) { console.error(e); }
}

document.getElementById("btn-shop").onclick = openShop;

async function openShop() {
    modalShop.classList.remove("hidden");
    shopContainer.innerHTML = "Завантаження...";

    try {
        const items = await apiRequest('/shop/items');
        shopContainer.innerHTML = "";

        const mysteryBox = document.createElement("div");
        mysteryBox.className = "item-card mystery-box-card rarity-epic";
        mysteryBox.innerHTML = `
            <img class="item-icon" src="assets/mystery_box.png" alt="Mystery Box">
            <div class="rarity-badge rarity-badge-epic">RANDOM</div>
            <div class="item-name">Mystery Box</div>
            <div class="item-description">Common 65% / Rare 25% / Epic 10%</div>
            <div class="item-price">🪙 ${MYSTERY_BOX_PRICE}</div>
            <button class="buy-btn">Відкрити</button>
        `;

        mysteryBox.querySelector("button").onclick = buyMysteryBox;
        shopContainer.appendChild(mysteryBox);

        items.forEach(item => {
            const el = document.createElement("div");
            const rarity = item.rarity || "common";
            el.className = `item-card rarity-${rarity}`;

            const img = itemIcons[item.id] || "inventory_icon.png";

            el.innerHTML = `
                <img class="item-icon" src="assets/${img}" alt="${item.name}">
                <div class="rarity-badge rarity-badge-${rarity}">${rarity.toUpperCase()}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">🪙 ${item.price}</div>
                <button class="buy-btn">Купити</button>
            `;

            el.querySelector("button").onclick = () => buyItem(item.id);
            shopContainer.appendChild(el);
        });
    } catch(e) {
        shopContainer.innerHTML = "Помилка";
    }
}

async function buyItem(itemId) {
    try {
        const data = await apiRequest('/shop/buy', "POST", { itemId, petId: currentPet.id });
        currentPet = data;
        updateUI(data);
        showNotification("Куплено!", "success");
    } catch(e) { showNotification(e.message, "error"); }
}

/**
 * @brief Купує Mystery Box і додає випадковий предмет в інвентар.
 */
async function buyMysteryBox() {
    try {
        const data = await apiRequest('/shop/mystery-box', "POST", {
            petId: currentPet.id
        });

        currentPet = data.pet;
        updateUI(data.pet);

        const itemName = data.item?.name || "предмет";
        const rarity = data.item?.rarity || "common";

        showNotification(`Mystery Box: ${itemName} (${rarity})`, "success");
        openShop();
    } catch(e) {
        showNotification(e.message, "error");
    }
}

document.getElementById("btn-inventory").onclick = () => openInventory(false);

async function openInventory(filterFood = false) {
    modalInventory.classList.remove("hidden");
    invContainer.innerHTML = "Завантаження...";
    document.getElementById("inv-title").textContent = filterFood ? "Вибери їжу" : "Рюкзак";

    try {
        const items = await apiRequest(`/inventory?petId=${currentPet.id}`);
        invContainer.innerHTML = "";

        const filtered = filterFood ? items.filter(i => i.item?.type === 'food') : items;

        if (filtered.length === 0) {
            invContainer.innerHTML = "<p>Пусто</p>";
            return;
        }

        filtered.forEach(entry => {
            const el = document.createElement("div");
            const rarity = entry.item?.rarity || "common";
            el.className = `item-card rarity-${rarity}`;

            const img = itemIcons[entry.itemId] || "inventory_icon.png";
            const itemName = entry.item?.name || entry.itemId;

            el.innerHTML = `
                <img class="item-icon" src="assets/${img}" alt="${itemName}">
                <div class="rarity-badge rarity-badge-${rarity}">${rarity.toUpperCase()}</div>
                <div class="item-name">${itemName}</div>
                <div class="item-price">x${entry.quantity}</div>
                <button class="use-btn">Вжити</button>
            `;

            el.querySelector("button").onclick = () => {
                if (filterFood) closeModal('modal-inventory');
                useItem(entry.itemId);
            };

            invContainer.appendChild(el);
        });
    } catch(e) {
        console.error(e);
    }
}

async function useItem(itemId, actionLocation = null) {
    try {
        const data = await apiRequest('/inventory/use', "POST", { itemId, petId: currentPet.id });

        currentPet = data.pet;
        updateUI(data.pet);

        if (actionLocation) {
            showActionLocation(actionLocation);
        } else if (FOOD_ITEM_IDS.includes(itemId)) {
            showActionLocation("feed");
        }

        triggerHappyState('happy');
        showNotification("Використано!", "success");

        if (!modalInventory.classList.contains("hidden")) {
            openInventory(document.getElementById("inv-title").textContent === "Вибери їжу");
        }
    } catch(e) {
        showNotification(e.message, "error");
    }
}

/** @brief Керує тимчасовими станами спрайта. */
function triggerHappyState(overrideState) {
    const type = currentPet.type;
    petSprite.src = `assets/${type}_${overrideState}.png`;
    if (happyTimer) clearTimeout(happyTimer);
    if (overrideState !== 'sleep') {
        happyTimer = setTimeout(() => { happyTimer = null; updateUI(currentPet); }, 2000);
    } else { happyTimer = 999; }
}

document.getElementById("btn-back-menu").onclick = () => loadPetsList();

// СИСТЕМА КВЕСТІВ

const modalQuests = document.getElementById("modal-quests");
const questsContainer = document.getElementById("quests-container");

document.getElementById("btn-quests").onclick = openQuests;

async function openQuests() {
    modalQuests.classList.remove("hidden");
    questsContainer.innerHTML = "<p>Завантаження квестів...</p>";

    try {
        const quests = await apiRequest(`/quests?petId=${currentPet.id}`);
        questsContainer.innerHTML = "";

        if (quests.length === 0) {
            questsContainer.innerHTML = "<p>Немає доступних квестів.</p>";
            return;
        }

        quests.forEach(q => {
            const el = document.createElement("div");
            el.className = "quest-card";

            let btnHtml = "";
            if (q.claimed) {
                btnHtml = `<button disabled>Отримано</button>`;
            } else if (q.completed) {
                btnHtml = `<button onclick="claimQuest('${q.id}')">Забрати</button>`;
            } else {
                btnHtml = `<button disabled>${q.progress}/${q.requiredProgress}</button>`;
            }

            el.innerHTML = `
                <div class="quest-info">
                    <h3>${q.title}</h3>
                    <p>${q.description}</p>
                    <span class="quest-reward">🪙 ${q.rewardCoins} | 🌟 ${q.rewardXp} XP</span>
                </div>
                <div class="quest-action">${btnHtml}</div>
            `;
            questsContainer.appendChild(el);
        });
    } catch (e) {
        questsContainer.innerHTML = "<p style='color:red'>Помилка завантаження квестів</p>";
        console.error(e);
    }
}

window.claimQuest = async (questId) => {
    try {
        const res = await apiRequest('/quests/claim', 'POST', { 
            petId: currentPet.id, 
            questId: questId 
        });
        
        currentPet = res.pet; 
        updateUI(res.pet);    
        
        showNotification(`Нагороду отримано! +${res.rewardCoins} монет`, 'success');
        openQuests(); 
    } catch (e) {
        showNotification(e.message, 'error');
    }
};

// SOCKETS ТА PHASER

const socket = io(API_URL);
function startLiveUpdates() { if(currentPet?.ownerId) socket.emit('register', currentPet.ownerId); }

socket.on('pet-update', (updatedPet) => {
    if (currentPet && updatedPet.id === currentPet.id) {
        currentPet = updatedPet;
        if (!happyTimer && !sleepOverlay.classList.contains("active")) updateUI(updatedPet);
    }
});

window.closeGame = () => {
    setPetLocation("location-home");
    gameWrapper.style.display = "none";
    document.getElementById("btn-force-exit").style.display = "none";

    if (window.destroyGame) {
        window.destroyGame();
    }

    screenGame.classList.remove("hidden");

    if (currentPet) {
        apiRequest('/pets')
            .then(data => {
                const found = Array.isArray(data)
                    ? data.find(p => p.id === currentPet.id)
                    : data;

                if (found) {
                    currentPet = found;
                    updateUI(found);
                }
            })
            .catch(console.error);
    }
};

window.finishGameAndSendResults = async (score, coins) => {
    if (isSavingGame) return;
    isSavingGame = true;

    try {
        const updatedPet = await apiRequest('/pet/finish-game', "POST", {
            score,
            coinsEarned: coins,
            petId: currentPet.id
        });

        currentPet = updatedPet;
        updateUI(updatedPet);
        showNotification(`Гру завершено! +${coins} монет.`, "success");
    } catch (e) {
        showNotification(e.message, "error");
        console.error(e);
    } finally {
        isSavingGame = false;
        window.closeGame();
    }
};

document.getElementById("btn-force-exit").onclick = window.closeGame;
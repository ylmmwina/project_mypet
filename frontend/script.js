const API_URL = "http://localhost:3000";
let currentPet = null;
let myPets = [];
let happyTimer = null;
let notificationTimer = null;
let isSavingGame = false; // Замок від подвійного нарахування

// --- СЛОВНИК АСЕТІВ ---
const itemIcons = {
    "basic_food": "regular_feed.png",
    "premium_food": "premium_feed.png",
    "banana_snack": "banana_snack.png",
    "soap_basic": "soap.png",
    "medkit_small": "medicine.png"
};

// --- ЕЛЕМЕНТИ DOM ---
const screenMenu = document.getElementById("screen-menu");
const screenCreate = document.getElementById("screen-create");
const screenGame = document.getElementById("screen-game");
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

// --- ФУНКЦІЯ ПОВІДОМЛЕНЬ ---
function showNotification(message, type = 'info') {
    if (!notificationBox || !notificationText) {
        console.log(message);
        return;
    }
    notificationText.textContent = message;
    notificationBox.classList.remove("hidden");

    notificationBox.className = "notification-box";
    if (type === 'error') notificationBox.classList.add("error");
    else if (type === 'success') notificationBox.classList.add("success");

    if (notificationTimer) clearTimeout(notificationTimer);

    notificationTimer = setTimeout(() => {
        notificationBox.classList.add("hidden");
    }, 3000);
}

// --- ДОПОМІЖНІ ФУНКЦІЇ ---
function showScreen(screenToShow) {
    [screenMenu, screenCreate, screenGame].forEach(s => s.classList.add("hidden"));
    if (gameWrapper) gameWrapper.style.display = "none";
    document.getElementById("btn-force-exit").style.display = "none";
    screenToShow.classList.remove("hidden");
}

window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.add("hidden");
};

// --- API FETCH ---
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
        const errorText = errData.message || errData.error || "Помилка сервера";
        throw new Error(errorText);
    }
    return errData;
}

document.addEventListener("DOMContentLoaded", () => {
    loadPetsList();
});

// --- МЕНЮ ТА СТВОРЕННЯ ---
async function loadPetsList() {
    showScreen(screenMenu);
    petsListContainer.innerHTML = '<p>Завантаження...</p>';
    try {
        const data = await apiRequest('/pets', 'GET');

        petsListContainer.innerHTML = '';
        myPets = [];

        if (Array.isArray(data)) myPets = data;
        else if (data && data.name) myPets = [data];

        if (myPets.length === 0) {
            petsListContainer.innerHTML = '<p>Немає улюбленців.</p>';
        } else {
            myPets.forEach(pet => {
                const card = document.createElement('div');
                card.className = 'pet-card';
                const iconType = pet.type || 'cat';

                // Додаємо кнопку видалення
                card.innerHTML = `
                    <div class="pet-info-click" style="display:flex; align-items:center; gap:10px; flex-grow:1;">
                        <img src="assets/${iconType}_normal.png" style="width:40px;" onerror="this.src='assets/cat_normal.png'">
                        <span class="pet-card-name">${pet.name}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span>🪙 ${pet.coins || 0}</span>
                        <button class="delete-btn" title="Видалити">
                            <img src="assets/button_delete.png" alt="Delete">
                        </button>
                    </div>
                `;

                // Клік на картку - Грати
                card.querySelector('.pet-info-click').addEventListener('click', () => startGame(pet));

                // Клік на смітник - Видалити
                card.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deletePet(pet.id, pet.name);
                });

                petsListContainer.appendChild(card);
            });
        }
    } catch (e) {
        console.error(e);
        petsListContainer.innerHTML = '<p style="color:red">Помилка з\'єднання</p>';
    }
}

// Функція видалення
async function deletePet(petId, petName) {
    if (!confirm(`Ти точно хочеш видалити ${petName}? Це незворотно!`)) return;

    try {
        await apiRequest('/pet/delete', "POST", { petId });
        showNotification(`${petName} видалено.`, "success");
        loadPetsList();
    } catch (e) {
        showNotification("Помилка видалення: " + e.message, "error");
    }
}

document.getElementById("btn-to-create").onclick = () => {
    if (myPets.length >= 3) {
        showNotification("Можна мати максимум 3 улюбленці!", "error");
        return;
    }
    createForm.reset();
    showScreen(screenCreate);
};

document.getElementById("btn-cancel-create").onclick = () => showScreen(screenMenu);

createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("pet-name").value;
    const typeInput = document.querySelector('input[name="pet-type"]:checked');
    const type = typeInput ? typeInput.value : 'cat';

    if (myPets.some(p => p.type === type)) {
        showNotification(`У тебе вже є ${type}! Обери іншого.`, "error");
        return;
    }

    try {
        const newPet = await apiRequest('/create-pet', "POST", { name, type });
        myPets.push(newPet);
        startGame(newPet);
        showNotification("Улюбленця створено!", "success");
    } catch (e) { showNotification("Помилка створення: " + e.message, "error"); }
});

// --- ГРА ---
function startGame(pet) {
    currentPet = pet;
    showScreen(screenGame);
    updateUI(pet);
    startLiveUpdates();
}

function updateUI(pet) {
    if (!pet) return;

    document.getElementById("display-name").textContent = pet.name;
    document.getElementById("stat-coins").textContent = pet.coins !== undefined ? pet.coins : 0;

    document.getElementById("val-hunger").textContent = (100 - pet.hunger) + "%";
    document.getElementById("val-happiness").textContent = pet.happiness + "%";
    document.getElementById("val-energy").textContent = pet.energy + "%";
    document.getElementById("val-health").textContent = pet.health + "%";
    document.getElementById("val-cleanliness").textContent = (100 - pet.cleanliness) + "%";

    const type = pet.type;
    let state = "normal";

    if (happyTimer) {
        // Залишаємо поточний стан
    }
    else if (sleepOverlay.classList.contains('active')) {
        state = "sleep";
    }
    else if (pet.health < 30 || pet.happiness < 30 || pet.hunger > 70 || pet.energy < 10) {
        state = "sad";
    }

    if (!happyTimer) {
        petSprite.src = `assets/${type}_${state}.png`;
    }

    let need = null;
    if (pet.health < 50) need = "heal";
    else if (pet.hunger > 50) need = "eat";
    else if (pet.energy < 30) need = "sleep";
    else if (pet.cleanliness > 50) need = "wash";
    else if (pet.happiness < 40) need = "play";

    if (need && !sleepOverlay.classList.contains('active')) {
        cloudImg.src = `assets/cloud_${need}.png`;
        thoughtCloud.classList.remove("hidden");
    } else {
        thoughtCloud.classList.add("hidden");
    }
}

// --- ДІЇ ---
document.getElementById("btn-feed").onclick = () => openInventory(true);

document.getElementById("btn-play-game").onclick = () => {
    if (!currentPet) return;

    screenGame.classList.add("hidden");
    gameWrapper.style.display = "flex";
    document.getElementById("btn-force-exit").style.display = "block";

    setTimeout(() => {
        if (window.launchGame) {
            window.launchGame(currentPet.type);
        } else {
            console.error("Функція window.launchGame не знайдена!");
        }
    }, 100);
};

document.getElementById("btn-sleep").onclick = async () => {
    sleepOverlay.classList.add("active");
    triggerHappyState('sleep');

    try {
        const updated = await apiRequest('/pet/sleep', "POST", { petId: currentPet.id });
        currentPet = updated;
    } catch(e) { console.error(e); }

    setTimeout(() => {
        sleepOverlay.classList.remove("active");
        triggerHappyState('happy');
    }, 8000);
};

document.getElementById("btn-heal").onclick = () => useSpecificItem("medkit_small", "лікування");
document.getElementById("btn-clean").onclick = () => useSpecificItem("soap_basic", "миття");

async function useSpecificItem(itemId, actionName) {
    try {
        const items = await apiRequest(`/inventory?petId=${currentPet.id}`);
        const hasItem = items.find(i => i.itemId === itemId && i.quantity > 0);
        if (hasItem) useItem(itemId);
        else {
            showNotification(`Треба купити предмет для: ${actionName}!`, "error");
            openShop();
        }
    } catch(e) { console.error(e); }
}

document.getElementById("btn-shop").onclick = openShop;

async function openShop() {
    modalShop.classList.remove("hidden");
    shopContainer.innerHTML = "Завантаження...";
    try {
        const items = await apiRequest('/shop/items');
        shopContainer.innerHTML = "";
        items.forEach(item => {
            const el = document.createElement("div");
            el.className = "item-card";
            const imgFile = itemIcons[item.id] || "inventory_icon.png";
            el.innerHTML = `
                <img src="assets/${imgFile}" onerror="this.src='assets/inventory_icon.png'">
                <div class="item-price" style="height:30px; display:flex; align-items:center; text-align:center;">${item.name}</div>
                <div class="item-price">🪙 ${item.price}</div>
                <button class="buy-btn">Купити</button>
            `;
            el.querySelector("button").onclick = () => buyItem(item.id);
            shopContainer.appendChild(el);
        });
    } catch(e) { shopContainer.innerHTML = "Помилка"; }
}

async function buyItem(itemId) {
    try {
        const data = await apiRequest('/shop/buy', "POST", { itemId, petId: currentPet.id });
        if (currentPet.id === data.id) {
            currentPet = data;
            updateUI(data);
        }
        showNotification("Успішно куплено!", "success");
    } catch(e) { showNotification(e.message, "error"); }
}

document.getElementById("btn-inventory").onclick = () => openInventory(false);

async function openInventory(filterFood = false) {
    modalInventory.classList.remove("hidden");
    invContainer.innerHTML = "Завантаження...";
    document.getElementById("inv-title").textContent = filterFood ? "Вибери їжу" : "Рюкзак";

    try {
        const items = await apiRequest(`/inventory?petId=${currentPet.id}`);
        invContainer.innerHTML = "";
        const filtered = filterFood ? items.filter(i => i.item && i.item.type === 'food') : items;

        if (items.length === 0 || (filterFood && filtered.length === 0)) {
            invContainer.innerHTML = "<p>Пусто</p>";
            return;
        }

        filtered.forEach(entry => {
            const el = document.createElement("div");
            el.className = "item-card";
            const imgFile = itemIcons[entry.itemId] || "inventory_icon.png";
            el.innerHTML = `
                <img src="assets/${imgFile}" onerror="this.src='assets/inventory_icon.png'">
                <div class="item-price">x${entry.quantity}</div>
                <div class="item-price" style="font-size:8px;">${entry.item ? entry.item.name : entry.itemId}</div>
                <button class="use-btn">Вжити</button>
            `;
            el.querySelector("button").onclick = () => {
                useItem(entry.itemId);
                if (filterFood) closeModal('modal-inventory');
            };
            invContainer.appendChild(el);
        });
    } catch(e) { console.error(e); }
}

async function useItem(itemId) {
    try {
        const data = await apiRequest('/inventory/use', "POST", { itemId, petId: currentPet.id });
        currentPet = data.pet;
        updateUI(data.pet);
        triggerHappyState('happy');

        if (itemId.includes("food") || itemId.includes("snack")) showNotification("Ням-ням! Смачно!", "success");
        else if (itemId.includes("medkit")) showNotification("Вилікували!", "success");
        else if (itemId.includes("soap")) showNotification("Тепер чистенький!", "success");
        else showNotification("Предмет використано!", "success");

        if (!modalInventory.classList.contains("hidden")) {
            const isFoodMode = document.getElementById("inv-title").textContent === "Вибери їжу";
            openInventory(isFoodMode);
        }
    } catch(e) { showNotification(e.message, "error"); }
}

function triggerHappyState(overrideState) {
    const type = currentPet.type;
    petSprite.src = `assets/${type}_${overrideState}.png`;

    if (happyTimer) clearTimeout(happyTimer);

    if (overrideState !== 'sleep') {
        happyTimer = setTimeout(() => {
            happyTimer = null;
            updateUI(currentPet);
        }, 2000);
    } else {
        happyTimer = 999;
    }
}

document.getElementById("btn-back-menu").onclick = () => loadPetsList();

const socket = io(API_URL);
function startLiveUpdates() {
    if(currentPet && currentPet.ownerId) socket.emit('register', currentPet.ownerId);
}
socket.on('pet-update', (updatedPet) => {
    if (currentPet && updatedPet.id === currentPet.id) {
        currentPet = updatedPet;
        if (!happyTimer && !sleepOverlay.classList.contains("active")) {
            updateUI(updatedPet);
        }
    }
});

window.closeGame = () => {
    gameWrapper.style.display = "none";
    document.getElementById("btn-force-exit").style.display = "none";
    if (window.destroyGame) window.destroyGame();
    screenGame.classList.remove("hidden");

    // Скидаємо замок
    isSavingGame = false;

    if (currentPet) {
        apiRequest('/pets').then(data => {
            let foundPet;
            if (Array.isArray(data)) {
                foundPet = data.find(p => p.id === currentPet.id);
            } else {
                foundPet = data;
            }
            if (foundPet) {
                currentPet = foundPet;
                updateUI(foundPet);
            }
        }).catch(console.error);
    }
};

window.finishGameAndSendResults = async (score, coins) => {
    if (isSavingGame) return; // Блокуємо повторний виклик
    isSavingGame = true;

    try {
        const updatedPet = await apiRequest('/pet/finish-game', "POST", { score, coinsEarned: coins, petId: currentPet.id });
        showNotification(`Гру завершено! +${coins} монет.`, "success");
        currentPet = updatedPet;
        updateUI(updatedPet);
    } catch (e) {
        showNotification("Помилка збереження: " + e.message, "error");
    } finally {
        window.closeGame();
    }
};

document.getElementById("btn-force-exit").onclick = window.closeGame;
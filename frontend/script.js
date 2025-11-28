const API_URL = "http://localhost:3000";
let currentPet = null;
let myPets = []; // Зберігаємо список усіх наших тварин локально
let happyTimer = null;

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

// --- МЕНЮ ТА СТВОРЕННЯ (ОНОВЛЕНО) ---
async function loadPetsList() {
    showScreen(screenMenu);
    petsListContainer.innerHTML = '<p>Завантаження...</p>';
    try {
        const data = await apiRequest('/pet');

        petsListContainer.innerHTML = '';
        myPets = []; // Очищаємо список

        if (Array.isArray(data)) myPets = data;
        else if (data && data.name) myPets = [data];

        if (myPets.length === 0) {
            petsListContainer.innerHTML = '<p>Немає улюбленців.</p>';
        } else {
            myPets.forEach(pet => {
                const card = document.createElement('div');
                card.className = 'pet-card';
                const iconType = pet.type || 'cat';
                card.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="assets/${iconType}_normal.png" style="width:40px;" onerror="this.src='assets/cat_normal.png'">
                        <span class="pet-card-name">${pet.name}</span>
                    </div>
                    <span>🪙 ${pet.coins || 0}</span>
                `;
                // Клік по картці перемикає на цього улюбленця
                card.addEventListener('click', () => startGame(pet));
                petsListContainer.appendChild(card);
            });
        }
    } catch (e) {
        console.error(e);
        petsListContainer.innerHTML = '<p style="color:red">Помилка з\'єднання</p>';
    }
}

document.getElementById("btn-to-create").onclick = () => {
    // ПЕРЕВІРКА ЛІМІТУ (Макс 3)
    if (myPets.length >= 3) {
        alert("Можна мати максимум 3 улюбленці!");
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

    // ПЕРЕВІРКА ТИПУ (Тільки один вид кожного типу)
    const alreadyHasType = myPets.some(p => p.type === type);
    if (alreadyHasType) {
        alert(`У тебе вже є ${type === 'cat' ? 'кіт' : type === 'dog' ? 'пес' : 'мавпа'}! Обери іншого.`);
        return;
    }

    try {
        const newPet = await apiRequest('/create-pet', "POST", { name, type });
        // Оновлюємо список і запускаємо гру з новим петом
        myPets.push(newPet);
        startGame(newPet);
    } catch (e) { alert("Помилка створення: " + e.message); }
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

    // --- ЛОГІКА СПРАЙТІВ (ВИПРАВЛЕНО) ---
    const type = pet.type;
    let state = "normal";

    // Пріоритети станів:

    // 1. Якщо явно запущена анімація (через кнопку) - найвищий пріоритет
    if (happyTimer) {
        // Якщо це був сон, то state вже "sleep"
        // Якщо ні, то "happy"
        // Ми не перезаписуємо тут, бо happyTimer встановлюється в triggerHappyState
    }
    // 2. Якщо режим сну (оверлей) - спимо
    else if (sleepOverlay.classList.contains('active')) {
        state = "sleep";
    }
    // 3. Якщо просто погані показники - сумний
    else if (pet.health < 30 || pet.happiness < 30 || pet.hunger > 70 || pet.energy < 10) {
        // ВИПРАВЛЕННЯ: Якщо мало енергії, він СУМНИЙ, а не спить (поки ми не вкладемо)
        state = "sad";
    }
    // 4. Інакше нормальний
    else {
        state = "normal";
    }

    // Додатково: якщо зараз йде triggerHappyState('sleep'), то картинка вже задана
    // Але якщо ми просто оновлюємо UI, то беремо state
    if (!happyTimer) {
        petSprite.src = `assets/${type}_${state}.png`;
    }

    // Хмаринка потреб
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

// 2. ГРА (Phaser)
document.getElementById("btn-play-game").onclick = () => {
    if (!currentPet) return; // Про всяк випадок

    screenGame.classList.add("hidden");
    gameWrapper.style.display = "flex";
    document.getElementById("btn-force-exit").style.display = "block";

    setTimeout(() => {
        if (window.launchGame) {
            // ПЕРЕДАЄМО ТИП ТВАРИНИ (cat, dog, monkey)
            window.launchGame(currentPet.type);
        } else {
            console.error("Функція window.launchGame не знайдена!");
        }
    }, 100);
};

// --- СОН (ЗБІЛЬШЕНО ЧАС) ---
document.getElementById("btn-sleep").onclick = async () => {
    sleepOverlay.classList.add("active");
    triggerHappyState('sleep'); // Встановити спрайт сну

    try {
        const updated = await apiRequest('/pet/sleep', "POST");
        currentPet = updated;
        // Тут НЕ викликаємо updateUI одразу, щоб не збити спрайт сну
    } catch(e) { console.error(e); }

    // Спимо 8 СЕКУНД
    setTimeout(() => {
        sleepOverlay.classList.remove("active");
        triggerHappyState('happy'); // Прокидається веселий
    }, 8000);
};

document.getElementById("btn-heal").onclick = () => useSpecificItem("medkit_small", "лікування");
document.getElementById("btn-clean").onclick = () => useSpecificItem("soap_basic", "миття");

async function useSpecificItem(itemId, actionName) {
    try {
        const inventory = await apiRequest('/inventory');
        const hasItem = inventory.find(i => i.itemId === itemId && i.quantity > 0);
        if (hasItem) useItem(itemId);
        else {
            alert(`Потрібно купити предмет для ${actionName}!`);
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
        const data = await apiRequest('/shop/buy', "POST", { itemId });
        currentPet = data;
        updateUI(data);
        alert("Куплено!");
    } catch(e) { alert(e.message); }
}

document.getElementById("btn-inventory").onclick = () => openInventory(false);

async function openInventory(filterFood = false) {
    modalInventory.classList.remove("hidden");
    invContainer.innerHTML = "Завантаження...";
    document.getElementById("inv-title").textContent = filterFood ? "Вибери їжу" : "Рюкзак";

    try {
        const items = await apiRequest('/inventory');
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
        const data = await apiRequest('/inventory/use', "POST", { itemId });
        currentPet = data.pet;
        updateUI(data.pet);
        triggerHappyState('happy');
        if (!modalInventory.classList.contains("hidden")) {
            const isFoodMode = document.getElementById("inv-title").textContent === "Вибери їжу";
            openInventory(isFoodMode);
        }
    } catch(e) { alert(e.message); }
}

function triggerHappyState(overrideState) {
    const type = currentPet.type;
    petSprite.src = `assets/${type}_${overrideState}.png`;

    // Якщо вже був таймер, скидаємо його
    if (happyTimer) clearTimeout(happyTimer);

    // Встановлюємо таймер для повернення до "normal/sad"
    // АЛЕ якщо це сон, ми чекаємо завершення сну в функції сну
    if (overrideState !== 'sleep') {
        happyTimer = setTimeout(() => {
            happyTimer = null;
            updateUI(currentPet);
        }, 2000);
    } else {
        // Якщо це сон, ставимо happyTimer як "зайнятий", щоб updateUI не перебивав картинку
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
        // Оновлюємо UI, тільки якщо не йде анімація
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
    if (currentPet) {
        apiRequest('/pet').then(p => { currentPet = p; updateUI(p); });
    }
};

window.finishGameAndSendResults = async (score, coins) => {
    try {
        const updatedPet = await apiRequest('/pet/finish-game', "POST", { score, coinsEarned: coins });
        alert(`Гру завершено! +${coins} монет.`);
        currentPet = updatedPet;
        updateUI(updatedPet);
        window.closeGame();
    } catch (e) {
        alert("Помилка збереження: " + e.message);
        window.closeGame();
    }
};

document.getElementById("btn-force-exit").onclick = window.closeGame;
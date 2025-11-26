const API_URL = "http://localhost:3000";
let currentPet = null;

// --- ЕЛЕМЕНТИ DOM ---
const screenMenu = document.getElementById("screen-menu");
const screenCreate = document.getElementById("screen-create");
const screenGame = document.getElementById("screen-game");
const gameWrapper = document.getElementById("phaser-game");

const petsListContainer = document.getElementById("pets-list");
const createForm = document.getElementById("create-form");

const btnToCreate = document.getElementById("btn-to-create");
const btnCancelCreate = document.getElementById("btn-cancel-create");
const btnBackMenu = document.getElementById("btn-back-menu");
const btnForceExit = document.getElementById("btn-force-exit");

// --- ДОПОМІЖНА ФУНКЦІЯ ПЕРЕМИКАННЯ ЕКРАНІВ (Ось вона!) ---
function showScreen(screenToShow) {
    // Ховаємо всі екрани
    [screenMenu, screenCreate, screenGame].forEach(s => s.classList.add("hidden"));

    // Ховаємо гру
    if (gameWrapper) gameWrapper.style.display = "none";
    if (btnForceExit) btnForceExit.style.display = "none";

    // Показуємо потрібний
    screenToShow.classList.remove("hidden");
}

// --- ЗАПУСК ---
document.addEventListener("DOMContentLoaded", () => {
    loadPetsList();
});

// --- ЛОГІКА МЕНЮ ---
async function loadPetsList() {
    showScreen(screenMenu);
    petsListContainer.innerHTML = '<p>Завантаження...</p>';

    try {
        const res = await fetch(`${API_URL}/pet`);
        if (!res.ok) throw new Error("Server Error");
        const data = await res.json();

        petsListContainer.innerHTML = '';

        let pets = [];
        if (Array.isArray(data)) pets = data;
        else if (data && data.name) pets = [data]; // Якщо сервер повернув один об'єкт

        if (pets.length === 0) {
            petsListContainer.innerHTML = '<p>Немає збережених улюбленців.</p>';
        } else {
            pets.forEach(pet => {
                const card = document.createElement('div');
                card.className = 'pet-card';
                let icon = getPetIcon(pet.type);

                // Безпечна перевірка монет
                const coins = pet.coins !== undefined ? pet.coins : 0;

                card.innerHTML = `
                    <span class="pet-card-name">${icon} ${pet.name}</span>
                    <span class="pet-card-info">❤️ ${pet.health} | 🪙 ${coins}</span>
                `;
                card.addEventListener('click', () => startGame(pet));
                petsListContainer.appendChild(card);
            });
        }
    } catch (error) {
        console.error(error);
        petsListContainer.innerHTML = '<p style="color:red">Помилка з\'єднання з сервером.</p>';
    }
}

// --- ЛОГІКА СТВОРЕННЯ ---
if (btnToCreate) {
    btnToCreate.addEventListener("click", () => {
        createForm.reset();
        showScreen(screenCreate);
    });
}

if (btnCancelCreate) {
    btnCancelCreate.addEventListener("click", () => showScreen(screenMenu));
}

if (createForm) {
    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("pet-name").value;
        // Отримуємо вибраний радіо-баттон
        const typeInput = document.querySelector('input[name="pet-type"]:checked');
        const type = typeInput ? typeInput.value : 'cat';

        try {
            const res = await fetch(`${API_URL}/create-pet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, type })
            });
            if (res.ok) {
                const newPet = await res.json();
                startGame(newPet);
            } else {
                alert("Помилка при створенні!");
            }
        } catch (error) {
            console.error(error);
            alert("Сервер не відповідає.");
        }
    });
}

// --- ЛОГІКА ГРИ (ТАМАГОЧІ) ---
function startGame(pet) {
    currentPet = pet;
    showScreen(screenGame);
    updateUI(pet);
}

function updateUI(pet) {
    document.getElementById("display-name").textContent = pet.name;
    document.getElementById("stat-health").textContent = pet.health;
    document.getElementById("stat-coins").textContent = pet.coins !== undefined ? pet.coins : 0;
    document.getElementById("pet-sprite").textContent = getPetIcon(pet.type);
}

function getPetIcon(type) {
    if (type === 'dog') return '🐕';
    if (type === 'rabbit') return '🐰';
    return '🐱'; // cat default
}

// --- ДІЇ (Кнопки) ---
async function performAction(action) {
    if (!currentPet) return;
    try {
        const res = await fetch(`${API_URL}/pet/${action}`, { method: "POST" });
        if (res.ok) {
            const updatedPet = await res.json();
            currentPet = updatedPet;
            updateUI(updatedPet);
        }
    } catch (e) { console.error(e); }
}

// Прив'язка кнопок дій
const actions = ["feed", "sleep", "heal", "clean"];
actions.forEach(action => {
    const btn = document.getElementById(`btn-${action}`);
    if (btn) btn.onclick = () => performAction(action);
});

// Кнопка назад в меню
if (btnBackMenu) btnBackMenu.addEventListener("click", () => loadPetsList());


// --- ІНТЕГРАЦІЯ МІНІ-ГРИ ---

// 1. Кнопка запуску
const btnPlayGame = document.getElementById("btn-play-game");
if (btnPlayGame) {
    btnPlayGame.onclick = () => {
        // Ховаємо тамагочі
        screenGame.classList.add("hidden");

        // Показуємо контейнер гри
        if (gameWrapper) gameWrapper.style.display = "flex";

        // Показуємо кнопку виходу
        if (btnForceExit) btnForceExit.style.display = "block";

        // Запускаємо Phaser (через невелику затримку, щоб DOM оновився)
        setTimeout(() => {
            if (window.launchGame) {
                window.launchGame();
            } else {
                console.error("Функція window.launchGame не знайдена in main.js");
            }
        }, 50);
    };
}

// 2. Кнопка примусового виходу (ХРЕСТИК)
if (btnForceExit) {
    btnForceExit.onclick = () => {
        window.closeGame();
    };
}

// 3. Глобальна функція закриття
window.closeGame = () => {
    if (gameWrapper) gameWrapper.style.display = "none";
    if (btnForceExit) btnForceExit.style.display = "none";

    // Знищуємо гру
    if (window.destroyGame) {
        window.destroyGame();
    }

    // Показуємо тамагочі
    screenGame.classList.remove("hidden");

    // Оновлюємо дані (могли заробити монети)
    loadPetsList();
};

// 4. Глобальна функція відправки результатів
window.finishGameAndSendResults = async (score, coins) => {
    console.log(`Game Over! Score: ${score}, Coins: ${coins}`);
    try {
        const response = await fetch(`${API_URL}/pet/finish-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score, coinsEarned: coins })
        });
        if (response.ok) {
            const updatedPet = await response.json();
            alert(`Зароблено ${coins} монет!`);
            currentPet = updatedPet;
            updateUI(updatedPet);
        }
    } catch (e) { console.error(e); }
};
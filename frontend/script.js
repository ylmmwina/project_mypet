const API_URL = "http://localhost:3000";
let currentPet = null;

// Елементи екранів
const screenMenu = document.getElementById("screen-menu");
const screenCreate = document.getElementById("screen-create");
const screenGame = document.getElementById("screen-game");

// Елементи списку та форм
const petsListContainer = document.getElementById("pets-list");
const createForm = document.getElementById("create-form");

// Кнопки навігації
const btnToCreate = document.getElementById("btn-to-create");
const btnCancelCreate = document.getElementById("btn-cancel-create");
const btnBackMenu = document.getElementById("btn-back-menu");

// --- ЗАПУСК ---
document.addEventListener("DOMContentLoaded", () => {
    loadPetsList();
});

// --- ЛОГІКА МЕНЮ ---

// 1. Завантаження списку тварин
async function loadPetsList() {
    showScreen(screenMenu);
    petsListContainer.innerHTML = '<p>Завантаження...</p>';

    try {
        const res = await fetch(`${API_URL}/pet`);

        // Перевіряємо, чи бекенд живий
        if (!res.ok) throw new Error("Server Error");

        const data = await res.json();
        console.log("Прийшло з сервера:", data);

        petsListContainer.innerHTML = '';

        // Адаптація під старий/новий бекенд (об'єкт або масив)
        let pets = [];
        if (Array.isArray(data)) {
            pets = data;
        } else if (data && data.name) {
            pets = [data];
        }

        if (pets.length === 0) {
            petsListContainer.innerHTML = '<p>Немає збережених улюбленців.</p>';
        } else {
            pets.forEach(pet => {
                const card = document.createElement('div');
                card.className = 'pet-card';

                let icon = '🐱';
                if (pet.type === 'dog') icon = '🐕';
                if (pet.type === 'rabbit') icon = '🐰';

                card.innerHTML = `
                    <span class="pet-card-name">${icon} ${pet.name}</span>
                    <span class="pet-card-info">HP: ${pet.health}</span>
                `;

                card.addEventListener('click', () => startGame(pet));
                petsListContainer.appendChild(card);
            });
        }

    } catch (error) {
        console.error(error);
        petsListContainer.innerHTML = '<p style="color:red">Помилка з\'єднання. Запустіть сервер!</p>';
    }
}

// 2. Кнопка "Новий улюбленець" (перехід на форму)
if (btnToCreate) {
    btnToCreate.addEventListener("click", () => {
        // Очищаємо форму перед показом
        createForm.reset();
        showScreen(screenCreate);
    });
}

// 3. Кнопка "Скасувати" (повернення в меню)
if (btnCancelCreate) {
    btnCancelCreate.addEventListener("click", () => {
        showScreen(screenMenu);
    });
}

// --- ЛОГІКА СТВОРЕННЯ ---

createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("pet-name").value;
    const type = document.querySelector('input[name="pet-type"]:checked').value;

    try {
        const res = await fetch(`${API_URL}/create-pet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, type })
        });

        if (res.ok) {
            const newPet = await res.json();
            // Одразу запускаємо гру з новою тваринкою!
            startGame(newPet);
        } else {
            alert("Помилка при створенні!");
        }
    } catch (error) {
        console.error("Error creating pet:", error);
        alert("Сервер не відповідає.");
    }
});

// --- ЛОГІКА ГРИ ---

function startGame(pet) {
    currentPet = pet;
    showScreen(screenGame);

    // Оновлюємо інтерфейс
    document.getElementById("display-name").textContent = pet.name;
    document.getElementById("stat-health").textContent = pet.health;

    const sprite = document.getElementById("pet-sprite");
    if (pet.type === 'dog') sprite.textContent = '🐕';
    else if (pet.type === 'rabbit') sprite.textContent = '🐰';
    else sprite.textContent = '🐱';
}

// Кнопка "Меню" всередині гри (Зберегти і вийти)
if (btnBackMenu) {
    btnBackMenu.addEventListener("click", async () => {
        if (currentPet) {
            try {
                // Спроба зберегти прогрес перед виходом
                await fetch(`${API_URL}/create-pet`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(currentPet)
                });
            } catch (e) {
                console.warn("Не вдалося зберегти перед виходом");
            }
        }
        loadPetsList(); // Повернення в меню
    });
}

// --- УТИЛІТИ ---

function showScreen(screenToShow) {
    // Ховаємо всі екрани
    [screenMenu, screenCreate, screenGame].forEach(s => {
        if(s) s.classList.add("hidden");
    });
    // Показуємо потрібний
    if(screenToShow) screenToShow.classList.remove("hidden");
}
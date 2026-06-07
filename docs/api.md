# MyPet API Documentation

## Система квестів

* **`GET /quests`**
    * **Опис:** Отримання списку квестів та прогресу улюбленця.
    * **Параметри (Query):**
        * `petId` (integer): ID улюбленця, для якого перевіряється прогрес.
    * **Відповідь:** Масив об'єктів квесту (`id`, `title`, `description`, `progress`, `completed`, `claimed`).

* **`POST /quests/progress`**
    * **Опис:** Оновлення прогресу для конкретного квесту.
    * **Тіло запиту (JSON):**
        * `petId` (integer): ID улюбленця.
        * `questId` (string): Унікальний ідентифікатор квесту (наприклад, `"feed_pet"`).
        * `progress` (integer): Нове значення прогресу.

* **`POST /quests/claim`**
    * **Опис:** Отримання нагороди за завершений квест.
    * **Тіло запиту (JSON):**
        * `petId` (integer): ID улюбленця.
        * `questId` (string): ID виконаного квесту.

* **`POST /quests/reset`**
    * **Опис:** Видалення прогресу квестів для улюбленця.
    * **Тіло запиту (JSON):**
        * `petId` (integer): ID улюбленця.

## Магазин та Предмети

* **`GET /shop/items`** - список усіх доступних товарів.
* **`POST /shop/buy`**
    * **Тіло запиту:** `{ "petId": integer, "itemId": string }`
* **`POST /shop/mystery-box`**
    * **Тіло запиту:** `{ "petId": integer }`
* **`GET /shop/history`**
    * **Параметри (Query):** `petId` (integer).
* **`GET /inventory`**
    * **Параметри (Query):** `petId` (integer).
* **`POST /inventory/use`**
    * **Тіло запиту:** `{ "petId": integer, "itemId": string }`

## Улюбленець (Pet)

* **`POST /pet/feed`**
    * **Тіло запиту:** `{ "petId": integer }`
* **`POST /pet/sleep`**
    * **Тіло запиту:** `{ "petId": integer }`
* **`POST /pet/start-game`**
    * **Тіло запиту:** `{ "petId": integer }`
* **`POST /pet/finish-game`**
    * **Тіло запиту:**
        * `petId` (integer): ID улюбленця.
        * `score` (integer): Набрані бали.
        * `gameId` (string): Ідентифікатор ігрової сесії.
        * `coinsEarned` (integer): Зароблені монети.
// Маршрути для взаємодії з улюбленцем
import Storage from "../utils/storage.js";

export default function registerPetRoutes(app) {
    // Маршрут для отримання улюбленця (GET)
    // Вхідні дані: немає
    app.get("/pet", (req, res) => {
        res.send(Storage.loadPetSafe()?.toJSON() || {});
    });

    // Маршрут для створення улюбленця (POST)
    // Вхідні дані: name, type / { "name": "Tom", "type": "cat" }
    app.post("/create-pet", (req, res) => {
        const { name, type } = req.body;
        Storage.createPet(name, type);
        res.send(Storage.loadPetSafe()?.toJSON() || {});
    });


    const handlePetAction = (action, res) => {
        try {
            const pet = Storage.loadPet();
            if (!pet) throw new Error("Pet not found. Create one first.");

            if (pet.health === 0 && action !== "feed" && action !== "heal") {
                // Якщо здоров'я 0 І це НЕ годування/лікування,
                // блокуємо дію
                throw new Error("Pet is too sick to do that! Try feeding or healing it.");
            }

            pet[action]();

            Storage.savePet(pet);
            res.send(pet.toJSON());
        } catch (error) {
            res.status(400).send({ error: message });
        }
    };

//маршрут для годування улюбленця (POST)
    app.post("/pet/feed", (req, res) => {
        handlePetAction("feed", res);
    });

//маршрут для гри з улюбленцем (POST)
    app.post("/pet/play", (req, res) => {
        handlePetAction("play", res);
    });

//маршрут для сну (POST)
    app.post("/pet/sleep", (req, res) => {
        handlePetAction("sleep", res);
    });

//маршрут для лікування (POST)
    app.post("/pet/heal", (req, res) => {
        handlePetAction("heal", res);
    });

//маршрут для прибирання/миття (POST)
    app.post("/pet/clean", (req, res) => {
        handlePetAction("clean", res);
    });
}
// Маршрути для взаємодії з улюбленцем

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
}
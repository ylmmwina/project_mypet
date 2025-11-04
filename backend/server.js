import express from "express";
import Pet from "./models/pet.js";
import Storage from "./utils/storage.js";
import registerPetRoutes from "./routes/petRoutes.js";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

console.log(Storage.loadPetSafe());

// Маршрут для перевірки 
app.get("/", (req, res) => {
  res.send("🐾 MyPet сервер працює!");
});

registerPetRoutes(app);

// Запуск сервера 
app.listen(PORT, () => {
  console.log(`✅ Сервер запущено на http://localhost:${PORT}`);
});

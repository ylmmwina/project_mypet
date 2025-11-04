import fs from "fs";
import Pet from "../models/pet.js";

export default class Storage {

    static dirPath = "./backend/storage";
    static petFileName = "pet.json";
    
    static loadPet() {
        return Pet.fromJSON(Storage.loadJSONfromFile(this.dirPath + "/" + this.petFileName));
    }

    static loadPetSafe() {
        try {
            return this.loadPet();
        } catch (error) { }
    }

    static createPet(name, type) {
        if (type !== "cat" && type !== "dog" && type !== "rabbit") throw Error("Invalid pet type");
        Storage.saveJSONtoFile(this.dirPath + "/" + this.petFileName, new Pet(name, type, 0, 100, 0, 0, 0).toJSON());
    }

    static savePet(pet) {
        if (pet.type !== "cat" && pet.type !== "dog" && pet.type !== "rabbit") throw Error("Invalid pet type");
        if (!pet.health) throw Error("Pet is dead");
        Storage.saveJSONtoFile(this.dirPath + "/" + this.petFileName, pet.toJSON());
    }
    
    static loadJSONfromFile(path) {
        return JSON.parse(fs.readFileSync(path));
    }

    static saveJSONtoFile(path, json) {
        if (!fs.existsSync(this.dirPath)) fs.mkdirSync(this.dirPath);
        fs.writeFileSync(path, JSON.stringify(json, null, 2));
    }
}
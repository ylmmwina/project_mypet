import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import Storage from '../backend/utils/storage.js';
import Pet from '../../backend/models/pet.js';

describe("Storage Utility", () => {
    let writeSpy, readSpy, existsSpy, mkdirSpy;

    beforeEach(() => {
        // Тепер jest доступний через імпорт вище
        writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {});
        existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should save a pet correctly (writeFileSync should be called)", () => {
        const pet = new Pet("Rex", "dog", 2, 100, 0, 100, 100);

        Storage.savePet(pet);

        expect(writeSpy).toHaveBeenCalled();
        expect(writeSpy).toHaveBeenCalledWith(
            expect.stringContaining("pet.json"),
            expect.stringContaining("Rex")
        );
    });

    test("should load a pet correctly when file exists", () => {
        const mockFileContent = JSON.stringify({
            name: "Bella",
            type: "cat",
            age: 3,
            health: 90,
            hunger: 10,
            happiness: 80,
            energy: 60
        });

        readSpy.mockReturnValue(mockFileContent);

        const pet = Storage.loadPet();

        expect(readSpy).toHaveBeenCalled();
        expect(pet).toBeInstanceOf(Pet);
        expect(pet.name).toBe("Bella");
    });

    test("loadPetSafe should return undefined if reading fails", () => {
        readSpy.mockImplementation(() => {
            throw new Error("File not found");
        });

        const result = Storage.loadPetSafe();

        expect(result).toBeUndefined();
    });
});
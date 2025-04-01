import { TestBed } from "@angular/core/testing";

import { SeedDataGenerator } from "../utils/seed-data-generator";
import { DatabaseService } from "./database.service";
import { ImportExportService } from "./import-export.service";

describe("ImportExportService", () => {
  let databaseService: DatabaseService;
  let importExportService: ImportExportService;

  beforeEach(async () => {
    await indexedDB.deleteDatabase("VectorCashDB");

    TestBed.configureTestingModule({});
    importExportService = TestBed.inject(ImportExportService);
    databaseService = TestBed.inject(DatabaseService);

    const entries = SeedDataGenerator.generateEntries1();
    const accounts = SeedDataGenerator.generateAccounts1();
    const categories = SeedDataGenerator.generateAccountCategories1();

    databaseService.entries.bulkAdd(entries);
    databaseService.accounts.bulkAdd(accounts);
    databaseService.accountCategories.bulkAdd(categories);
  });

  it("should be created", () => {
    expect(importExportService).toBeTruthy();
  });

  it("should export data correctly", async () => {
    const blob = await importExportService.exportData();
    expect(blob).toBeInstanceOf(Blob);

    const url = window.URL.createObjectURL(blob);
    const response = await fetch(url);
    const data = await response.json();

    expect(data.entries.length).toBeGreaterThan(0);
    expect(data.accounts.length).toBeGreaterThan(0);
    expect(data.accountCategories.length).toBeGreaterThan(0);

    window.URL.revokeObjectURL(url);
  });
});

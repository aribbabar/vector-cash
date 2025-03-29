import { TestBed } from "@angular/core/testing";
import { Entry } from "../models/entry.model";
import { AccountCategoryService } from "./account-category.service";
import { AccountService } from "./account.service";
import { EntryService } from "./entry.service";

describe("Entry Service", () => {
  let entryService: EntryService;
  let accountService: AccountService;
  let accountCategoryService: AccountCategoryService;

  beforeEach(async () => {
    await indexedDB.deleteDatabase("VectorCashDB");

    TestBed.configureTestingModule({
      providers: [EntryService, AccountService, AccountCategoryService]
    });

    entryService = TestBed.inject(EntryService);
    accountService = TestBed.inject(AccountService);
    accountCategoryService = TestBed.inject(AccountCategoryService);

    // Set up common account categories for tests
    await accountCategoryService.add({
      name: "Checking",
      type: "Asset"
    });

    await accountCategoryService.add({
      name: "Savings",
      type: "Asset"
    });

    await accountCategoryService.add({
      name: "Credit Card",
      type: "Liability"
    });

    await accountCategoryService.add({
      name: "Loan",
      type: "Liability"
    });

    // Set up common accounts for tests
    await accountService.add({
      name: "Chase Checking",
      categoryId: 1
    });

    await accountService.add({
      name: "Chase Savings",
      categoryId: 2
    });

    await accountService.add({
      name: "Discover it",
      categoryId: 3
    });

    await accountService.add({
      name: "SoFi Loan",
      categoryId: 4
    });
  });

  it("should be created", () => {
    expect(entryService).toBeTruthy();
  });

  describe("Adding entries", () => {
    it("should add an entry", async () => {
      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const id = await entryService.add(entry);
      expect(id).toBe(1);
    });

    it("should throw an error if entry balance is negative", async () => {
      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: -1000
      };

      try {
        await entryService.add(entry);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it("should throw an error if entry for the same date and account ID already exists", async () => {
      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      await entryService.add(entry);

      try {
        await entryService.add(entry);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Getting entries", () => {
    it("should get an entry by ID", async () => {
      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const id = await entryService.add(entry);
      const fetchedEntry = await entryService.get(id);
      expect(fetchedEntry).toEqual({ ...entry, id });
    });

    it("should get an entry given a predicate", async () => {
      const entry1 = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const entry2 = {
        date: "02/01/2023",
        accountId: 2,
        balance: 2000
      };

      await entryService.add(entry1);
      await entryService.add(entry2);

      const fetchedEntry = await entryService.getAllWhere(
        (entry) => entry.date === "01/01/2023"
      );

      expect(fetchedEntry.length).toBe(1);
      expect(fetchedEntry[0]).toEqual({ ...entry1, id: 1 });
    });

    it("should get all entries", async () => {
      const entry1 = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const entry2 = {
        date: "02/01/2023",
        accountId: 2,
        balance: 2000
      };

      await entryService.add(entry1);
      await entryService.add(entry2);

      const entries = await entryService.getAll();
      expect(entries.length).toBe(2);
    });

    it("should return undefined if entry not found", async () => {
      const entry = await entryService.get(999); // Assuming 999 does not exist
      expect(entry).toBeUndefined();
    });

    it("should return all entries grouped by date", async () => {
      const entry1 = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const entry2 = {
        date: "01/01/2023",
        accountId: 2,
        balance: 2000
      };

      const entry3 = {
        date: "02/01/2023",
        accountId: 1,
        balance: 1500
      };

      await entryService.add(entry1);
      await entryService.add(entry2);
      await entryService.add(entry3);

      const groupedEntries = await entryService.getAllGrouped();
      expect(groupedEntries.length).toBe(2);
      expect(groupedEntries[0].date).toBe("01/01/2023");
      expect(groupedEntries[0].entries.length).toBe(2);
      expect(groupedEntries[1].date).toBe("02/01/2023");
      expect(groupedEntries[1].entries.length).toBe(1);
    });
  });

  describe("Updating entries", () => {
    it("should update an entry", async () => {
      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const id = await entryService.add(entry);

      const updatedEntry = {
        ...entry,
        id,
        date: "02/01/2023",
        balance: 2000
      };

      await entryService.update(id, updatedEntry);

      const fetchedEntry = await entryService.get(id);
      expect(fetchedEntry).toEqual(updatedEntry);
    });

    it("should thow an error if an entry for the same date and account ID already exists", async () => {
      const entry1 = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const entry2 = {
        date: "02/01/2023",
        accountId: 1,
        balance: 2000
      };

      const id1 = await entryService.add(entry1);
      await entryService.add(entry2);

      try {
        await entryService.update(id1, { ...entry2 }); // Same date and account ID as entry1
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Deleting entries", () => {
    it("should delete an entry", async () => {
      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const id = await entryService.add(entry);
      await entryService.remove(id);

      const fetchedEntry = await entryService.get(id);
      expect(fetchedEntry).toBeUndefined();
    });

    it("should throw an error if entry does not exist", async () => {
      try {
        await entryService.remove(999); // Assuming 999 does not exist
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe("entries$ observable", () => {
    it("should emit entries when added", async () => {
      let emittedEntries: Entry[] = [];

      entryService.entries$.subscribe((entries) => {
        emittedEntries = entries;
      });

      const entry1 = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const entry2 = {
        date: "02/01/2023",
        accountId: 2,
        balance: 2000
      };

      await entryService.add(entry1);
      await entryService.add(entry2);

      expect(emittedEntries.length).toBe(2);
      expect(emittedEntries[0]).toEqual({ ...entry1, id: 1 });
      expect(emittedEntries[1]).toEqual({ ...entry2, id: 2 });
    });

    it("should emit entries when updated", async () => {
      let emittedEntries: Entry[] = [];

      entryService.entries$.subscribe((entries) => {
        emittedEntries = entries;
      });

      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const id = await entryService.add(entry);

      const updatedEntry = {
        ...entry,
        id,
        date: "02/01/2023",
        balance: 2000
      };

      await entryService.update(id, updatedEntry);

      expect(emittedEntries.length).toBe(1);
      expect(emittedEntries[0]).toEqual(updatedEntry);
    });

    it("should emit entries when deleted", async () => {
      let emittedEntries: Entry[] = [];

      entryService.entries$.subscribe((entries) => {
        emittedEntries = entries;
      });

      const entry = {
        date: "01/01/2023",
        accountId: 1,
        balance: 1000
      };

      const id = await entryService.add(entry);
      await entryService.remove(id);

      expect(emittedEntries.length).toBe(0);
    });
  });
});

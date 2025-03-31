import { TestBed } from "@angular/core/testing";
import { AccountCategory } from "../models/account-category.model";
import { Account } from "../models/account.model";
import { AccountCategoryService } from "./account-category.service";
import { AccountService } from "./account.service";

describe("AccountService", () => {
  let accountService: AccountService;
  let accountCategoryService: AccountCategoryService;

  beforeEach(async () => {
    await indexedDB.deleteDatabase("VectorCashDB");

    TestBed.configureTestingModule({
      providers: [AccountService, AccountCategoryService]
    });

    // Get the services
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
  });

  it("should be created", () => {
    expect(accountService).toBeTruthy();
  });

  describe("Adding accounts", () => {
    it("should add an account with default values if they're not provided", async () => {
      const account = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const id = await accountService.add(account);

      const addedAccount = await accountService.get(id);

      expect(addedAccount).toBeTruthy();
      expect(addedAccount?.isActive).toBe(true);
    });

    it("should add an account with provided optional values", async () => {
      const account = {
        name: "Chase Savings",
        categoryId: 2, // Assuming this ID exists in the database
        isActive: false
      };

      const id = await accountService.add(account);

      const addedAccount = await accountService.get(id);

      expect(addedAccount).toBeTruthy();
      expect(addedAccount?.isActive).toBe(false);
    });

    it("should not add accounts with the same name in the same category", async () => {
      const account = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      await accountService.add(account);

      try {
        await accountService.add(account);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });

    it("should not add an account with an empty name", async () => {
      const account = {
        name: "",
        categoryId: 1 // Assuming this ID exists in the database
      };

      try {
        await accountService.add(account);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });

    it("should not add an account with a non-existent categoryId", async () => {
      const account = {
        name: "Non-existent Category",
        categoryId: 999 // Assuming this ID does not exist in the database
      };

      try {
        await accountService.add(account);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Retrieving accounts", () => {
    it("should retrieve an account by ID", async () => {
      const account = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const id = await accountService.add(account);

      const retrievedAccount = await accountService.get(id);

      expect(retrievedAccount).toBeTruthy();
      expect(retrievedAccount?.name).toEqual("Chase Checking");
    });

    it("should retrieve all accounts", async () => {
      const account1 = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const account2 = {
        name: "Chase Savings",
        categoryId: 2 // Assuming this ID exists in the database
      };

      await accountService.add(account1);
      await accountService.add(account2);

      const accounts = await accountService.getAll();

      expect(accounts.length).toBe(2);
      expect(accounts[0].name).toEqual("Chase Checking");
      expect(accounts[1].name).toEqual("Chase Savings");
    });

    it("should add accounts and emit them through accounts$ observable", async () => {
      let emittedAccounts: Account[] = [];

      accountService.accounts$.subscribe((accounts) => {
        emittedAccounts = accounts;
      });

      const account1 = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const account2 = {
        name: "Chase Savings",
        categoryId: 2 // Assuming this ID exists in the database
      };

      await accountService.add(account1);
      await accountService.add(account2);

      expect(emittedAccounts.length).toBe(2);
      expect(emittedAccounts[0].name).toEqual("Chase Checking");
      expect(emittedAccounts[1].name).toEqual("Chase Savings");
    });
  });

  describe("Updating accounts", () => {
    it("should update an account", async () => {
      const account = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const id = await accountService.add(account);

      const updatedAccount = {
        ...account,
        name: "Updated Chase Checking"
      };

      await accountService.update(id, updatedAccount);

      const retrievedAccount = await accountService.get(id);

      expect(retrievedAccount).toBeTruthy();
      expect(retrievedAccount?.name).toEqual("Updated Chase Checking");
    });

    it("should throw an error when attempting to update an account with an invalid ID", async () => {
      const account = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const id = await accountService.add(account);

      const updatedAccount = {
        ...account,
        name: "Updated Chase Checking"
      };

      try {
        await accountService.update(999, updatedAccount);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });

    it("should throw an error when attempting to update an account with a non-existent categoryId", async () => {
      const account = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const id = await accountService.add(account);

      const updatedAccount = {
        ...account,
        name: "Updated Chase Checking",
        categoryId: 999 // Assuming this ID does not exist in the database
      };

      try {
        await accountService.update(id, updatedAccount);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });

    it("should throw an error when attempting to set the isActive property of an account to true for an inactive category", async () => {
      const accountCategory: AccountCategory = {
        name: "Inactive Category",
        type: "Asset",
        isActive: false
      };

      const categoryId = await accountCategoryService.add(accountCategory);

      const account = {
        name: "Chase Checking",
        categoryId: categoryId // Assuming this ID exists in the database
      };

      const id = await accountService.add(account);

      const updatedAccount = {
        ...account,
        name: "Updated Chase Checking",
        isActive: true
      };

      try {
        await accountService.update(id, updatedAccount);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Deactivating accounts", () => {
    it("should deactivate an account", async () => {
      const account = {
        name: "Chase Checking",
        categoryId: 1 // Assuming this ID exists in the database
      };

      const id = await accountService.add(account);

      const addedAccount = await accountService.get(id);

      expect(addedAccount).toBeTruthy();
      expect(addedAccount?.isActive).toBe(true);

      await accountService.deactivate(id);

      const deactivatedAccount = await accountService.get(id);

      expect(deactivatedAccount).toBeTruthy();
      expect(deactivatedAccount?.isActive).toBe(false);
    });
  });

  describe("accounts$ observable", () => {
    it("should emit accounts when they are added", (done) => {
      let emittedAccounts: Account[] = [];

      accountService.accounts$.subscribe((accounts) => {
        emittedAccounts = accounts;
      });

      const account = {
        name: "Chase Checking",
        categoryId: 1
      };

      accountService.add(account).then(() => {
        expect(emittedAccounts.length).toBe(1);
        expect(emittedAccounts[0].name).toEqual("Chase Checking");
        done();
      });
    });

    it("should emit accounts when they are updated", (done) => {
      let emittedAccounts: Account[] = [];

      accountService.accounts$.subscribe((accounts) => {
        emittedAccounts = accounts;
      });

      const account = {
        name: "Chase Checking",
        categoryId: 1
      };

      accountService.add(account).then(async (id) => {
        const updatedAccount = {
          ...account,
          name: "Updated Chase Checking"
        };

        await accountService.update(id, updatedAccount);

        expect(emittedAccounts.length).toBe(1);
        expect(emittedAccounts[0].name).toEqual("Updated Chase Checking");
        done();
      });
    });

    it("should emit accounts when they are deactivated", (done) => {
      let emittedAccounts: Account[] = [];

      accountService.accounts$.subscribe((accounts) => {
        emittedAccounts = accounts;
      });

      const account = {
        name: "Chase Checking",
        categoryId: 1
      };

      accountService.add(account).then(async (id) => {
        await accountService.deactivate(id);

        expect(emittedAccounts.length).toBe(1);
        expect(emittedAccounts[0].isActive).toBe(false);
        done();
      });
    });
  });
});

import { TestBed } from "@angular/core/testing";
import { AccountCategory } from "../models/account-category.model";
import { AccountCategoryService } from "./account-category.service";
import { AccountService } from "./account.service";

describe("AccountCategoryService", () => {
  let accountCategoryService: AccountCategoryService;
  let accountService: AccountService;

  beforeEach(async () => {
    await indexedDB.deleteDatabase("VectorCashDB");

    TestBed.configureTestingModule({
      providers: [AccountCategoryService, AccountService]
    });

    accountCategoryService = TestBed.inject(AccountCategoryService);
    accountService = TestBed.inject(AccountService);
  });

  it("should be created", () => {
    expect(accountCategoryService).toBeTruthy();
  });

  describe("Adding account categories", () => {
    it("should add an account category with default values if they're not provided", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.isActive).toBe(true);
      expect(addedCategory?.description).toBe("");
    });

    it("should add an account category with provided optional values", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset",
        isActive: false,
        description: "My checking account"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.isActive).toBe(false);
      expect(addedCategory?.description).toBe("My checking account");
    });

    it("should not add account categories with the same name", async () => {
      const accountCategory: AccountCategory = {
        name: "Credit Card",
        type: "Liability"
      };

      await accountCategoryService.add(accountCategory);

      try {
        await accountCategoryService.add(accountCategory);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });

    it("should not add an account category with an empty name", async () => {
      const accountCategory: AccountCategory = {
        name: "",
        type: "Liability"
      };

      try {
        await accountCategoryService.add(accountCategory);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Retrieving account categories", () => {
    it("should get an account category by ID", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.name).toBe("Checking");
      expect(addedCategory?.type).toBe("Asset");
      expect(addedCategory?.isActive).toBe(true);
      expect(addedCategory?.description).toBe("");
    });

    it("should get all account categories", async () => {
      const accountCategory1: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const accountCategory2: AccountCategory = {
        name: "Credit Card",
        type: "Liability"
      };

      await accountCategoryService.add(accountCategory1);
      await accountCategoryService.add(accountCategory2);

      const categories = await accountCategoryService.getAll();

      expect(categories.length).toBe(2);
    });
  });

  describe("Updating account categories", () => {
    it("should update an account category", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.name).toBe("Checking");

      addedCategory!.name = "Savings";

      await accountCategoryService.update(id, addedCategory!);

      const updatedCategory = await accountCategoryService.get(id);

      expect(updatedCategory).toBeTruthy();
      expect(updatedCategory?.name).toBe("Savings");
    });

    it("should update an account category with provided optional values", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.isActive).toBe(true);
      expect(addedCategory?.description).toBe("");

      addedCategory!.isActive = false;
      addedCategory!.description = "My checking account";

      await accountCategoryService.update(id, addedCategory!);

      const updatedCategory = await accountCategoryService.get(id);

      expect(updatedCategory).toBeTruthy();
      expect(updatedCategory?.isActive).toBe(false);
      expect(updatedCategory?.description).toBe("My checking account");
    });
  });

  describe("Deactivating account categories", () => {
    it("should deactivate an account category", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.isActive).toBe(true);

      await accountCategoryService.deactivate(id);

      const deactivatedCategory = await accountCategoryService.get(id);

      expect(deactivatedCategory).toBeTruthy();
      expect(deactivatedCategory?.isActive).toBe(false);
    });

    it("should deactivate an account category with no active accounts", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      await accountCategoryService.deactivate(id);

      const deactivatedCategory = await accountCategoryService.get(id);

      expect(deactivatedCategory).toBeTruthy();
      expect(deactivatedCategory?.isActive).toBe(false);
    });

    it("should not deactivate an account category with active accounts", async () => {
      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      await accountService.add({
        name: "Chase Checking",
        categoryId: id
      });

      try {
        await accountCategoryService.deactivate(id);
      } catch (error: any) {
        // Expect an error
        expect(error).toBeTruthy();
      }
    });
  });

  describe("accountCategories$ observable", () => {
    it("should emit the latest account categories when a new category is added", async () => {
      let emittedCategories: AccountCategory[] = [];

      accountCategoryService.accountCategories$.subscribe((categories) => {
        emittedCategories = categories;
      });

      const accountCategory1: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const accountCategory2: AccountCategory = {
        name: "Credit Card",
        type: "Liability"
      };

      await accountCategoryService.add(accountCategory1);
      await accountCategoryService.add(accountCategory2);

      expect(emittedCategories.length).toBe(2);
    });

    it("should emit the latest account categories when a category is updated", async () => {
      let emittedCategories: AccountCategory[] = [];

      accountCategoryService.accountCategories$.subscribe((categories) => {
        emittedCategories = categories;
      });

      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.name).toBe("Checking");

      addedCategory!.name = "Savings";

      await accountCategoryService.update(id, addedCategory!);

      expect(emittedCategories.length).toBe(1);
      expect(emittedCategories[0].name).toBe("Savings");
    });

    it("should emit the latest account categories when a category is deactivated", async () => {
      let emittedCategories: AccountCategory[] = [];

      accountCategoryService.accountCategories$.subscribe((categories) => {
        emittedCategories = categories;
      });

      const accountCategory: AccountCategory = {
        name: "Checking",
        type: "Asset"
      };

      const id = await accountCategoryService.add(accountCategory);

      const addedCategory = await accountCategoryService.get(id);

      expect(addedCategory).toBeTruthy();
      expect(addedCategory?.isActive).toBe(true);

      await accountCategoryService.deactivate(id);

      expect(emittedCategories.length).toBe(1);
      expect(emittedCategories[0].isActive).toBe(false);
    });
  });
});

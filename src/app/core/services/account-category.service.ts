import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AccountCategory } from "../models/account-category.model";
import { DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root"
})
export class AccountCategoryService {
  private accountCategoriesSubject = new BehaviorSubject<AccountCategory[]>([]);
  public accountCategories$ = this.accountCategoriesSubject.asObservable();

  constructor(private databaseService: DatabaseService) {
    this.loadCategories();
  }

  private async loadCategories() {
    const categories = await this.databaseService.accountCategories.toArray();
    this.accountCategoriesSubject.next(categories);
  }

  private validateCategory(
    accountCategory: AccountCategory,
    requireId: boolean = false
  ) {
    // Set default values
    if (accountCategory.isActive === undefined) {
      accountCategory.isActive = true;
    }

    if (accountCategory.description === undefined) {
      accountCategory.description = "";
    }

    // Data validation
    if (requireId && !accountCategory.id) {
      throw new Error("Account category ID is required for update.");
    }

    if (!accountCategory.name || accountCategory.name.trim() === "") {
      throw new Error("Account category name cannot be empty.");
    }
  }

  async add(accountCategory: AccountCategory): Promise<number> {
    this.validateCategory(accountCategory);

    const id =
      await this.databaseService.accountCategories.add(accountCategory);
    await this.loadCategories();

    return id;
  }

  async get(id: number): Promise<AccountCategory | undefined> {
    return await this.databaseService.accountCategories.get(id);
  }

  async getAll(): Promise<AccountCategory[]> {
    return await this.databaseService.accountCategories.toArray();
  }

  async getAllWhere(
    predicate: (category: AccountCategory) => boolean
  ): Promise<AccountCategory[]> {
    const accountCategories =
      await this.databaseService.accountCategories.toArray();

    return accountCategories.filter(predicate);
  }

  async update(
    accountCategoryId: number,
    accountCategory: Partial<AccountCategory>
  ): Promise<number> {
    const existingCategory =
      await this.databaseService.accountCategories.get(accountCategoryId);

    if (!existingCategory) {
      throw new Error("Account category does not exist.");
    }

    const updatedCategory = {
      ...existingCategory,
      ...accountCategory
    };

    this.validateCategory(updatedCategory, true);

    const updatedId = await this.databaseService.accountCategories.update(
      accountCategoryId,
      updatedCategory
    );

    await this.loadCategories();

    return updatedId;
  }

  async deactivate(id: number) {
    // Check if any active accounts are pointing to this category using the categoryId FK
    const accountsInCategory = await this.databaseService.accounts
      .where("categoryId")
      .equals(id)
      .and((account) => account.isActive === true)
      .toArray();

    if (accountsInCategory.length > 0) {
      throw new Error("Cannot remove a category that has active accounts");
    }

    await this.databaseService.accountCategories.update(id, {
      isActive: false
    });

    await this.loadCategories();
  }
}

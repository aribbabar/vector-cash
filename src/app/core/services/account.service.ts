import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Account } from "../models/account.model";
import { DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root"
})
export class AccountService {
  private accounts = new BehaviorSubject<Account[]>([]);
  public accounts$ = this.accounts.asObservable();

  constructor(private databaseService: DatabaseService) {
    this.loadAccounts();
  }

  private async loadAccounts() {
    const accounts = await this.databaseService.accounts.toArray();
    this.accounts.next(accounts);
  }

  private validateAccount(account: Account, requireId: boolean = false) {
    // Set default value
    if (account.isActive === undefined) {
      account.isActive = true;
    }

    // Data validation
    if (requireId && !account.id) {
      throw new Error("Account ID is required for update.");
    }

    if (!account.name || account.name.trim() === "") {
      throw new Error("Account name cannot be empty.");
    }

    if (!account.categoryId) {
      throw new Error("Category ID is required.");
    }
  }

  async add(account: Account): Promise<number> {
    this.validateAccount(account);

    // Check if a deactivated account with the same name already exists
    const existingAccount = await this.databaseService.accounts
      .where("name")
      .equalsIgnoreCase(account.name)
      .first();

    if (existingAccount && !existingAccount.isActive) {
      // Reactivate the existing account
      await this.databaseService.accounts.update(existingAccount.id!, {
        isActive: true,
        ...account
      });
      await this.loadAccounts();
      return existingAccount.id!;
    }

    const id = await this.databaseService.accounts.add(account);
    await this.loadAccounts();

    return id;
  }

  async get(id: number): Promise<Account | undefined> {
    return await this.databaseService.accounts.get(id);
  }

  async getAll(): Promise<Account[]> {
    return await this.databaseService.accounts.toArray();
  }

  async getAllWhere(
    predicate: (account: Account) => boolean
  ): Promise<Account[]> {
    const accounts = await this.databaseService.accounts.toArray();
    return accounts.filter(predicate);
  }

  async update(accountId: number, account: Partial<Account>): Promise<number> {
    const existingAccount = await this.databaseService.accounts.get(accountId);

    if (!existingAccount) {
      throw new Error(`Account with ID ${accountId} not found.`);
    }

    // If setting isActive to true, check if the category exists and is active
    if (account.isActive) {
      const category = await this.databaseService.accountCategories.get(
        existingAccount.categoryId!
      );
      if (!category || !category.isActive) {
        throw new Error(
          `Cannot activate account. Category: ${category?.name} is not active.`
        );
      }
    }

    const updatedAccount: Account = {
      ...existingAccount,
      ...account
    };

    this.validateAccount(updatedAccount, true);

    const updatedId = await this.databaseService.accounts.update(
      updatedAccount.id!,
      updatedAccount
    );

    await this.loadAccounts();

    return updatedId;
  }

  async deactivate(id: number) {
    await this.databaseService.accounts.update(id, {
      isActive: false
    });

    await this.loadAccounts();
  }
}

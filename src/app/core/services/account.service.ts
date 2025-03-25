import { Injectable } from '@angular/core';
import { Account } from '../models/account.model';
import { GlobalEvents } from '../utils/global-events';
import { AccountCategoryService } from './account-category.service';
import { DatabaseService } from './database.service';
import { GlobalEventService } from './global-event.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  constructor(
    private databaseService: DatabaseService,
    private accountCategoryService: AccountCategoryService,
    private globalEventService: GlobalEventService
  ) {}

  async addAccount(account: Account) {
    await this.databaseService.accounts.add(account);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ACCOUNTS);
  }

  /**
   *
   * @returns All accounts in alphabetical order
   */
  async getAccounts(): Promise<Account[]> {
    return await this.databaseService.accounts.orderBy('name').toArray();
  }

  /**
   *
   * @returns All active accounts
   */
  async getActiveAccounts(): Promise<Account[]> {
    const accounts = await this.databaseService.accounts.toArray();
    return accounts.filter((account) => account.isActive);
  }

  /**
   *
   * @returns All inactive accounts
   */
  async getInactiveAccounts(): Promise<Account[]> {
    const accounts = await this.databaseService.accounts.toArray();
    return accounts.filter((account) => !account.isActive);
  }

  async getAccount(id: number): Promise<Account> {
    const account = await this.databaseService.accounts.get(id);

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  /**
   *
   * @param categoryId Category ID
   * @returns If there are active accounts in the category
   */
  async hasActiveAccountsInCategory(categoryId: number): Promise<boolean> {
    const accounts = await this.databaseService.accounts
      .where('categoryId')
      .equals(categoryId)
      .toArray();
    return accounts.some((account) => account.isActive);
  }

  async updateAccount(account: Account) {
    await this.databaseService.accounts.update(account.id!, account);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ACCOUNTS);
  }

  async deactivateAccount(id: number) {
    const account = await this.getAccount(id);
    account.isActive = false;
    await this.updateAccount(account);
  }

  async restoreAccount(id: number) {
    const account = await this.getAccount(id);
    const accountCategory =
      await this.accountCategoryService.getAccountCategory(account.categoryId);

    if (accountCategory && !accountCategory.isActive) {
      throw new Error('Cannot restore account because category is inactive');
    }

    account.isActive = true;
    await this.updateAccount(account);
  }

  async deleteAllAccounts() {
    await this.databaseService.accounts.clear();
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ACCOUNTS);
  }
}

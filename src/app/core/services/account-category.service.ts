import { Injectable } from '@angular/core';
import { AccountCategory } from '../models/account-category.model';
import { GlobalEvents } from '../utils/global-events';
import db from './database.service';
import { GlobalEventService } from './global-event.service';

@Injectable({
  providedIn: 'root'
})
export class AccountCategoryService {
  constructor(private globalEventService: GlobalEventService) {}

  /**
   * Adds a new account category to the database.
   *
   * @param {AccountCategory} accountCategory - The account category to be added.
   * @throws {Error} If an account category with the same name already exists.
   * @returns {Promise<void>} A promise that resolves when the account category has been added.
   */
  async addAccountCategory(accountCategory: AccountCategory) {
    if (
      (await db.accountCategories
        .where('name')
        .equals(accountCategory.name)
        .count()) > 0
    ) {
      throw new Error('An account category with this name already exists');
    }

    await db.accountCategories.add(accountCategory);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_CATEGORIES);
  }

  async getAccountCategory(id: number): Promise<AccountCategory | undefined> {
    return await db.accountCategories.get(id);
  }

  async getAccountCategories(): Promise<AccountCategory[]> {
    return await db.accountCategories.toArray();
  }

  async getActiveAccountCategories(): Promise<AccountCategory[]> {
    return await db.accountCategories
      .filter((category) => category.isActive === true)
      .toArray();
  }

  async getLiabilityAccountCategories(): Promise<AccountCategory[]> {
    return await db.accountCategories
      .where('type')
      .equals('Liability')
      .toArray();
  }

  async updateAccountCategory(accountCategory: AccountCategory) {
    if (!accountCategory.id) {
      throw new Error('Cannot update an account category without an ID');
    }

    await db.accountCategories.update(accountCategory.id, accountCategory);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_CATEGORIES);
  }

  async setAccountCategoryActiveStatus(id: number, isActive: boolean) {
    await db.accountCategories.update(id, { isActive });
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_CATEGORIES);
  }

  async deleteAccountCategory(id: number) {
    await db.accountCategories.delete(id);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_CATEGORIES);
  }
}

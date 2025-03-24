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

  async addAccountCategory(accountCategory: AccountCategory) {
    await db.accountCategories.add(accountCategory);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_CATEGORIES);
  }

  async getAccountCategory(id: number): Promise<AccountCategory | undefined> {
    return await db.accountCategories.get(id);
  }

  async getAccountCategories(): Promise<AccountCategory[]> {
    return await db.accountCategories.toArray();
  }

  async getAssetAccountCategories(): Promise<AccountCategory[]> {
    return await db.accountCategories.where('type').equals('Asset').toArray();
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

  async deleteAccountCategory(id: number) {
    await db.accountCategories.delete(id);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_CATEGORIES);
  }
}

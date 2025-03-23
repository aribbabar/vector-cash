import { Injectable } from '@angular/core';
import { AccountCategory } from '../models/account-category.model';
import db from './database.service';

@Injectable({
  providedIn: 'root'
})
export class AccountCategoryService {
  async addAccountCategory(accountCategory: AccountCategory) {
    return await db.accountCategories.add(accountCategory);
  }

  async getAccountCategory(id: number): Promise<AccountCategory | undefined> {
    return await db.accountCategories.get(id);
  }

  async getAccountCategories(): Promise<AccountCategory[]> {
    return await db.accountCategories.toArray();
  }

  async updateAccountCategory(accountCategory: AccountCategory) {
    if (!accountCategory.id) {
      throw new Error('Cannot update an account category without an ID');
    }

    return await db.accountCategories.update(
      accountCategory.id,
      accountCategory
    );
  }

  async deleteAccountCategory(id: number) {
    return await db.accountCategories.delete(id);
  }
}

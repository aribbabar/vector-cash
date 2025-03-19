import { Injectable } from '@angular/core';
import { AccountCategory } from '../models/account-category.model';
import db from './database.service';

@Injectable({
  providedIn: 'root'
})
export class AccountCategoryService {
  async addCategory(category: AccountCategory) {
    return await db.accountCategories.add(category);
  }

  async getCategories(): Promise<AccountCategory[]> {
    return await db.accountCategories.toArray();
  }
}

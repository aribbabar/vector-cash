import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { AccountCategory } from '../models/account-category.model';
import { Account } from '../models/account.model';
import { Entry } from '../models/entry.model';
import { SeedDataGenerator } from '../utils/seed-data-generator';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  accounts!: Table<Account, number>;
  accountCategories!: Table<AccountCategory, number>;
  entries!: Table<Entry, number>;

  constructor() {
    super('VectorCashDB');
    this.version(1).stores({
      accountCategories: '++id, name, type, description, isActive',
      accounts: '++id, name, categoryId, isActive',
      entries: '++id, date, accountId, balance'
    });

    // Map tables to classes
    this.accountCategories.mapToClass(AccountCategory);
    this.accounts.mapToClass(Account);
    this.entries.mapToClass(Entry);

    // this.seedDatabase();
  }

  async seedDatabase() {
    if ((await this.accountCategories.count()) === 0) {
      await this.seedAccountCategories();
    }

    if ((await this.accounts.count()) === 0) {
      await this.seedAccounts();
    }

    if ((await this.entries.count()) === 0) {
      await this.seedEntries();
    }
  }

  private async seedAccountCategories() {
    const categories = SeedDataGenerator.generateAccountCategories();
    await this.accountCategories.bulkAdd(categories);
  }

  private async seedAccounts() {
    const accounts = SeedDataGenerator.generateAccounts();
    await this.accounts.bulkAdd(accounts);
  }

  private async seedEntries() {
    const entries = SeedDataGenerator.generateEntries();
    await this.entries.bulkAdd(entries);
  }

  async deleteDatabase() {
    await this.delete();
  }
}

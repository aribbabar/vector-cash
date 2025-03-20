import Dexie, { Table } from 'dexie';
import { AccountCategory } from '../enums/account-category.enum';
import { Account } from '../models/account.model';
import { Entry } from '../models/entry.model';
import { seedData } from './seed-data';

export class VectorCashDatabase extends Dexie {
  accounts!: Table<Account, number>;
  accountCategories!: Table<AccountCategory, number>;
  entries!: Table<Entry, number>;

  constructor() {
    super('VectorCashDB');
    this.version(1).stores({
      accounts: '++id, name, category',
      entries: '++id, date, accountId, balance'
    });

    // Map tables to classes
    this.accounts.mapToClass(Account);
    this.entries.mapToClass(Entry);

    this.seedDatabase();
  }

  async seedDatabase() {
    // Only seed if the database is empty
    const accountCount = await this.accounts.count();

    if (accountCount === 0) {
      console.log('Seeding accounts with initial data...');

      // Seed accounts
      await this.seedAccounts();

      // Seed entries
      await this.seedEntries();

      console.log('Accounts seeding completed.');
    }

    const entriesCount = await this.entries.count();

    if (entriesCount === 0) {
      console.log('Seeding entries with initial data...');

      // Seed accounts
      await this.seedAccounts();

      // Seed entries
      await this.seedEntries();

      console.log('Entries seeding completed.');
    }
  }

  private async seedAccounts() {
    const sampleAccounts: Account[] = [
      {
        type: 'Checking Account',
        category: AccountCategory.ASSET,
        institutionName: 'Chase Bank'
      },
      {
        type: 'Savings Account',
        category: AccountCategory.ASSET,
        institutionName: 'Ally Bank'
      },
      {
        type: 'Credit Card',
        category: AccountCategory.LIABILITY,
        institutionName: 'American Express'
      }
    ];

    // Insert all accounts and collect their IDs
    for (const account of sampleAccounts) {
      await this.accounts.add(account);
    }
  }

  private async seedEntries() {
    const sampleEntries: Entry[] = seedData;

    // Insert all entries
    for (const entry of sampleEntries) {
      await this.entries.add(entry);
    }
  }
}

const db = new VectorCashDatabase();
export default db;

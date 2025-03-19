import Dexie, { Table } from 'dexie';
import { AccountType } from '../enums/account-type.enum';
import { AccountCategory } from '../models/account-category.model';
import { Account } from '../models/account.model';
import { Entry } from '../models/entry.model';

export class VectorCashDatabase extends Dexie {
  accounts!: Table<Account, number>;
  accountCategories!: Table<AccountCategory, number>;
  entries!: Table<Entry, number>;

  constructor() {
    super('VectorCashDB');
    this.version(1).stores({
      accounts: '++id, name, type, accountCategoryId',
      accountCategories: '++id, name',
      entries: '++id, date, accountId, balance'
    });

    this.seedDatabase();
  }

  async seedDatabase() {
    const categoryCount = await this.accountCategories.count();
    if (categoryCount === 0) {
      console.log('Seeding database...');

      const categories = await this.accountCategories.bulkAdd([
        { name: 'Checking Account' },
        { name: 'Savings Account' },
        { name: 'Credit Card' }
      ]);

      const accounts = await this.accounts.bulkAdd([
        { name: 'Chase Checking', type: AccountType.ASSET, categoryId: 1 },
        { name: 'Capital One Savings', type: AccountType.ASSET, categoryId: 2 },
        {
          name: 'Discover Credit Card',
          type: AccountType.LIABILITY,
          categoryId: 3
        }
      ]);

      const entries = await this.entries.bulkAdd([
        { date: new Date('2024-03-19'), accountId: 1, balance: 1500 },
        { date: new Date('2024-03-19'), accountId: 2, balance: 5000 },
        { date: new Date('2024-03-19'), accountId: 3, balance: -1200 },
        { date: new Date('2024-03-20'), accountId: 1, balance: 1600 },
        { date: new Date('2024-03-20'), accountId: 2, balance: 5100 },
        { date: new Date('2024-03-20'), accountId: 3, balance: -1300 },
        { date: new Date('2024-03-21'), accountId: 1, balance: 1700 },
        { date: new Date('2024-03-21'), accountId: 2, balance: 5200 },
        { date: new Date('2024-03-21'), accountId: 3, balance: -1400 },
        { date: new Date('2024-03-22'), accountId: 1, balance: 1800 },
        { date: new Date('2024-03-22'), accountId: 2, balance: 5300 },
        { date: new Date('2024-03-22'), accountId: 3, balance: -1500 }
      ]);

      console.log('Database seeding complete!');
    }
  }
}

const db = new VectorCashDatabase();
export default db;

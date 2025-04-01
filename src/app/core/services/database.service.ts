import { Injectable } from "@angular/core";
import Dexie, { Table } from "dexie";
import { AccountCategory } from "../models/account-category.model";
import { Account } from "../models/account.model";
import { Entry } from "../models/entry.model";
import { SeedDataGenerator } from "../utils/seed-data-generator";

@Injectable({
  providedIn: "root"
})
export class DatabaseService extends Dexie {
  accounts!: Table<Account, number>;
  accountCategories!: Table<AccountCategory, number>;
  entries!: Table<Entry, number>;

  constructor() {
    super("VectorCashDB");
    this.version(1).stores({
      accountCategories: "++id, &name, type, description, isActive",
      accounts: "++id, &name, categoryId, isActive",
      entries: "++id, date, accountId, balance"
    });

    // Check if the database has been seeded before
    if (window.localStorage.getItem("isSeeded") !== "true") {
      this.seedDatabase2().then(() => {
        window.location.reload();
      });
      window.localStorage.setItem("isSeeded", "true");
    }

    // this.seedDatabase1();
    // this.seedDatabase2();
  }

  async seedDatabase1() {
    if ((await this.accountCategories.count()) === 0) {
      const categories = SeedDataGenerator.generateAccountCategories1();
      await this.accountCategories.bulkAdd(categories);
    }

    if ((await this.accounts.count()) === 0) {
      const accounts = SeedDataGenerator.generateAccounts1();
      await this.accounts.bulkAdd(accounts);
    }

    if ((await this.entries.count()) === 0) {
      const entries = SeedDataGenerator.generateEntries1();
      await this.entries.bulkAdd(entries);
    }
  }

  async seedDatabase2() {
    if ((await this.accountCategories.count()) === 0) {
      const categories = SeedDataGenerator.generateAccountCategories2();
      await this.accountCategories.bulkAdd(categories);
    }

    if ((await this.accounts.count()) === 0) {
      const accounts = SeedDataGenerator.generateAccounts2();
      await this.accounts.bulkAdd(accounts);
    }

    if ((await this.entries.count()) === 0) {
      const entries = SeedDataGenerator.generateEntries2();
      await this.entries.bulkAdd(entries);
    }
  }

  async deleteDatabase() {
    await this.delete();
    await this.open();
  }
}

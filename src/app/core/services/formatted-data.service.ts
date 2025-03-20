import { Injectable } from '@angular/core';
import { AccountCategory } from '../enums/account-category.enum';
import { AccountService } from './account.service';
import { EntryService } from './entry.service';

export interface FormattedEntry {
  date: Date;
  accounts: { accountId: number; account: string; balance: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class FormattedDataService {
  constructor(
    private entryService: EntryService,
    private accountService: AccountService
  ) {}

  // Function to group entries by unique dates with a list of accounts and their balances.
  async getEntriesByDate(): Promise<FormattedEntry[]> {
    const entries = await this.entryService.getEntries();
    const result: FormattedEntry[] = [];

    for (const entry of entries) {
      const date = entry.date;
      const accountId = entry.accountId;
      const account = await this.accountService.getAccount(accountId);
      const balance = entry.balance;

      const existingEntry = result.find(
        (e) => e.date.toDateString() === date.toDateString()
      );

      if (existingEntry) {
        const existingAccount = existingEntry.accounts.find(
          (a) => a.account === account.toString()
        );

        if (!existingAccount) {
          existingEntry.accounts.push({
            accountId: account.id!,
            account: account.toString(),
            balance
          });
        }
      } else {
        result.push({
          date,
          accounts: [
            { accountId: account.id!, account: account.toString(), balance }
          ]
        });
      }
    }

    return result;
  }

  async getCurrentNetWorth(): Promise<{
    assets: number;
    liabilities: number;
    netWorth: number;
  }> {
    const entries = await this.getEntriesByDate();
    const latestEntry = entries.reduce((latest, current) => {
      return current.date > latest.date ? current : latest;
    }, entries[0]);

    const assets = await latestEntry.accounts.reduce(
      async (totalPromise, account) => {
        const total = await totalPromise;
        const accountDetails = await this.accountService.getAccount(
          account.accountId
        );
        return accountDetails.category === AccountCategory.ASSET
          ? total + account.balance
          : total;
      },
      Promise.resolve(0)
    );

    const liabilities = await latestEntry.accounts.reduce(
      async (totalPromise, account) => {
        const total = await totalPromise;
        const accountDetails = await this.accountService.getAccount(
          account.accountId
        );
        return accountDetails.category === AccountCategory.LIABILITY
          ? total + account.balance
          : total;
      },
      Promise.resolve(0)
    );

    const netWorth = assets - liabilities;

    return { assets, liabilities, netWorth };
  }

  // Returns the total assets, liabilities, and net worth for each unique date.
  async getNetWorthOverTime(): Promise<
    {
      date: Date;
      assets: number;
      liabilities: number;
      netWorth: number;
    }[]
  > {
    const entries = await this.getEntriesByDate();
    const result: {
      date: Date;
      assets: number;
      liabilities: number;
      netWorth: number;
    }[] = [];

    for (const entry of entries) {
      const assets = await entry.accounts.reduce(
        async (totalPromise, account) => {
          const total = await totalPromise;
          const accountDetails = await this.accountService.getAccount(
            account.accountId
          );
          return accountDetails.category === AccountCategory.ASSET
            ? total + account.balance
            : total;
        },
        Promise.resolve(0)
      );

      const liabilities = await entry.accounts.reduce(
        async (totalPromise, account) => {
          const total = await totalPromise;
          const accountDetails = await this.accountService.getAccount(
            account.accountId
          );
          return accountDetails.category === AccountCategory.LIABILITY
            ? total + account.balance
            : total;
        },
        Promise.resolve(0)
      );

      const netWorth = assets - liabilities;

      result.push({
        date: entry.date,
        assets,
        liabilities,
        netWorth
      });
    }

    return result;
  }
}

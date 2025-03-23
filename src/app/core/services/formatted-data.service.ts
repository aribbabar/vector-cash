import { Injectable } from '@angular/core';
import { AccountService } from './account.service';
import { EntryService } from './entry.service';

export interface FormattedAccount {
  id: number;
  name: string; // e.g, "Chase Checking", "Discover it", "Fidelity Brokerage"
  type: 'Asset' | 'Liability';
  categoryId: number; // FK to AccountCategory
  balance: number;
}

export interface FormattedEntry {
  date: string;
  accounts: FormattedAccount[]; // Changed from 'account' to 'accounts' to better reflect it's an array
}

@Injectable({
  providedIn: 'root'
})
export class FormattedDataService {
  constructor(
    private entryService: EntryService,
    private accountService: AccountService
  ) {}

  // Returns an array of accounts for each unique date
  async getFormattedEntries(): Promise<FormattedEntry[]> {
    const formattedEntries: FormattedEntry[] = [];
    const entries = await this.entryService.getEntries();
    const accounts = await this.accountService.getAccounts();

    // Get unique dates
    const uniqueDates = [...new Set(entries.map((entry) => entry.date))];

    // Create a formatted entry for each unique date
    uniqueDates.forEach((date) => {
      const accountsForDate = entries
        .filter((entry) => entry.date === date)
        .map((entry) => {
          const account = accounts.find(
            (account) => account.id === entry.accountId
          ) as FormattedAccount;

          if (!account) {
            throw new Error('Account not found');
          }

          return {
            ...account,
            balance: entry.balance
          };
        });

      formattedEntries.push({
        date,
        accounts: accountsForDate // Updated to match the interface property name
      });
    });

    return formattedEntries;
  }

  /**
   *
   * @param date Date is formatted as 'MM/DD/YYYY'
   */
  async deleteFormattedEntries(date: string): Promise<void> {
    await this.entryService.deleteEntries(date);
  }
}

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

  // Returns an array of accounts that are active for each unique date
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
          );

          if (!account) {
            console.error(
              `Account not found for entry with accountId: ${entry.accountId}`
            );
            return null;
          }

          // Create a properly formatted account with balance
          return {
            id: account.id!,
            name: account.name,
            type: account.type,
            categoryId: account.categoryId,
            balance: entry.balance
          } as FormattedAccount;
        })
        .filter((account): account is FormattedAccount => account !== null); // Remove null accounts

      formattedEntries.push({
        date,
        accounts: accountsForDate
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

  /**
   *
   * @returns An array of formatted active accounts with their balances
   */
  async getFormattedAccounts(): Promise<FormattedAccount[]> {
    const accounts = await this.accountService.getAccounts();

    // Filter out inactive accounts first
    const activeAccounts = accounts.filter((account) => account.isActive);

    // Create an array of promises for each active account's balance
    const accountPromises = activeAccounts.map(async (account) => {
      const balance = await this.entryService.getAccountBalance(account.id!);

      return {
        id: account.id!,
        name: account.name,
        type: account.type,
        categoryId: account.categoryId,
        balance: balance
      } as FormattedAccount;
    });

    // Wait for all balance promises to resolve
    return Promise.all(accountPromises);
  }

  /**
   * Sets the isActive property of an account to false
   * @param account Formatted account to delete
   */
  async deleteFormattedAccount(account: FormattedAccount): Promise<void> {
    try {
      // Get the original account first (to preserve all properties)
      const originalAccount = await this.accountService.getAccount(account.id);

      if (!originalAccount) {
        throw new Error(`Account with ID ${account.id} not found`);
      }

      // Set isActive to false (soft delete)
      originalAccount.isActive = false;

      // Update the account in the database
      await this.accountService.updateAccount(originalAccount);

      // Optionally, you could also handle related entries here if needed
      // For example, you might want to mark entries related to this account
      // or perform other cleanup operations
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error; // Re-throw the error so calling components can handle it
    }
  }
}

import { Injectable } from '@angular/core';
import { AccountCategoryService } from './account-category.service';
import { AccountService } from './account.service';
import { EntryService } from './entry.service';

export interface FormattedAccount {
  id: number;
  name: string; // e.g, "Chase Checking", "Discover it", "Fidelity Brokerage"
  categoryId: number;
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
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService
  ) {}

  /**
   *
   * @returns An array of accounts for each unique date
   */
  async getFormattedEntries(): Promise<FormattedEntry[]> {
    const formattedEntries: FormattedEntry[] = [];
    const entries = await this.entryService.getEntries();

    // Get unique dates
    const uniqueDates = [...new Set(entries.map((entry) => entry.date))];

    // Process entries for each unique date
    for (const date of uniqueDates) {
      // Get all entries for this date
      const entriesForDate = entries.filter((entry) => entry.date === date);

      // Get all accounts associated with these entries
      const accountIds = [
        ...new Set(entriesForDate.map((entry) => entry.accountId))
      ];
      const formattedAccounts: FormattedAccount[] = [];

      // Get details for each account
      for (const accountId of accountIds) {
        const account = await this.accountService.getAccount(accountId);
        if (account) {
          // Calculate the balance for this account on this date
          const balance = entriesForDate
            .filter((entry) => entry.accountId === accountId)
            .reduce((sum, entry) => sum + entry.balance, 0);

          const accountCategory =
            await this.accountCategoryService.getAccountCategory(
              account.categoryId
            );
          const accountCategoryName = accountCategory
            ? accountCategory.name
            : '';
          const accountCategoryType = accountCategory
            ? accountCategory.type
            : '';

          formattedAccounts.push({
            id: account.id!,
            name: account.name,
            categoryId: account.categoryId,
            balance: balance
          });
        }
      }

      // Add formatted entry for this date
      formattedEntries.push({
        date,
        accounts: formattedAccounts
      });
    }

    // Sort entries by date (newest first)
    formattedEntries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
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
   * Gets formatted accounts with their current balances
   * @param activeOnly When true, returns only active accounts. When false, returns all accounts. Default is false.
   * @returns An array of formatted accounts
   */
  async getFormattedAccounts(
    activeOnly: boolean = false
  ): Promise<FormattedAccount[]> {
    const formattedAccounts: FormattedAccount[] = [];
    const accounts = await this.accountService.getAccounts();

    // Filter accounts based on activeOnly parameter
    const filteredAccounts = activeOnly
      ? accounts.filter((account) => account.isActive)
      : accounts;

    // Process each account
    for (const account of filteredAccounts) {
      const lastEntry = await this.entryService.getLastEntry(account.id!);

      // Get the account category details
      const accountCategory =
        await this.accountCategoryService.getAccountCategory(
          account.categoryId
        );

      const balance = lastEntry ? lastEntry.balance : 0;

      // Create the formatted account
      formattedAccounts.push({
        id: account.id!,
        name: account.name,
        categoryId: account.categoryId,
        balance
      });
    }

    // Sort accounts alphabetically by name
    formattedAccounts.sort((a, b) => a.name.localeCompare(b.name));

    return formattedAccounts;
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

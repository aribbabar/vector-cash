import { Injectable } from "@angular/core";
import { AccountCategory } from "../models/account-category.model";
import { Account } from "../models/account.model";
import { Entry } from "../models/entry.model";
import { AccountCategoryService } from "./account-category.service";
import { AccountService } from "./account.service";
import { EntryService } from "./entry.service";

export interface ImportExportData {
  entries: Entry[];
  accounts: Account[];
  accountCategories: AccountCategory[];
}

@Injectable({
  providedIn: "root"
})
export class ImportExportService {
  entries: Entry[] = [];
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];

  constructor(
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService
  ) {}

  private async initialize() {
    this.entries = await this.entryService.getAll();
    this.accounts = await this.accountService.getAll();
    this.accountCategories = await this.accountCategoryService.getAll();
  }

  async exportData(): Promise<Blob> {
    await this.initialize();

    const data: ImportExportData = {
      entries: this.entries,
      accounts: this.accounts,
      accountCategories: this.accountCategories
    };

    const date = Intl.DateTimeFormat("en-US").format(new Date());
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `vector-cash-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return blob;
  }

  async importData(file: File) {
    await this.initialize();

    const fileContents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

    try {
      const importedData: ImportExportData = JSON.parse(fileContents);

      if (
        this.entries.length > 0 ||
        this.accounts.length > 0 ||
        this.accountCategories.length > 0
      ) {
        throw new Error(
          "Data already exists. Please delete existing data before importing."
        );
      }

      // Check if the imported data is valid
      for (const entry of importedData.entries) {
        if (
          entry.id === undefined ||
          entry.date === undefined ||
          entry.accountId === undefined ||
          entry.balance === undefined
        ) {
          console.log(!entry.id, !entry.date, !entry.accountId, !entry.balance);
          throw new Error("Invalid entry data.");
        }
      }

      for (const account of importedData.accounts) {
        if (
          account.id === undefined ||
          account.name === undefined ||
          account.categoryId === undefined
        ) {
          console.log(account);
          throw new Error("Invalid account data.");
        }
      }

      for (const accountCategory of importedData.accountCategories) {
        if (
          accountCategory.id === undefined ||
          accountCategory.name === undefined ||
          accountCategory.type === undefined
        ) {
          throw new Error("Invalid account category data.");
        }
      }

      for (const entry of importedData.entries) {
        await this.entryService.add(entry);
      }

      for (const account of importedData.accounts) {
        await this.accountService.add(account);
      }

      for (const accountCategory of importedData.accountCategories) {
        await this.accountCategoryService.add(accountCategory);
      }
    } catch (error) {
      console.error("Error parsing imported data:", error);
      throw new Error(
        "Error parsing imported data. Please ensure the file is valid."
      );
    }
  }
}

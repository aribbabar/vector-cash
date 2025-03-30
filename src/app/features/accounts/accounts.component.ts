import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
import { Entry } from "../../core/models/entry.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";
import { EntryService } from "../../core/services/entry.service";
import { AccountDialogComponent } from "../account-dialog/account-dialog.component";
import { DeleteDialogComponent } from "../delete-dialog/delete-dialog.component";

@Component({
  selector: "app-accounts",
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: "./accounts.component.html",
  styleUrl: "./accounts.component.css"
})
export class AccountsComponent implements OnInit {
  entries: Entry[] = [];
  activeAccounts: Account[] = [];
  activeAccountsEntriesMap: Map<Account, Entry> = new Map();
  categories: AccountCategory[] = [];

  constructor(
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.entryService.entries$.subscribe((entries) => {
      this.entries = entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      this.setActiveAccountsEntriesMap();
    });

    this.accountService.accounts$.subscribe((accounts) => {
      this.activeAccounts = accounts.filter((account) => account.isActive);
    });

    this.accountCategoryService.accountCategories$.subscribe((categories) => {
      this.categories = categories;
    });
  }

  setActiveAccountsEntriesMap() {
    this.activeAccounts.forEach((account) => {
      const entry = this.entries.find(
        (entry) => entry.accountId === account.id
      );
      if (entry) {
        this.activeAccountsEntriesMap.set(account, entry);
      }
    });
  }

  getAccountBalance(accountId: number): number {
    const entry = this.entries.find((entry) => entry.accountId === accountId);
    return entry ? entry.balance : 0;
  }

  getAssetCategories(): AccountCategory[] {
    return this.categories.filter(
      (category) =>
        category.type === "Asset" &&
        this.activeAccounts.some(
          (account) => account.categoryId === category.id
        )
    );
  }

  getLiabilityCategories(): AccountCategory[] {
    return this.categories.filter(
      (category) =>
        category.type === "Liability" &&
        this.activeAccounts.some(
          (account) => account.categoryId === category.id
        )
    );
  }

  getAccountsByCategory(categoryId: number): Account[] {
    return this.activeAccounts.filter(
      (account) => account.categoryId === categoryId
    );
  }

  async openUpdateDialog(account: Account): Promise<void> {
    const dialogRef = this.dialog.open(AccountDialogComponent, {
      data: { account: account }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open("Account updated", "Dismiss", { duration: 5000 });
      }
    });
  }

  openDeleteDialog(account: Account): void {
    // Open dialog to delete account
    const dialogRef = this.dialog.open(DeleteDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deactivateAccount(account);
      }
    });
  }

  async deactivateAccount(account: Account) {
    try {
      await this.accountService.deactivate(account.id!);
      this.snackBar.open("Account deleted", "Dismiss", { duration: 5000 });
    } catch (error) {
      console.error("Error deleting account:", error);
      this.snackBar.open("Error deleting account", "Dismiss", {
        duration: 5000
      });
    }
  }
}

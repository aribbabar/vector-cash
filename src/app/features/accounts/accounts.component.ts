import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";
import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
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
export class AccountsComponent implements OnInit, OnDestroy {
  accountsSubscription!: Subscription;
  accountCategoriesSubscription!: Subscription;

  activeAccounts: Account[] = [];
  categories: AccountCategory[] = [];

  constructor(
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.accountsSubscription = this.accountService.accounts$.subscribe(
      (accounts) => {
        this.activeAccounts = accounts.filter((account) => account.isActive);
      }
    );

    this.accountCategoriesSubscription =
      this.accountCategoryService.accountCategories$.subscribe((categories) => {
        this.categories = categories;
      });
  }

  ngOnDestroy() {
    if (this.accountsSubscription) {
      this.accountsSubscription.unsubscribe();
    }

    if (this.accountCategoriesSubscription) {
      this.accountCategoriesSubscription.unsubscribe();
    }
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

  async getAccountBalance(accountId: number): Promise<number> {
    return (
      (await this.entryService.getMostRecentByAccountId(accountId))?.balance ??
      0
    );
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

  async refreshCategories(): Promise<void> {
    this.categories = await this.accountCategoryService.getAll();
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

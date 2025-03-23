import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AccountCategory } from '../../core/models/account-category.model';
import { AccountCategoryService } from '../../core/services/account-category.service';
import { AccountService } from '../../core/services/account.service';
import {
  FormattedAccount,
  FormattedDataService
} from '../../core/services/formatted-data.service';
import { GlobalEventService } from '../../core/services/global-event.service';
import { GlobalEvents } from '../../core/utils/global-events';
import { AccountDialogComponent } from '../account-dialog/account-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit {
  accounts: FormattedAccount[] = [];
  categories: AccountCategory[] = [];

  constructor(
    private accountService: AccountService,
    private formattedDataService: FormattedDataService,
    private accountCategoryService: AccountCategoryService,
    private globalEventService: GlobalEventService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.accounts = await this.formattedDataService.getFormattedAccounts();
    this.categories = await this.accountCategoryService.getAccountCategories();

    this.globalEventService.events$.subscribe((event) => {
      if (event.name === GlobalEvents.REFRESH_ACCOUNTS) {
        this.refreshAccounts();
      }
    });

    this.globalEventService.events$.subscribe((event) => {
      if (event.name === GlobalEvents.REFRESH_CATEGORIES) {
        this.refreshCategories();
      }
    });
  }

  getAssetCategories(): AccountCategory[] {
    const assetAccountCategoryIds = [
      ...new Set(
        this.accounts
          .filter((account) => account.type === 'Asset')
          .map((account) => account.categoryId)
      )
    ];

    return this.categories.filter((category) =>
      assetAccountCategoryIds.includes(category.id!)
    );
  }

  getLiabilityCategories(): AccountCategory[] {
    const liabilityAccountCategoryIds = [
      ...new Set(
        this.accounts
          .filter((account) => account.type === 'Liability')
          .map((account) => account.categoryId)
      )
    ];

    return this.categories.filter((category) =>
      liabilityAccountCategoryIds.includes(category.id!)
    );
  }

  getAccountsByCategory(
    categoryId: number | undefined,
    type: 'Asset' | 'Liability'
  ): FormattedAccount[] {
    if (!categoryId) return [];
    return this.accounts.filter(
      (account) => account.categoryId === categoryId && account.type === type
    );
  }

  getAssetTotal(): number {
    return this.accounts
      .filter((account) => account.type === 'Asset')
      .reduce((sum, account) => sum + account.balance, 0);
  }

  getLiabilityTotal(): number {
    return this.accounts
      .filter((account) => account.type === 'Liability')
      .reduce((sum, account) => sum + account.balance, 0);
  }

  getNetWorth(): number {
    return this.getAssetTotal() - this.getLiabilityTotal();
  }

  async openUpdateDialog(formattedAccount: FormattedAccount): Promise<void> {
    const account = await this.accountService.getAccount(formattedAccount.id);

    const dialogRef = this.dialog.open(AccountDialogComponent, {
      data: { account: account }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Account updated', 'Dismiss', { duration: 5000 });
      }
    });
  }

  openDeleteDialog(account: FormattedAccount): void {
    // Open dialog to delete account
    const dialogRef = this.dialog.open(DeleteDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteAccount(account);
      }
    });
  }

  async refreshAccounts(): Promise<void> {
    this.accounts = await this.formattedDataService.getFormattedAccounts();
  }

  async refreshCategories(): Promise<void> {
    this.categories = await this.accountCategoryService.getAccountCategories();
  }

  async deleteAccount(account: FormattedAccount): Promise<void> {
    try {
      await this.formattedDataService.deleteFormattedAccount(account);
      this.snackBar.open('Account deleted', 'Dismiss', { duration: 5000 });
      this.refreshAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      this.snackBar.open('Error deleting account', 'Dismiss', {
        duration: 5000
      });
    }
  }
}

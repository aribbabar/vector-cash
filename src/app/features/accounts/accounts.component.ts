import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
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
export class AccountsComponent implements OnInit, OnDestroy {
  activeAccounts: FormattedAccount[] = [];
  categories: AccountCategory[] = [];
  private eventSubscription: Subscription = new Subscription();

  constructor(
    private accountService: AccountService,
    private formattedDataService: FormattedDataService,
    private accountCategoryService: AccountCategoryService,
    private globalEventService: GlobalEventService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.activeAccounts = await this.formattedDataService.getFormattedAccounts(
      true
    );
    this.categories = await this.accountCategoryService.getAccountCategories();

    this.eventSubscription = this.globalEventService.events$.subscribe(
      (event) => {
        if (
          event.name === GlobalEvents.REFRESH_ACCOUNTS ||
          event.name === GlobalEvents.REFRESH_ENTRIES
        ) {
          this.refreshAccounts();
        } else if (event.name === GlobalEvents.REFRESH_CATEGORIES) {
          this.refreshCategories();
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
  }

  getAssetCategories(): AccountCategory[] {
    return this.categories.filter(
      (category) =>
        category.type === 'Asset' &&
        this.activeAccounts.some(
          (account) => account.categoryId === category.id
        )
    );
  }

  getLiabilityCategories(): AccountCategory[] {
    return this.categories.filter(
      (category) =>
        category.type === 'Liability' &&
        this.activeAccounts.some(
          (account) => account.categoryId === category.id
        )
    );
  }

  getAccountsByCategory(categoryId: number): FormattedAccount[] {
    return this.activeAccounts.filter(
      (account) => account.categoryId === categoryId
    );
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
    this.activeAccounts = await this.formattedDataService.getFormattedAccounts(
      true
    );
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

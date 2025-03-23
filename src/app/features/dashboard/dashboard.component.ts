import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AccountCategoriesComponent } from '../account-categories/account-categories.component';
import { AccountCategoryDialogComponent } from '../account-category-dialog/account-category-dialog.component';
import { AccountDialogComponent } from '../account-dialog/account-dialog.component';
import { AccountsComponent } from '../accounts/accounts.component';
import { EntriesComponent } from '../entries/entries.component';
import { EntryDialogComponent } from '../entry-dialog/entry-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    CommonModule,
    EntriesComponent,
    AccountsComponent,
    AccountCategoriesComponent,
    AccountCategoriesComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  assetsTotal = 0;
  liabilitiesTotal = 0;
  netWorth = 0;
  isLoading = false;

  constructor(private dialog: MatDialog) {}

  openEntryDialog(): void {
    this.blurActiveElement();
    this.dialog.open(EntryDialogComponent);
  }

  openAccountDialog(): void {
    this.blurActiveElement();
    this.dialog.open(AccountDialogComponent);
  }

  openCategoryDialog(): void {
    this.blurActiveElement();
    this.dialog.open(AccountCategoryDialogComponent);
  }

  // Prevents the Blocked aria-hidden attribute error
  blurActiveElement(): void {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  }
}

import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AccountCategory } from '../../core/models/account-category.model';
import { Account } from '../../core/models/account.model';
import { Entry } from '../../core/models/entry.model';
import { AccountCategoryService } from '../../core/services/account-category.service';
import { AccountService } from '../../core/services/account.service';
import { DatabaseService } from '../../core/services/database.service';
import { EntryService } from '../../core/services/entry.service';
import { Theme, ThemeService } from '../../core/services/theme.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';

interface ImportExportData {
  entries: Entry[];
  accounts: Account[];
  accountCategories: AccountCategory[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  entries: Entry[] = [];
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  inactiveAccounts: Account[] = [];
  inactiveAccountCategories: AccountCategory[] = [];
  themeOptions = ['light', 'dark', 'system'];
  currentTheme = 'system';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private databaseService: DatabaseService,
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private themeService: ThemeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    this.inactiveAccounts = await this.accountService.getInactiveAccounts();
    this.inactiveAccountCategories =
      await this.accountCategoryService.getInactiveAccountCategories();

    // Get current theme
    this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
    });

    this.entries = await this.entryService.getEntries();
    this.accounts = await this.accountService.getAccounts();
    this.accountCategories =
      await this.accountCategoryService.getAccountCategories();
  }

  async restoreAccount(accountId: number): Promise<void> {
    try {
      await this.accountService.restoreAccount(accountId);
      this.inactiveAccounts = this.inactiveAccounts.filter(
        (account) => account.id !== accountId
      );

      this.snackBar.open('Account restored successfully', 'Close', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error restoring account:', error);
      this.snackBar.open((error as Error).message, 'Close', {
        duration: 3000
      });
    }
  }

  restoreCategory(categoryId: number): void {
    this.accountCategoryService.setAccountCategoryActiveStatus(
      categoryId,
      true
    );
    this.inactiveAccountCategories = this.inactiveAccountCategories.filter(
      (category) => category.id !== categoryId
    );

    this.snackBar.open('Category restored successfully', 'Close', {
      duration: 3000
    });
  }

  exportData(): void {
    const data: ImportExportData = {
      entries: this.entries,
      accounts: this.accounts,
      accountCategories: this.accountCategories
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-cash-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    this.snackBar.open('Data exported successfully', 'Close', {
      duration: 3000
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        console.log(JSON.parse(reader.result as string));
        try {
          const importedData: ImportExportData = JSON.parse(
            reader.result as string
          );

          if (
            this.entries.length > 0 ||
            this.accounts.length > 0 ||
            this.accountCategories.length > 0
          ) {
            throw new Error(
              'Data already exists. Please delete existing data before importing.'
            );
          }

          for (const entry of importedData.entries) {
            this.entryService.addEntry(entry);
          }

          for (const account of importedData.accounts) {
            this.accountService.addAccount(account);
          }

          for (const accountCategory of importedData.accountCategories) {
            this.accountCategoryService.addAccountCategory(accountCategory);
          }

          this.snackBar.open('Data imported successfully', 'Close', {
            duration: 3000
          });
        } catch (error) {
          input.value = '';
          console.error('Error parsing imported data:', error);
          this.snackBar.open((error as Error).message, 'Close', {
            duration: 3000
          });
        }
      };

      reader.readAsText(file);
    }
  }

  confirmDatabaseDeletion(): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Delete Database',
        message: `Are you sure you want to delete the database?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteDatabase();
      }
    });
  }

  deleteDatabase(): void {
    this.databaseService.deleteDatabase();

    this.snackBar.open('All data has been deleted', 'Close', {
      duration: 3000
    });
  }

  changeTheme(theme: string): void {
    const themeToChange = theme as Theme;
    this.themeService.setTheme(themeToChange);
    this.snackBar.open(`Theme changed to ${themeToChange}`, 'Close', {
      duration: 3000
    });
  }
}

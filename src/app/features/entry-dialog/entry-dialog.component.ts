import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatNativeDateModule,
  provideNativeDateAdapter
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { AccountCategory } from '../../core/models/account-category.model';
import { AccountCategoryService } from '../../core/services/account-category.service';
import { EntryService } from '../../core/services/entry.service';
import {
  FormattedAccount,
  FormattedDataService,
  FormattedEntry
} from '../../core/services/formatted-data.service';

@Component({
  selector: 'app-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './entry-dialog.component.html',
  styleUrl: './entry-dialog.component.css'
})
export class EntryDialogComponent implements OnInit {
  accountsList: FormattedAccount[] = []; // Renamed from accounts to avoid conflict
  categories: AccountCategory[] = [];
  entryForm: FormGroup;

  constructor(
    private entryService: EntryService,
    private formattedDataService: FormattedDataService,
    private accountCategoryService: AccountCategoryService,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<EntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { entry: FormattedEntry }
  ) {
    let date = new Date();

    if (data) {
      // Update logic here
      date = new Date(data.entry.date);
    }

    this.entryForm = this.formBuilder.group({
      date: [date, Validators.required],
      accounts: this.formBuilder.array([])
    });
  }

  async ngOnInit() {
    try {
      this.categories =
        await this.accountCategoryService.getAccountCategories();

      if (this.data && this.data.entry) {
        // Update logic - populate form with only the accounts from the entry
        const formattedEntry = this.data.entry;

        // Use the accounts from the entry
        this.accountsList = formattedEntry.accounts;

        // Sort accounts by type (Assets first, then Liabilities) and then alphabetically
        this.sortAccounts();

        // Set the date from the entry
        this.entryForm.get('date')?.setValue(new Date(formattedEntry.date));

        // Populate the form with the entry accounts and their balances
        this.accountsList.forEach((account) => {
          this.accountsArray.push(
            this.createAccountFormGroup(account, account.balance)
          );
        });
      } else {
        // Create logic - initialize form with all accounts
        this.accountsList =
          await this.formattedDataService.getFormattedAccounts(true);

        // Sort accounts by type (Assets first, then Liabilities) and then alphabetically
        this.sortAccounts();

        // Initialize form with all active accounts but no balances
        this.accountsList.forEach((account) => {
          this.accountsArray.push(this.createAccountFormGroup(account));
        });
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }

  // Getter for the accounts FormArray
  get accountsArray() {
    return this.entryForm.get('accounts') as FormArray;
  }

  // Create a form group for each account
  createAccountFormGroup(
    account: FormattedAccount,
    balance?: number
  ): FormGroup {
    return this.formBuilder.group({
      id: [account.id],
      name: [account.name],
      balance: [
        balance,
        [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]
      ]
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (this.entryForm.invalid) {
      return;
    }

    const formValues = this.entryForm.value;
    const formattedDate = new Intl.DateTimeFormat('en-US').format(
      formValues.date
    );

    const entries = formValues.accounts.map((accountData: any) => ({
      date: formattedDate,
      accountId: accountData.id,
      balance: parseFloat(accountData.balance)
    }));

    try {
      // Use Promise.all to wait for all entries to be processed
      await Promise.all(
        entries.map(async (entry: any) => {
          // Check if an entry already exists for this account on the given date
          const existingEntry =
            await this.entryService.getEntryByAccountAndDate(
              entry.accountId,
              entry.date
            );

          if (existingEntry) {
            // Update existing entry
            await this.entryService.updateEntry({
              ...existingEntry,
              balance: entry.balance
            });
          } else {
            // Add new entry
            await this.entryService.addEntry(entry);
          }
        })
      );

      // Only close dialog after all operations complete successfully
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error processing entries:', error);
      // You could add error handling/showing here
    }
  }

  getCategoryType(account: FormattedAccount): string {
    const category = this.categories.find(
      (cat) => cat.id === account.categoryId
    );

    return category ? category.type : '';
  }

  getAccountClass(account: FormattedAccount): string {
    const categoryType = this.getCategoryType(account);
    return categoryType === 'Asset' ? 'asset-account' : 'liability-account';
  }

  /**
   * Sorts accounts by category type (Assets first, then Liabilities) and then alphabetically by name
   */
  private sortAccounts(): void {
    this.accountsList.sort((a, b) => {
      // Get category types
      const typeA = this.getCategoryType(a);
      const typeB = this.getCategoryType(b);

      // First sort by category type (Assets before Liabilities)
      if (typeA === 'Asset' && typeB !== 'Asset') {
        return -1;
      }
      if (typeA !== 'Asset' && typeB === 'Asset') {
        return 1;
      }

      // Then sort alphabetically by account name
      return a.name.localeCompare(b.name);
    });
  }
}

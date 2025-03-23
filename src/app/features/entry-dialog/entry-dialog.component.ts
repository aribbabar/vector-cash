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

import { Account } from '../../core/models/account.model';
import { AccountService } from '../../core/services/account.service';
import { EntryService } from '../../core/services/entry.service';
import { FormattedEntry } from '../../core/services/formatted-data.service';
import { GlobalEventService } from '../../core/services/global-event.service';

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
  accountsList: Account[] = []; // Renamed from accounts to avoid conflict
  entryForm: FormGroup;

  constructor(
    private globalEventService: GlobalEventService,
    private entryService: EntryService,
    private accountService: AccountService,
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

  // Getter for the accounts FormArray
  get accountsArray() {
    return this.entryForm.get('accounts') as FormArray;
  }

  // Create a form group for each account
  createAccountFormGroup(account: Account, balance?: number): FormGroup {
    return this.formBuilder.group({
      id: [account.id],
      name: [account.name],
      type: [account.type],
      balance: [
        balance,
        [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]
      ]
    });
  }

  async ngOnInit() {
    try {
      // First get all accounts regardless of create or update mode
      this.accountsList = await this.accountService.getAccounts();

      if (this.data && this.data.entry) {
        // Update logic - populate form with existing data
        const formattedEntry = this.data.entry;

        // For each account in the system, check if it exists in the entry
        this.accountsList.forEach((account) => {
          const entryAccount = formattedEntry.accounts.find(
            (a) => a.id === account.id
          );
          if (entryAccount) {
            // Account exists in this entry, use its balance
            this.accountsArray.push(
              this.createAccountFormGroup(account, entryAccount.balance)
            );
          } else {
            // Account doesn't exist in this entry, use empty balance
            this.accountsArray.push(this.createAccountFormGroup(account));
          }
        });
      } else {
        // Create logic - initialize form with all accounts but no balances
        this.accountsList.forEach((account) => {
          this.accountsArray.push(this.createAccountFormGroup(account));
        });
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
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

  getAccountClass(account: Account): string {
    return account.type === 'Asset' ? 'asset-account' : 'liability-account';
  }
}

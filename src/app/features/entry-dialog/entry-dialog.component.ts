import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Account } from '../../core/models/account.model';
import { Entry } from '../../core/models/entry.model';
import { EntryService } from '../../core/services/entry.service';

@Component({
  selector: 'app-entry-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    FormsModule,
    MatNativeDateModule,
    MatButtonModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatInputModule
  ],
  templateUrl: './entry-dialog.component.html',
  styleUrls: ['./entry-dialog.component.css']
})
export class EntryDialogComponent {
  entryForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EntryDialogComponent>,
    private entryService: EntryService,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { accounts: Account[] } // Inject available accounts
  ) {
    this.entryForm = this.formBuilder.group({
      date: [new Date(), Validators.required],
      accountBalances: this.formBuilder.array([])
    });

    this.populateAccounts();
  }

  populateAccounts() {
    this.data.accounts.forEach((account) => {
      const accountBalanceForm = this.formBuilder.group({
        accountId: [account.id, Validators.required],
        balance: [20, Validators.required]
      });

      this.accountBalances.push(accountBalanceForm);
    });
  }

  get accountBalances(): FormArray {
    return this.entryForm.get('accountBalances') as FormArray;
  }

  async saveEntries() {
    if (this.entryForm.invalid) return;

    console.log('Saving entries...');

    const formValue = this.entryForm.value;
    console.log(formValue);
    const entries: Entry[] = formValue.accountBalances.map((b: any) => ({
      date: formValue.date,
      accountId: b.accountId,
      balance: b.balance
    }));

    for (const entry of entries) {
      await this.entryService.addEntry(entry);
    }

    this.dialogRef.close(true); // Close dialog after saving
  }

  close() {
    this.dialogRef.close();
  }
}

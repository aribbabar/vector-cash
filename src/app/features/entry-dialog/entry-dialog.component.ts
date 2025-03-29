import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatNativeDateModule,
  provideNativeDateAdapter
} from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
import { GroupedEntry } from "../../core/models/entry.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";
import { EntryService } from "../../core/services/entry.service";

@Component({
  selector: "app-entry-dialog",
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
  templateUrl: "./entry-dialog.component.html",
  styleUrl: "./entry-dialog.component.scss"
})
export class EntryDialogComponent implements OnInit {
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  activeAccounts: Account[] = [];
  activeAccountCategories: AccountCategory[] = [];
  entryForm!: FormGroup;
  isUpdateMode!: boolean;

  constructor(
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<EntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { entry: GroupedEntry }
  ) {}

  async ngOnInit() {
    const groupedEntry = this.data?.entry;
    this.accounts = await this.accountService.getAll();
    this.accountCategories = await this.accountCategoryService.getAll();
    this.activeAccounts = await this.accountService.getAllWhere(
      (account) => account.isActive === true
    );
    this.activeAccountCategories =
      await this.accountCategoryService.getAllWhere(
        (accountCategory) => accountCategory.isActive === true
      );

    this.isUpdateMode = groupedEntry ? true : false;

    if (this.isUpdateMode) {
      this.entryForm = this.formBuilder.group({
        date: [new Date(groupedEntry.date), Validators.required],
        accounts: this.formBuilder.array([])
      });

      // Populate the form with existing entry data - sorted by category type
      const sortedEntries = [...this.data.entry.entries].sort((a, b) => {
        const accountA = this.accounts.find((acc) => acc.id === a.accountId);
        const accountB = this.accounts.find((acc) => acc.id === b.accountId);

        const categoryA = this.accountCategories.find(
          (cat) => cat.id === accountA?.categoryId
        );
        const categoryB = this.accountCategories.find(
          (cat) => cat.id === accountB?.categoryId
        );

        // Sort assets (Asset) first, then liabilities (Liability)
        if (categoryA?.type === "Asset" && categoryB?.type !== "Asset")
          return -1;
        if (categoryA?.type !== "Asset" && categoryB?.type === "Asset")
          return 1;
        return 0;
      });

      sortedEntries.forEach((entry) => {
        const account = this.accounts.find(
          (account) => account.id === entry.accountId
        );

        const accountCategory = this.accountCategories.find(
          (category) => category.id === account?.categoryId
        );

        if (account) {
          this.accountsArray.push(
            this.createAccountFormGroup(
              account,
              accountCategory!,
              entry.balance
            )
          );
        }
      });
    } else {
      this.entryForm = this.formBuilder.group({
        date: [new Date(), Validators.required],
        accounts: this.formBuilder.array([])
      });

      // Add all active accounts to the form by default - sorted by category type
      const sortedAccounts = [...this.activeAccounts].sort((a, b) => {
        const categoryA = this.accountCategories.find(
          (cat) => cat.id === a.categoryId
        );
        const categoryB = this.accountCategories.find(
          (cat) => cat.id === b.categoryId
        );

        // Sort assets (Asset) first, then liabilities (Liability)
        if (categoryA?.type === "Asset" && categoryB?.type !== "Asset")
          return -1;
        if (categoryA?.type !== "Asset" && categoryB?.type === "Asset")
          return 1;
        return 0;
      });

      sortedAccounts.forEach((account) => {
        const accountCategory = this.accountCategories.find(
          (category) => category.id === account?.categoryId
        );

        this.accountsArray.push(
          this.createAccountFormGroup(account, accountCategory!)
        );
      });
    }
  }

  // Getter for the accounts FormArray
  get accountsArray() {
    return this.entryForm.get("accounts") as FormArray;
  }

  // Create a form group for each account
  createAccountFormGroup(
    account: Account,
    accountCategory: AccountCategory,
    balance: number | undefined = 20
  ): FormGroup {
    return this.formBuilder.group({
      id: [account.id],
      accountName: [account.name],
      accountCategory: [accountCategory.name],
      accountCategoryType: [accountCategory.type],
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

    try {
      const date = Intl.DateTimeFormat("en-US").format(
        this.entryForm.value.date
      );
      const accounts = this.entryForm.value.accounts;

      accounts.forEach((account: any) => {
        this.entryService.add({
          date: date,
          accountId: account.id!,
          balance: account.balance
        });
      });

      // Only close dialog after all operations complete successfully
      this.dialogRef.close(true);
    } catch (error) {
      console.error("Error processing entries:", error);
    }
  }
}

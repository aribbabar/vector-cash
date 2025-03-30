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
  ) {
    this.entryForm = this.formBuilder.group({
      date: [new Date(), Validators.required],
      accounts: this.formBuilder.array([])
    });
  }

  async ngOnInit() {
    const groupedEntry = this.data?.entry;

    // Fetch accounts and categories concurrently
    const [accounts, accountCategories] = await Promise.all([
      this.accountService.getAll(),
      this.accountCategoryService.getAll()
    ]);
    this.accounts = accounts;
    this.accountCategories = accountCategories;

    // Build a map for quick lookup of categories by id
    const categoryMap = new Map<number, AccountCategory>();
    this.accountCategories.forEach((cat) => categoryMap.set(cat.id!, cat));

    this.activeAccounts = this.accounts.filter((account) => account.isActive);
    this.activeAccountCategories = this.accountCategories.filter(
      (category) => category.isActive
    );

    this.isUpdateMode = !!groupedEntry;

    // Define sort function using the prebuilt category map
    const sortByCategoryType = (a: Account, b: Account) => {
      const categoryA = categoryMap.get(a.categoryId);
      const categoryB = categoryMap.get(b.categoryId);
      if (categoryA?.type === "Asset" && categoryB?.type !== "Asset") return -1;
      if (categoryA?.type !== "Asset" && categoryB?.type === "Asset") return 1;
      return 0;
    };

    if (this.isUpdateMode) {
      this.entryForm.setControl(
        "date",
        this.formBuilder.control(
          new Date(groupedEntry.date),
          Validators.required
        )
      );
      this.entryForm.setControl("accounts", this.formBuilder.array([]));

      // Populate the form with existing entry data - sorted by category type
      const sortedEntries = [...this.data.entry.entries].sort((a, b) => {
        const accountA = this.accounts.find((acc) => acc.id === a.accountId);
        const accountB = this.accounts.find((acc) => acc.id === b.accountId);
        if (!accountA || !accountB) return 0;

        const categoryA = categoryMap.get(accountA.categoryId);
        const categoryB = categoryMap.get(accountB.categoryId);

        if (categoryA?.type === "Asset" && categoryB?.type !== "Asset")
          return -1;
        if (categoryA?.type !== "Asset" && categoryB?.type === "Asset")
          return 1;
        return 0;
      });

      sortedEntries.forEach((entry) => {
        const account = this.accounts.find((acc) => acc.id === entry.accountId);
        if (!account) return;
        const accountCategory = categoryMap.get(account.categoryId)!;
        this.accountsArray.push(
          this.createAccountFormGroup(account, accountCategory, entry.balance)
        );
      });
    } else {
      this.entryForm.setControl(
        "date",
        this.formBuilder.control(new Date(), Validators.required)
      );
      this.entryForm.setControl("accounts", this.formBuilder.array([]));

      // Sort active accounts by category type using the map
      const sortedAccounts = [...this.activeAccounts].sort(sortByCategoryType);

      sortedAccounts.forEach((account) => {
        const accountCategory = categoryMap.get(account.categoryId)!;
        this.accountsArray.push(
          this.createAccountFormGroup(account, accountCategory)
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

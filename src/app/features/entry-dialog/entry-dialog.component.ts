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

    this.accounts = await this.accountService.getAll();
    this.accountCategories = await this.accountCategoryService.getAll();

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

    // Set up accounts form array
    const accountControls: FormGroup[] = [];

    if (this.isUpdateMode) {
      // Set date from existing entry
      this.entryForm.setControl(
        "date",
        this.formBuilder.control(
          new Date(groupedEntry.date),
          Validators.required
        )
      );

      // Populate from existing entry data - sorted by category type
      const sortedEntries = [...this.data.entry.entries].sort((a, b) => {
        const accountA = this.accounts.find((acc) => acc.id === a.accountId);
        const accountB = this.accounts.find((acc) => acc.id === b.accountId);
        if (!accountA || !accountB) return 0;

        return sortByCategoryType(accountA, accountB);
      });

      sortedEntries.forEach((entry) => {
        const account = this.accounts.find((acc) => acc.id === entry.accountId);
        if (!account) return;
        const accountCategory = categoryMap.get(account.categoryId)!;
        accountControls.push(
          this.createAccountFormGroup(account, accountCategory, entry.balance)
        );
      });
    } else {
      // Set default date for new entry
      this.entryForm.setControl(
        "date",
        this.formBuilder.control(new Date(), Validators.required)
      );

      // Sort active accounts by category type
      const sortedAccounts = [...this.activeAccounts].sort(sortByCategoryType);
      const latestEntry = await this.entryService.getMostRecentGroupedEntry();

      sortedAccounts.forEach((account) => {
        const accountCategory = categoryMap.get(account.categoryId)!;
        const latestEntryBalance =
          latestEntry?.entries.find((entry) => entry.accountId === account.id)
            ?.balance ?? undefined;
        accountControls.push(
          this.createAccountFormGroup(
            account,
            accountCategory,
            latestEntryBalance
          )
        );
      });
    }

    // Set the accounts form array once with all controls
    this.entryForm.setControl(
      "accounts",
      this.formBuilder.array(accountControls)
    );
  }

  // Getter for the accounts FormArray
  get accountsArray() {
    return this.entryForm.get("accounts") as FormArray;
  }

  // Create a form group for each account
  createAccountFormGroup(
    account: Account,
    accountCategory: AccountCategory,
    balance: number | undefined = undefined
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

      if (this.isUpdateMode) {
        // Update existing entries
        const updatedEntries = accounts.map((account: any) => ({
          id: this.data.entry.entries.find((e) => e.accountId === account.id)
            ?.id,
          date: date,
          accountId: account.id,
          balance: account.balance
        }));

        for (const entry of updatedEntries) {
          if (entry.id) {
            await this.entryService.update(entry.id, entry);
          } else {
            // Handle case where entry ID is not found
            console.warn("Entry ID not found for account:", entry.accountId);
          }
        }
      } else {
        // Add new entries
        for (const account of accounts) {
          await this.entryService.add({
            date: date,
            accountId: account.id,
            balance: account.balance
          });
        }
      }

      // Only close dialog after all operations complete successfully
      this.dialogRef.close(true);
    } catch (error) {
      console.error("Error processing entries:", error);
    }
  }
}

import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";

import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";

@Component({
  selector: "app-account-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: "./account-dialog.component.html",
  styleUrl: "./account-dialog.component.css"
})
export class AccountDialogComponent implements OnInit {
  accountForm: FormGroup;
  activeAccountCategories: AccountCategory[] = [];
  isUpdate = false;

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { account: Account }
  ) {
    this.accountForm = this.formBuilder.group({
      name: ["", [Validators.required]],
      categoryId: ["", [Validators.required]],
      isActive: [true]
    });

    // If we have data, we're updating an existing account
    if (data && data.account) {
      this.isUpdate = true;
      this.accountForm.patchValue({
        name: data.account.name,
        categoryId: data.account.categoryId,
        isActive: data.account.isActive
      });
    }
  }

  async ngOnInit(): Promise<void> {
    this.accountCategoryService.accountCategories$.subscribe((categories) => {
      this.activeAccountCategories = categories.filter(
        (category) => category.isActive
      );
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (this.accountForm.invalid) {
      return;
    }

    try {
      const formValues = this.accountForm.value;
      const account: Account = {
        name: formValues.name,
        categoryId: formValues.categoryId,
        isActive: formValues.isActive
      };

      if (this.isUpdate && this.data.account.id) {
        // Update existing account
        const accountId = this.data.account.id;
        await this.accountService.update(accountId, account);
        this.snackBar.open("Account updated", "Dismiss", { duration: 5000 });
      } else {
        // Create new account
        await this.accountService.add(account);
        this.snackBar.open("Account created", "Dismiss", { duration: 5000 });
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error("Error saving account:", error);
      this.snackBar.open("Error saving account", "Dismiss", { duration: 5000 });
    }
  }
}

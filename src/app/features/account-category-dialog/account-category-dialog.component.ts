import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
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
import { AccountCategoryService } from "../../core/services/account-category.service";

@Component({
  selector: "app-account-category-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: "./account-category-dialog.component.html",
  styleUrl: "./account-category-dialog.component.scss"
})
export class AccountCategoryDialogComponent implements OnInit {
  categoryForm!: FormGroup;
  isEditMode = false;

  constructor(
    private accountCategoryService: AccountCategoryService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AccountCategoryDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: AccountCategory | null
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize("400px");

    this.categoryForm = this.fb.group({
      name: ["", [Validators.required]],
      type: ["", [Validators.required]],
      description: [""],
      isActive: [true]
    });

    if (this.data) {
      this.isEditMode = true;
      this.categoryForm.patchValue({
        name: this.data.name,
        type: this.data.type,
        description: this.data.description,
        isActive: this.data.isActive
      });
    }
  }

  async onSubmit() {
    if (this.categoryForm.invalid) {
      return;
    }

    try {
      const category: AccountCategory = {
        ...this.categoryForm.value
      };

      if (this.isEditMode && this.data) {
        category.id = this.data.id;
      }

      if (this.isEditMode) {
        await this.accountCategoryService.update(category.id!, category);
      } else {
        await this.accountCategoryService.add(category);
      }

      this.dialogRef.close(category);
    } catch (error: any) {
      console.error("Error saving category:", error.message);
      this.snackBar.open("Error saving category. Please try again.", "Close", {
        duration: 5000,
        panelClass: ["error-snackbar"]
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

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
  styleUrl: "./account-category-dialog.component.css"
})
export class AccountCategoryDialogComponent implements OnInit {
  categoryForm: FormGroup;
  isEditMode = false;
  dialogTitle = "Create Category";

  constructor(
    private accountCategoryService: AccountCategoryService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AccountCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccountCategory | null
  ) {
    this.categoryForm = this.fb.group({
      name: ["", [Validators.required]],
      type: ["", [Validators.required]],
      description: [""],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.isEditMode = true;
      this.dialogTitle = "Edit Category";
      this.categoryForm.patchValue({
        name: this.data.name,
        type: this.data.type,
        description: this.data.description,
        isActive: this.data.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const category: AccountCategory = {
        ...this.categoryForm.value
      };

      if (this.isEditMode && this.data) {
        category.id = this.data.id;
      }

      if (this.isEditMode) {
        this.accountCategoryService.update(category.id!, category);
      } else {
        this.accountCategoryService.add(category);
      }

      this.dialogRef.close(category);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

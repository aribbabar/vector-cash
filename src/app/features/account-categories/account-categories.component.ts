import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AccountCategory } from "../../core/models/account-category.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";
import { AccountCategoryDialogComponent } from "../account-category-dialog/account-category-dialog.component";
import { DeleteDialogComponent } from "../delete-dialog/delete-dialog.component";

@Component({
  selector: "app-account-categories",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: "./account-categories.component.html",
  styleUrl: "./account-categories.component.css"
})
export class AccountCategoriesComponent implements OnInit {
  activeAccountCategories: AccountCategory[] = [];

  snackBar: MatSnackBar = inject(MatSnackBar);

  constructor(
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    this.accountCategoryService.accountCategories$.subscribe((categories) => {
      this.activeAccountCategories = categories.filter(
        (category) => category.isActive === true
      );
    });
  }

  openAddCategoryDialog(): void {
    this.dialog.open(AccountCategoryDialogComponent, {
      width: "400px"
    });
  }

  editCategory(category: AccountCategory): void {
    const dialogRef = this.dialog.open(AccountCategoryDialogComponent, {
      width: "400px",
      data: category
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.snackBar.open(
          `Category "${result.name}" has been updated.`,
          "Dismiss",
          {
            duration: 5000
          }
        );
      }
    });
  }

  async deleteCategory(category: AccountCategory): Promise<void> {
    try {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        data: {
          title: "Delete Category",
          message: `Are you sure you want to delete the category "${category.name}"?`,
          confirmText: "Delete",
          cancelText: "Cancel"
        }
      });

      dialogRef.afterClosed().subscribe(async (confirmed) => {
        if (confirmed) {
          this.snackBar.open(
            `Category "${category.name}" has been deleted.`,
            "Dismiss",
            {
              duration: 5000
            }
          );
        }
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      this.snackBar.open(
        "An error occurred while trying to delete the category.",
        "Close",
        {
          duration: 5000
        }
      );
    }
  }
}

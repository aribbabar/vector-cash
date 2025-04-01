import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { AccountCategory } from "../../core/models/account-category.model";
import { Account } from "../../core/models/account.model";
import { Entry } from "../../core/models/entry.model";
import { AccountCategoryService } from "../../core/services/account-category.service";
import { AccountService } from "../../core/services/account.service";
import { DatabaseService } from "../../core/services/database.service";
import { EntryService } from "../../core/services/entry.service";
import { ImportExportService } from "../../core/services/import-export.service";
import { Theme, ThemeService } from "../../core/services/theme.service";
import { DeleteDialogComponent } from "../delete-dialog/delete-dialog.component";

interface ImportExportData {
  entries: Entry[];
  accounts: Account[];
  accountCategories: AccountCategory[];
}

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss"
})
export class SettingsComponent {
  entries: Entry[] = [];
  accounts: Account[] = [];
  accountCategories: AccountCategory[] = [];
  inactiveAccounts: Account[] = [];
  inactiveAccountCategories: AccountCategory[] = [];
  themeOptions = ["light", "dark", "system"];
  currentTheme = "system";

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private databaseService: DatabaseService,
    private entryService: EntryService,
    private accountService: AccountService,
    private accountCategoryService: AccountCategoryService,
    private importExportService: ImportExportService,
    private themeService: ThemeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
    });

    this.entryService.entries$.subscribe((entries) => {
      this.entries = entries;
    });

    this.accountService.accounts$.subscribe((accounts) => {
      this.accounts = accounts;

      this.inactiveAccounts = this.accounts.filter(
        (account) => !account.isActive
      );
    });

    this.accountCategoryService.accountCategories$.subscribe((categories) => {
      this.accountCategories = categories;

      this.inactiveAccountCategories = this.accountCategories.filter(
        (category) => !category.isActive
      );
    });
  }

  async restoreAccount(accountId: number) {
    try {
      await this.accountService.update(accountId, {
        isActive: true
      });

      this.snackBar.open("Account restored successfully", "Close", {
        duration: 3000
      });
    } catch (error: any) {
      console.error("Error restoring account:", error);
      this.snackBar.open(error.message || "Error restoring account", "Close", {
        duration: 3000
      });
    }
  }

  async restoreCategory(categoryId: number) {
    try {
      await this.accountCategoryService.update(categoryId, {
        isActive: true
      });

      this.snackBar.open("Category restored successfully", "Close", {
        duration: 3000
      });
    } catch (error: any) {
      console.error("Error restoring category:", error);
      this.snackBar.open(
        error.message || "Error restoring account category",
        "Close",
        {
          duration: 3000
        }
      );
    }
  }

  async exportData() {
    await this.importExportService.exportData();

    this.snackBar.open("Data exported successfully", "Close", {
      duration: 3000
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  async importData(event: Event) {
    const input = event.target as HTMLInputElement;

    try {
      if (input.files && input.files.length > 0) {
        await this.importExportService.importData(input.files[0]);
      }

      this.snackBar.open("Data imported successfully", "Close", {
        duration: 3000
      });
    } catch (error: any) {
      input.value = "";
      this.snackBar.open((error as Error).message, "Close", {
        duration: 3000
      });
    }
  }

  confirmEntriesDeletion(): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: "Delete Entries",
        message: `Are you sure you want to delete all entries?`,
        confirmText: "Delete",
        cancelText: "Cancel"
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.entryService.removeAll();
      }
    });
  }

  confirmDatabaseDeletion(): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: "Delete Database",
        message: `Are you sure you want to delete the database?`,
        confirmText: "Delete",
        cancelText: "Cancel"
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteDatabase();
      }
    });
  }

  async deleteDatabase() {
    await this.databaseService.deleteDatabase();

    window.location.reload();
  }

  changeTheme(theme: string): void {
    const themeToChange = theme as Theme;
    this.themeService.setTheme(themeToChange);
    this.snackBar.open(`Theme changed to ${themeToChange}`, "Close", {
      duration: 3000
    });
  }
}

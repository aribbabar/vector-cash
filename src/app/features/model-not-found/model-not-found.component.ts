import { Component, Input, Type } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AccountCategoryDialogComponent } from "../account-category-dialog/account-category-dialog.component";
import { AccountDialogComponent } from "../account-dialog/account-dialog.component";
import { EntryDialogComponent } from "../entry-dialog/entry-dialog.component";

@Component({
  selector: "app-model-not-found",
  imports: [MatButtonModule, MatIconModule],
  templateUrl: "./model-not-found.component.html",
  styleUrl: "./model-not-found.component.scss"
})
export class ModelNotFoundComponent {
  @Input({ required: true }) text!: string;
  @Input({ required: true }) buttonText!: string;
  @Input({ required: true }) dialogComponent!: Type<
    | EntryDialogComponent
    | AccountDialogComponent
    | AccountCategoryDialogComponent
  >;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  handleClick() {
    const dialogRef = this.dialog.open(this.dialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (this.dialogComponent === EntryDialogComponent) {
          this.snackBar.open("Entry created successfully", "Close", {
            duration: 2000
          });
        } else if (this.dialogComponent === AccountDialogComponent) {
          this.snackBar.open("Account created successfully", "Close", {
            duration: 2000
          });
        } else if (this.dialogComponent === AccountCategoryDialogComponent) {
          this.snackBar.open("Account category created successfully", "Close", {
            duration: 2000
          });
        }
      }
    });
  }
}

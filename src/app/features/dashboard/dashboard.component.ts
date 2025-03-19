import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Account } from '../../core/models/account.model';
import { AccountService } from '../../core/services/account.service';
import { EntriesTableComponent } from '../entries-table/entries-table.component';
import { EntryDialogComponent } from '../entry-dialog/entry-dialog.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDialogModule,
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    EntriesTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  accounts: Account[] = [];

  constructor(
    private dialog: MatDialog,
    private accountService: AccountService
  ) {}

  async ngOnInit() {
    this.accounts = await this.accountService.getAccounts();
  }

  openEntryDialog() {
    const dialogRef = this.dialog.open(EntryDialogComponent, {
      width: '400px',
      data: { accounts: this.accounts } // Pass accounts to dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('New entry added!');
        // Refresh data if needed
      }
    });
  }
}

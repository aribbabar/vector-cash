import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Theme, ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
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
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  deletedAccounts: any[] = []; // Replace with your actual account interface
  themeOptions = ['light', 'dark', 'system'];
  currentTheme = 'system';

  constructor(
    private themeService: ThemeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Load deleted accounts - replace with your actual service
    this.loadDeletedAccounts();

    // Get current theme
    this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
    });
  }

  loadDeletedAccounts(): void {
    // Mock data - replace with actual service call
    this.deletedAccounts = [
      { id: 1, name: 'Checking Account', deletedDate: new Date() },
      {
        id: 2,
        name: 'Savings Account',
        deletedDate: new Date(Date.now() - 86400000)
      }
    ];
  }

  restoreAccount(accountId: number): void {
    // Implement account restoration logic
    console.log('Restoring account:', accountId);
    this.snackBar.open('Account restored successfully', 'Close', {
      duration: 3000
    });
    // Remove from deleted accounts list
    this.deletedAccounts = this.deletedAccounts.filter(
      (acc) => acc.id !== accountId
    );
  }

  exportData(): void {
    // Implement data export logic
    console.log('Exporting data');

    // Mock implementation
    const data = {
      /* your app data */
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-cash-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    this.snackBar.open('Data exported successfully', 'Close', {
      duration: 3000
    });
  }

  importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const importedData = JSON.parse(reader.result as string);
          // Process imported data
          console.log('Importing data:', importedData);
          this.snackBar.open('Data imported successfully', 'Close', {
            duration: 3000
          });
        } catch (error) {
          console.error('Error parsing imported data:', error);
          this.snackBar.open(
            'Error importing data. Invalid file format.',
            'Close',
            { duration: 3000 }
          );
        }
      };

      reader.readAsText(file);
    }
  }

  confirmDatabaseDeletion(): void {
    if (
      confirm(
        'Are you sure you want to delete all data? This action cannot be undone.'
      )
    ) {
      this.deleteDatabase();
    }
  }

  deleteDatabase(): void {
    // Implement database deletion logic
    console.log('Deleting database');
    // Clear local storage or call your service method
    this.snackBar.open('All data has been deleted', 'Close', {
      duration: 3000
    });
  }

  changeTheme(theme: string): void {
    const themeToChange = theme as Theme;
    this.themeService.setTheme(themeToChange);
    this.snackBar.open(`Theme changed to ${themeToChange}`, 'Close', {
      duration: 3000
    });
  }
}

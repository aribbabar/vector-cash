import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormattedDataService } from '../../core/services/formatted-data.service';
import { ChartComponent } from '../chart/chart.component';
import { EntriesComponent } from '../entries/entries.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    CommonModule,
    MatIconModule,
    EntriesComponent,
    ChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  assetsTotal = 0;
  liabilitiesTotal = 0;
  netWorth = 0;
  showFabOptions = false;

  constructor(
    private dialog: MatDialog,
    private formattedDataService: FormattedDataService
  ) {}

  async ngOnInit(): Promise<void> {
    const { assets, liabilities, netWorth } =
      await this.formattedDataService.getCurrentNetWorth();
    this.assetsTotal = assets;
    this.liabilitiesTotal = liabilities;
    this.netWorth = netWorth;
  }

  toggleFabOptions() {
    this.showFabOptions = !this.showFabOptions;
  }
}

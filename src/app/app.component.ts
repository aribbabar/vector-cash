import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  routes = routes.filter((route) => route.path !== '**' && route.path !== '');

  constructor(public themeService: ThemeService) {}

  getRouteIcon(path: string): string {
    // Map routes to appropriate Material icons
    const iconMap: { [key: string]: string } = {
      dashboard: 'dashboard',
      settings: 'settings'
    };

    return iconMap[path] || 'arrow_right'; // Default icon if not found
  }

  clickHandler() {
    this.sidenav.close();
  }
}

import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HeroComponent } from './features/hero/hero.component';

export const routes: Routes = [
  {
    path: '',
    component: HeroComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  }
];

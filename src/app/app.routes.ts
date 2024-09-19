import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppComponent } from './app.component';
import { ProgressComponent } from './progress/progress.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { provideRouter } from '@angular/router';
import {ErrorconfigComponent} from './errorconfig/errorconfig.component';
export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'progress/:id', component: ProgressComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'progress', component: ProgressComponent },
    { path: 'settings', component: ErrorconfigComponent },
];

export const appRoutingProviders = [
    provideRouter(routes)
  ];

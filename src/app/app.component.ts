import { Component } from '@angular/core';
import { RouterModule, RouterOutlet, Routes } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ProgressComponent } from './progress/progress.component';
import { ModalComponent } from './modal/modal.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ClickOutsideDirective } from './click-outside.directive';
import { IgxItemLegendModule, IgxDoughnutChartModule } from 'igniteui-angular-charts';
import { ErrorconfigComponent } from './errorconfig/errorconfig.component';
import { TooltipComponent } from './tooltip/tooltip.component';
import { register } from 'swiper/element/bundle';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    SidebarComponent, 
    MatSidenavModule, 
    MatButtonModule, 
    MatTabsModule,
    MatToolbarModule,
    DashboardComponent,
    ProgressComponent,
    CommonModule,    
    RouterModule,
    ModalComponent,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    ClickOutsideDirective,
    IgxItemLegendModule,
    IgxDoughnutChartModule,
    ErrorconfigComponent,
    TooltipComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dashboard-app';
  showFiller = false;
}

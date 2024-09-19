import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ModalService } from '../modal.service';
import { CommonModule } from '@angular/common';
import {ProductionDates, Units, ProjectData, Misc, ProjectDataAndMaterials, Weights, ProjectDataAndUnits, PurchasingStatus } from '../services/local.service';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { Router } from '@angular/router';
import { LocalService } from '../services/local.service';

interface ProductionDate {
  unitID: number;
  model: string;
  dateToBeProduced: string;
  amount: number;
}

interface GroupedDate {
  [model: string]: number;
}

interface GroupedDates {
  [date: string]: GroupedDate;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'] // Adjust the path as needed
})
export class ModalComponent implements OnInit, OnDestroy {
  isVisible = false;
  @Input() project: ProjectDataAndMaterials | null = null;
  @Input() miscData: Misc[] = [];  // Add miscData as an Input property
  @Input() purchasingStatus: PurchasingStatus[] = [];  // Add miscData as an Input property

  errorMessages: { [key: number]: string[] } = {}; // Store error messages for each project
  private subscription: Subscription = new Subscription();
  productionDates: ProductionDate[] = [];
  groupedDates: GroupedDates = {};
  uniqueModels: string[] = [];

  // Custom order map
  customOrderMap: { [key: string]: number } = {
    'Jan': 0, 'Jan-Feb': 1, 'Feb': 2, 'Feb-Mar': 3, 'Mar': 4, 'Mar-Apr': 5,
    'Apr': 6, 'Apr-May': 7, 'May': 8, 'May-Jun': 9, 'Jun': 10, 'Jun-Jul': 11,
    'Jul': 12, 'Jul-Aug': 13, 'Aug': 14, 'Aug-Sep': 15, 'Sep': 16, 'Sep-Oct': 17,
    'Oct': 18, 'Oct-Nov': 19, 'Nov': 20, 'Nov-Dec': 21, 'Dec': 22, 'Dec-Jan': 23
  };

  constructor(
    private modalService: ModalService, 
    private router: Router,
    private localService: LocalService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.modalService.visibility$.subscribe(isVisible => {
        this.isVisible = isVisible;
      })
    );

    this.subscription.add(
      this.modalService.project$.subscribe(project => {
        this.project = project;
        console.log('Project received:', project); // Log the project
        if (project) {
          this.checkForErrors(project);
          this.fetchProductionDates(project.units.map((unit: { unitID: any; }) => unit.unitID));
        }
      })
    );

    this.subscription.add(
      this.modalService.miscData$.subscribe(miscData => {
        this.miscData = miscData;
        console.log('Misc Data received:', miscData);
      })
    );

    this.subscription.add(
      this.localService.getProductionDates().subscribe(dates => {
        this.productionDates = dates as ProductionDate[];
        console.log('Production dates:', dates); // Log the production dates
        if (this.project) {
          this.processData();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  closeModal(): void {
    this.modalService.hide();
  }

  close(): void {
    this.modalService.close();
  }

  checkForErrors(project: ProjectDataAndMaterials): void {
    this.localService.getEmailsTable().subscribe(emails => {
      if (project.id != null) {
        this.localService.getWeights(3).subscribe((weights: Weights | undefined) => {
          if (weights) {
            const errors = this.localService.checkForErrors(project, emails, this.miscData, weights);
            const filteredErrors = errors.filter(error => !error.startsWith('Score'));
            this.errorMessages[project.id] = filteredErrors;
  
            console.log('Project ID:', project.id); // Log the project ID
            console.log('Error messages for project:', errors); // Log the error messages
            console.log('Error messages object:', this.errorMessages); // Log the entire error messages object to verify
            console.log(this.miscData);
          } else {
            console.error(`Weights not found for project ${project.id}`);
            this.errorMessages[project.id] = ['Weights not found'];
          }
        }, (error) => {
          console.error(`Error fetching weights for project ${project.id}:`, error);
          this.errorMessages[project.id] = ['Error fetching weights'];
        });
      }
    });
  }
  


  fetchProductionDates(unitIDs: number[]): void {
    this.subscription.add(
      this.localService.getProductionDates().subscribe(dates => {
        this.productionDates = dates.filter(date => unitIDs.includes(date.unitID) && date.amount > 0) as ProductionDate[];
        console.log('Filtered Production dates:', this.productionDates);
        this.processData(); // Call processData after filtering
      })
    );
  }

  processData(): void {
    if (!this.project) return;

    // Extract unique models used in the current project
    const modelsSet = new Set<string>();
    this.productionDates.forEach(date => modelsSet.add(date.model));
    this.uniqueModels = Array.from(modelsSet);

    // Group data by date
    this.groupedDates = this.productionDates.reduce((acc: GroupedDates, curr: ProductionDate) => {
      if (!acc[curr.dateToBeProduced]) {
        acc[curr.dateToBeProduced] = {};
      }
      acc[curr.dateToBeProduced][curr.model] = curr.amount;
      return acc;
    }, {});

    // Sort the dates based on the custom order
    this.groupedDates = Object.keys(this.groupedDates)
      .sort((a, b) => this.customOrderMap[a] - this.customOrderMap[b])
      .reduce((acc: GroupedDates, key: string) => {
        acc[key] = this.groupedDates[key];
        return acc;
      }, {});
  }

  getGroupedDatesKeys(): string[] {
    return Object.keys(this.groupedDates);
  }

  getCircleColor(dueDate: string, status: string): string {
    if (dueDate.includes("Rec'd")) {
      return 'green';
    } else if (dueDate.match(/^\d{1,2}\/\d{1,2}$/)) {
      return '#FFA500';
    } else if (!dueDate && status.toLowerCase().includes(" ") || dueDate.toLowerCase() === '?') {
      return '#FFA500';
    } else if (dueDate.toLowerCase() === '') {
      return 'red';
    } else {
      return '#ccc'; // Default color if none of the conditions match
    }
  }
  
  // Check if the date is Jan 1, 2000
  isNA(date: Date): boolean {
    const naDate = new Date(2000, 0, 1); // Jan 1, 2000
    return date.getTime() === naDate.getTime();
  }

  // Format the order date
  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return this.isNA(date) ? 'N/A' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Format the due date
  formatDueDate(dueDate: string): string {
    if (dueDate === 'Jan 1, 2000') {
      return 'N/A';
    } else if (dueDate === "Rec'd") {
      return 'Received';
    } else {
      return dueDate;
    }
  }

  // Format the status
  formatStatus(status: string): string {
    return status === 'Jan 1, 2000' ? 'N/A' : status;
  }

  getErrorMessage(error: string): string {
    if (error.startsWith('Shipping Scheduled') || error.startsWith('Purchasing Scheduled') || error.startsWith('Shipping In Progress') 
      || error.startsWith('Purchasing Errors') || error.startsWith('Purchasing In Progress') || error.startsWith('Shipping Error')) {
      return error;
    }
    return `Error: ${error}`;
  }
}

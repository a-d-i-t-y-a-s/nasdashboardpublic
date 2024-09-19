import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductionDates, Units, ProjectData, Misc, ProjectDataAndMaterials, Weights, ProjectDataAndUnits } from '../services/local.service';
import { ModalService, ProjectModelInfo } from '../modal.service';
import { ModalComponent } from '../modal/modal.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon'; 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { LocalService } from '../services/local.service';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    MatToolbarModule,
    MatTabsModule,
    RouterOutlet,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
  projectModelInfoList: any;  projectId: number | null = null; // Store the project ID from the route

  constructor(private localService: LocalService, 
    private modalService: ModalService, 
    private http: HttpClient,
    public dialog: MatDialog,
    private route: ActivatedRoute) { }

  
  units: Units[] = [];
  productionDates: ProductionDates[] = [];
  projectData: ProjectData[] = [];
  sampleProjects: ProjectData[] = [];
  sampleProjectsLength: number = 0;
  errorMessage: string | undefined;
  errorMessageOrder: string | null = null; // Add a new variable to store the error message
  errorMessages: { [key: number]: string[] } = {}; // Store error messages for each project
  loading: boolean = true; // Add a loading indicator

  activeProjects: number = 0;
  uniqueUnitIDs: number[] = []; // Array to store active unique unit IDs
  uniqueProjectDataIDs: number[] = []; // Array to store active uniqueProjectDataIDS

  projectsInProduction: ProjectDataAndMaterials[] = []; // Array to store projects in production
  projectsRampingUp: ProjectDataAndMaterials[] = [];    // Array to store projects ramping up
  projectsScheduled: ProjectDataAndMaterials[] = [];   // Array to store projects scheduled
  pilotsAndSamples: ProjectData[] = [];    // Array to store samples and pilots
  totalProjects: ProjectDataAndMaterials[] = [];       // Array to store all the data with some filters...
  filteredTotalProjects: ProjectDataAndMaterials[] = []; 


  completeProjects: ProjectData[] = [];      // Array to store completed projects
  nullProjectIDS: any[] = [];
  miscData: Misc[] = [];
  cumulativePercentages: { projectDataID: number, cumulativePercentage: number }[] = [];
  selectedCustomer: string = '';
  uniqueCustomers: string[] = [];
  projectDataAndUnits: (ProjectData & Units)[] = [];
  projectIdTS: number | null = null; // Store the project ID from the route
  project: ProjectDataAndMaterials | null = null; // Store the specific project


  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectIdTS = +params['id'];
      this.loadData();
    });
  }

  loadData(): void {
    this.localService.getUnitsTable().subscribe(
      unitsData => {
        this.units = unitsData;
        this.localService.getProductionDates().subscribe(
          productionDatesData => {
            this.productionDates = productionDatesData;
            this.localService.getProjectDataTable().subscribe(
              (projectData: ProjectData[]) => {
                this.projectData = projectData;
                this.localService.getMiscTable().subscribe(
                  miscData => {
                    this.miscData = miscData;
                    console.log('Misc Data:', this.miscData);
  
                    this.sampleProductions('Northern Sample');
                    this.projectDataAndUnits = this.getUnitsAndProjectData();
                    console.log('details:', this.projectDataAndUnits)
  
                    const cumulativePercentages = this.calculateCumulativePercentage();
                    console.log('Cumulative Percentages:', cumulativePercentages);
                    this.sortProjectsByCompletion();
      
                    this.generateProjectModelInfoList();
                    this.loadProjects();                   
                  },
                  (error: { message: string | undefined; }) => this.errorMessage = error.message
                );
              },
              (error: { message: string | undefined; }) => this.errorMessage = error.message
            );
          },
          error => this.errorMessage = error.message
        );
      },
      error => this.errorMessage = error.message
    );
  }
  

  loadProjects(): void {
    this.localService.mapProjectDataWithMaterials().subscribe(
      data => {
        // Set totalProjects to all data initially
        this.totalProjects = data;
  
        // Filter projects into categories
        this.projectsInProduction = this.localService.filterProjectsInProduction(data, this.miscData);
        this.projectsRampingUp = this.localService.filterProjectsRampingUp(data, this.miscData);
        this.projectsScheduled = this.localService.filterProjectsScheduled(data, this.miscData);
        this.pilotsAndSamples = this.sampleProjects;
  
        console.log("Projects in production:", this.projectsInProduction);
        console.log("Projects ramping up:", this.projectsRampingUp);
        console.log("Projects scheduled:", this.projectsScheduled);
        console.log("Pilots and samples:", this.pilotsAndSamples);
  
        // Exclude projects that are in the specified categories
        const projectIdsInCategories = new Set([
          ...this.projectsInProduction.map(p => p.id),
          ...this.projectsRampingUp.map(p => p.id),
          ...this.projectsScheduled.map(p => p.id),
          ...this.pilotsAndSamples.map(p => p.id)
        ]);
  
        console.log("Project IDs in categories:", Array.from(projectIdsInCategories));
  
        // Filter totalProjects to exclude projects in the categories
        this.filteredTotalProjects = this.totalProjects.filter(project => !projectIdsInCategories.has(project.id));
        this.filteredTotalProjects.sort((a, b) => a.jobName.localeCompare(b.jobName));

        console.log("Filtered total projects:", this.filteredTotalProjects);
  
        this.sampleProductions('Northern Sample');
        this.calculateCumulativePercentage();
        this.sortProjectsByCompletion();
        this.generateProjectModelInfoList();
        this.uniqueCustomers = this.getUniqueCustomers(this.totalProjects);
  
        this.localService.getEmailsTable().subscribe(
          emails => {
            this.errorMessages = {};
            const tableID = this.localService.getTableID();
            this.totalProjects.forEach(project => {
              if (project.id != null) {
                this.localService.getWeights(tableID).subscribe(
                  (weights: Weights | undefined) => {
                    if (weights) {
                      // Your existing logic here
                      const errorMessage = this.localService.checkForErrors(project, emails, this.miscData, weights);
                      if (errorMessage) {
                        const filteredErrors = errorMessage.filter(error => !error.startsWith('Score'));
                        this.errorMessages[project.id] = filteredErrors;
                      }
                    } else {
                      console.error('Weights data is undefined');
                      this.errorMessages[project.id] = ['Weights data is undefined'];
                    }
                  },
                  error => {
                    console.error(`Error fetching weights for project ${project.id}:`, error);
                    this.errorMessages[project.id] = ['Error fetching weights'];
                  }
                );
                
              }
            });
            console.log('Error messages:', this.errorMessages);
            if (this.projectIdTS !== null) {
              this.project = this.totalProjects.find(p => p.id === this.projectId) || null;
              console.log('Loaded project:', this.project);
            }
          },
          error => this.errorMessage = error.message
        );
      },
      error => this.errorMessage = error.message
    );
  }


  filterPilotsAndSamples(data: ProjectDataAndMaterials[]): ProjectData[] {
    return this.sampleProjects;
  }

  sampleProductions(customerName: string): void {
    this.sampleProjects = this.projectData.filter(project => 
      project.customer === customerName || project.jobName.toLowerCase().includes('pilot')
    );
    this.sampleProjectsLength = this.sampleProjects.length;
    console.log('Sample Projects:', this.sampleProjects);
  }
  

  getUnitsAndProjectData(): (ProjectData & Units)[] {
    return this.units.map(unit => {
      const project = this.projectData.find(p => p.id === unit.projectDataID);
      return {
        ...unit,
        id: project?.id || 0,
        productionID: project?.productionID || 0,
        projectID: project?.projectID || 0,
        customer: project?.customer || '',
        jobName: project?.jobName || '',
        finish: project?.finish || '',
        salesRep: project?.salesRep || '',
        completion: project?.completion || 0
      };
    });
  }

  getNotAssignedProjects(): Units[] {
    return this.units.filter(unit => unit.notAssigned);
  }

  generateProjectModelInfoList(): void { 
      const projectMap = new Map<number, ProjectDataAndUnits>();
      this.projectData.forEach(project => {
          projectMap.set(project.id, { ...project, units: [] });
      });

      this.units.forEach(unit => {
          const project = projectMap.get(unit.projectDataID);
          if (project) {
              project.units.push(unit);
          }
      });

      this.projectModelInfoList = Array.from(projectMap.values()).map(project => {
          return {
              projectID: project.id,
              jobName: project.jobName,
              productionID: project.productionID,
              customer: project.customer,
              model: project.units.map(u => u.model).join(', '),
              toBeProduced: project.units.reduce((sum, u) => sum + u.toBeProduced, 0),
              receivedQuantity: project.units.reduce((sum, u) => sum + u.receivedQuantity, 0),
              madeQuantity: project.units.reduce((sum, u) => sum + u.madeQuantity, 0)
          };
      });

      console.log('Project Model Info List:', this.projectModelInfoList);
  }

  calculateCumulativePercentage(): { projectDataID: number, cumulativePercentage: number }[] {
    const projectDataMap = new Map<number, { madeQuantity: number, receivedQuantity: number }>();
  
    // Aggregate quantities for each projectDataID
    this.units.forEach(unit => {
      if (!projectDataMap.has(unit.projectDataID)) {
        projectDataMap.set(unit.projectDataID, { madeQuantity: 0, receivedQuantity: 0 });
      }
      const projectData = projectDataMap.get(unit.projectDataID)!;
      projectData.madeQuantity += unit.madeQuantity;
      projectData.receivedQuantity += unit.receivedQuantity;
    });
  
    // Calculate cumulative percentage
    projectDataMap.forEach((quantities, projectDataID) => {
      let cumulativePercentage;
  
      if (quantities.madeQuantity === 0 && quantities.receivedQuantity === 0) {
        cumulativePercentage = 0;
      } else if (quantities.receivedQuantity > 0) {
        cumulativePercentage = (quantities.madeQuantity / quantities.receivedQuantity) * 100;
      } else {
        cumulativePercentage = 0;
      }
  
      this.cumulativePercentages.push({ projectDataID, cumulativePercentage });
    });
  
    return this.cumulativePercentages;
  }

  getCumulativePercentage(projectDataID: number): number {
    const project = this.cumulativePercentages.find(p => p.projectDataID === projectDataID);
    return project ? project.cumulativePercentage : 0;
  }

  sortProjectsByCompletion(): void {
    this.projectsInProduction.sort((a, b) => this.getCumulativePercentage(a.id) - this.getCumulativePercentage(b.id));
    this.projectsRampingUp.sort((a, b) => this.getCumulativePercentage(a.id) - this.getCumulativePercentage(b.id));
    this.projectsScheduled.sort((a, b) => this.getCumulativePercentage(a.id) - this.getCumulativePercentage(b.id));
    this.pilotsAndSamples.sort((a, b) => this.getCumulativePercentage(a.id) - this.getCumulativePercentage(b.id));
    this.totalProjects.sort((a, b) => {
      const nameA = a.jobName.toUpperCase(); // ignore upper and lowercase
      const nameB = b.jobName.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names must be equal
      return 0;
    });
  }

  ///////////////////////////////////////////MODAL STUFF////////////////////////////////////////////
  openModal(project: ProjectDataAndMaterials): void {
    console.log('Opening modal with project:', project); // Add this line for debugging
    this.modalService.show(project, this.miscData, project.purchasingStatus);
  }

  openModalSample(project: ProjectData): void {
    console.log('Opening modal with project:', project); // Add this line for debugging
    this.modalService.showSample(project);
  }

  getUniqueCustomers(projects: ProjectData[]): string[] {
    const customers = projects.map(project => project.customer);
    return Array.from(new Set(customers));
  }

  filterProjectsByCustomer(): void {
    if (this.selectedCustomer) {
      this.filteredTotalProjects = this.totalProjects.filter(project => project.customer === this.selectedCustomer);
    } else {
      this.filteredTotalProjects = this.totalProjects;
    }
    console.log("filtered total projects:", this.filteredTotalProjects);
  }

  markAsComplete(projectId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.localService.markAsComplete(projectId).subscribe(() => {
          // Refresh project data after marking as complete
          this.projectData = this.projectData.map(project => {
            if (project.id === projectId) {
              project.completion = 1;
            }
            return project;
          });
          //this.excelService.separateProjects(this.projectDataAndUnits, this.miscData); // Refresh the views
          this.loadProjects();
        }, error => {
          console.error('Error marking project as complete', error);
        });
      }
    });
  }

  markAsUncomplete(projectId: number): void {
    this.localService.markAsUncomplete(projectId).subscribe(() => {
      this.projectData = this.projectData.map(project => {
        if (project.id === projectId) {
          project.completion = 0;
        }
        return project;
      });
    }, error => {
      console.error('Error marking project as uncomplete', error);
    });
  }

  hasNonScoreErrors(projectId: number): boolean {
    if (!this.errorMessages[projectId]) {
      return false;
    }
    return this.errorMessages[projectId].some((error: string) => !error.includes('Score') && !error.includes('Shipping In Progress') 
                                                                  && !error.includes('Shipping Scheduled') && !error.includes('Purchasing Scheduled'));
  }
}


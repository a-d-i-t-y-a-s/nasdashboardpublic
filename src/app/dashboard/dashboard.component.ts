import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductionDates, Units, ProjectData, Misc, ProjectDataAndMaterials, Weights, ProjectDataAndUnits, Emails } from '../services/local.service';
import moment from 'moment';
import { forkJoin, Observable, tap } from 'rxjs';
import { Router, RouterOutlet } from '@angular/router';
import { ModalService } from '../modal.service';
import { ModalComponent } from '../modal/modal.component';
import { timingSafeEqual } from 'node:crypto';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon'; 
import { TooltipComponent } from '../tooltip/tooltip.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LocalService } from '../services/local.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    RouterOutlet,
    MatSlideToggleModule,
    MatIconModule,
    TooltipComponent,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  productionProjects: number = 0;

  constructor(
    private modalService: ModalService, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private localService: LocalService) { }
  units: Units[] = [];
  productionDates: ProductionDates[] = [];
  projectData: ProjectData[] = [];
  sampleProjects: ProjectData[] = [];
  sampleProjectsLength: number = 1;
  errorMessage: string | undefined;
  activeProjects: number = 0;
  uniqueUnitIDs: number[] = []; // Array to store active unique unit IDs
  uniqueProjectDataIDs: number[] = []; // Array to store active uniqueProjectDataIDS
  activeCustomers: string[] = [];
  totalUniqueCustomers: number = 0;
  uniqueModelsData: any[] = [];
  nullProjectIDS: any[] = [];
  notAssignedData: any[] = [];
  notAssignedDataDetails: (ProjectData & Units)[] = [];
  projectsScheduledArray: ProjectData[] = []; // Array to store scheduled Projects
  miscData: Misc[] = [];
  tableVisibility: { [key: string]: boolean } = {
    nullProjectIDS: false,
    notAssignedDataDetails: false,
    errorMessages: false // Add new entry for error messages table visibility
  };

  projectDataAndUnits: (ProjectData & Units)[] = [];
  errorMessages: { [key: number]: string[] } = {}; // Store error messages for each project
  projectsWithData: ProjectDataAndMaterials[] = []; // To store the projects with materials
  projectsWithUnassignedOrders: ProjectDataAndMaterials[] = [];
  hoveredProject: ProjectDataAndMaterials | null = null; // Add this property

  projectsInProduction: ProjectDataAndMaterials[] = [];
  projectsRampingUp: ProjectDataAndMaterials[] = [];
  projectsScheduled: ProjectDataAndMaterials[] = [];
  productionErrorPercentage: number = 0;
  productionNoErrorPercentage: number = 0;
  rampingUpErrorPercentage: number = 0;
  rampingUpNoErrorPercentage: number = 0;
  scheduledErrorPercentage: number = 0;
  scheduledNoErrorPercentage: number = 0;

  score: number = 0;
  sliderChecked = false;
  sliderDisabled = false;
  weights: Weights | undefined;
  weightsArray: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  tableID = this.localService.getTableID(); // Assuming you have a method to get the project ID

  profileName: string = '';
  profileNames: String[] = []; // Array to store profile names

  toggleSlider() {
    this.sliderChecked = !this.sliderChecked;
  }


  toggleTable(table: string): void {
    this.tableVisibility[table] = !this.tableVisibility[table];
  }

  handleMouseEnter(table: string) {
    if (this.isTableVisible(table)) {
      this.toggleTable(table);
    }

  }

  isTableVisible(table: string): boolean {
    return this.tableVisibility[table];
  }

  getNullProjectIDSCount(): number {
    return this.nullProjectIDS.length;
  }

  getNotAssignedDataDetailsCount(): number {
    return this.notAssignedDataDetails.length;
  }

  ngOnInit(): void {
    this.loadData();
    this.getProfileName(this.tableID);
    this.loadProfileNames(); // Load profile names on initialization
  }

  reloadPage() {
    window.location.reload();
  }

  reloadColors(): void {
    this.projectsInProduction = this.sortProjectsByError(this.projectsInProduction);
    this.projectsRampingUp = this.sortProjectsByError(this.projectsRampingUp);
    this.projectsScheduled = this.sortProjectsByError(this.projectsScheduled);
  }

  // loadData(): void {
  //   this.localService.getUnitsTable().subscribe(
  //     unitsData => {
  //       this.units = unitsData;
  //       this.localService.getProductionDates().subscribe(
  //         productionDatesData => {
  //           this.productionDates = productionDatesData;
  //           this.localService.getProjectDataTable().subscribe(
  //             (projectData: ProjectData[]) => {
  //               this.projectData = projectData;
  //               this.localService.getMiscTable().subscribe(
  //                 miscData => {
  //                   this.miscData = miscData;
  //                   console.log('Misc Data:', this.miscData);
  //                   this.projectDataAndUnits = this.getUnitsAndProjectData();
  
  //                   // Example of processing data
  //                   this.sampleProductions('Northern Sample');
  //                   this.processData();
  
  //                   this.uniqueModelsData = this.findUniqueModels();
  //                   console.log('Unique Models Data:', this.uniqueModelsData);
                    
  //                   this.nullProjectIDS = this.localService.getProjectsWithZeroIDs(this.projectData); // Updated line
  //                   console.log('Projects without IDs:', this.nullProjectIDS);
  
  //                   this.notAssignedData = this.getNotAssignedProjects();
  //                   console.log('Projects with stuff not assigned:', this.notAssignedData);

  //                  this.notAssignedDataDetails = this.getNotAssignedProjectDetails();
  //                  console.log('details:', this.notAssignedDataDetails)

  //                   this.sortNotAssignedDataDetails();
                    
  //                   this.localService.mapProjectDataWithMaterials().subscribe(
  //                     (projectsWithData: ProjectDataAndMaterials[]) => {
  //                       this.projectsWithData = projectsWithData;
  //                       this.loadEmails();
  //                     },
  //                     error => console.error('Error loading project data with materials:', error)
  //                   );
  //                   this.calculateScore();
  //                 },
  //                 (error: { message: string | undefined; }) => this.errorMessage = error.message
  //               );
  //             },
  //             (error: { message: string | undefined; }) => this.errorMessage = error.message
  //           );
  //         },
  //         error => this.errorMessage = error.message
  //       );
  //     },
  //     error => this.errorMessage = error.message
  //   );
  // }

loadData(): void {
  forkJoin({
    unitsData: this.localService.getUnitsTable(),
    productionDatesData: this.localService.getProductionDates(),
    projectData: this.localService.getProjectDataTable(),
    miscData: this.localService.getMiscTable(),
  }).subscribe({
    next: ({ unitsData, productionDatesData, projectData, miscData }) => {
      this.units = unitsData;
      this.productionDates = productionDatesData;
      this.projectData = projectData;
      this.miscData = miscData;

      console.log('Units Data:', this.units);
      console.log('Production Dates:', this.productionDates);
      console.log('Project Data:', this.projectData);
      console.log('Misc Data:', this.miscData);

      this.projectDataAndUnits = this.getUnitsAndProjectData();

      // Process data
      this.sampleProductions('Northern Sample');
      this.processData();

      this.uniqueModelsData = this.findUniqueModels();
      console.log('Unique Models Data:', this.uniqueModelsData);

      this.nullProjectIDS = this.getProjectsWithZeroIDs();
      console.log('Projects without IDs:', this.nullProjectIDS);

      this.notAssignedData = this.getNotAssignedProjects();
      console.log('Projects with not assigned:', this.notAssignedData);

      this.notAssignedDataDetails = this.getNotAssignedProjectDetails();
      console.log('Not Assigned Data Details:', this.notAssignedDataDetails);

      this.sortNotAssignedDataDetails();

      // Fetch projects with materials
      this.localService.mapProjectDataWithMaterials().subscribe({
        next: (projectsWithData: ProjectDataAndMaterials[]) => {
          this.projectsWithData = projectsWithData;
          console.log('Projects With Data:', this.projectsWithData);

          this.loadEmails();
        },
        error: (error) => console.error('Error loading project data with materials:', error)
      });

      this.calculateScore();
    },
    error: (error) => {
      this.errorMessage = error.message;
      console.error('Error loading initial data:', error);
    }
  });
}


  checkAllProjectsForErrors(emails: Emails[]): void {
    this.errorMessages = {};
    const tableID = this.localService.getTableID();
    this.projectsWithData.forEach(project => {
      if (project.id != null) {
        this.localService.getWeights(tableID).subscribe(
          (weights: Weights | undefined) => {
            if (weights) {
              const errors = this.localService.checkForErrors(project, emails, this.miscData, weights);
              this.errorMessages[project.id] = errors;
            } else {
              console.error(`Weights not found for project ${project.id}`);
              this.errorMessages[project.id] = ['Weights not found'];
            }
          },
          (error) => {
            console.error(`Error fetching weights for project ${project.id}:`, error);
            this.errorMessages[project.id] = ['Error fetching weights'];
          }
        );
      }
    });
  }

  calculateScore(): void {
    if (!this.hoveredProject) {
      this.score = 0;
      return;
    }

    const errors = this.errorMessages[this.hoveredProject.id];
    if (errors && errors.length > 0) {
      const lastError = errors[errors.length - 1];
      const scoreMatch = lastError.match(/Score: (\d+)/);
      console.log("last error:", lastError);
      if (scoreMatch) {
        this.score = parseInt(scoreMatch[1], 10);
      } else {
        this.score = 0;
      }
    } else {
      this.score = 0;
    }
  }
  

  calculateErrorPercentages(): void {
    const projectsInProduction = this.localService.filterProjectsInProduction(this.projectsWithData, this.miscData);
    const projectsRampingUp = this.localService.filterProjectsRampingUp(this.projectsWithData, this.miscData);
    const projectsScheduled = this.localService.filterProjectsScheduled(this.projectsWithData, this.miscData);

    this.projectsInProduction = projectsInProduction;
    this.projectsRampingUp = projectsRampingUp;
    this.projectsScheduled = projectsScheduled;

    console.log("Projects in production:", this.projectsInProduction);
    console.log("Projects Ramping Up:", this.projectsRampingUp);
    console.log("Projects Scheduled:", this.projectsScheduled);

    const productionErrors = projectsInProduction.filter(project => this.errorMessages[project.id] !== null).length;
    const rampingUpErrors = projectsRampingUp.filter(project => this.errorMessages[project.id] !== null).length;
    const scheduledErrors = projectsScheduled.filter(project => this.errorMessages[project.id] !== null).length;

    this.productionErrorPercentage = (productionErrors / projectsInProduction.length) * 100;
    this.productionNoErrorPercentage = 100 - this.productionErrorPercentage;
    this.rampingUpErrorPercentage = (rampingUpErrors / projectsRampingUp.length) * 100;
    this.rampingUpNoErrorPercentage = 100 - this.rampingUpErrorPercentage;
    this.scheduledErrorPercentage = (scheduledErrors / projectsScheduled.length) * 100;
    this.scheduledNoErrorPercentage = 100 - this.scheduledErrorPercentage;

    console.log("production error percent:", this.productionErrorPercentage);
    console.log("ramping up error percent", this.rampingUpNoErrorPercentage);
    console.log("scehduled error percent", this.scheduledErrorPercentage);
    this.totalUniqueCustomers = this.uniqueCustomers();

  }

  processData(): void {
    const seenProjectDataIDs = new Set<number>();
    const unitIdToProjectDataId = new Map<number, number>();
    const separatedProjects = this.localService.separateProjects(this.projectDataAndUnits, this.miscData);


    // Create a map of unitID to projectDataID from units
    this.units.forEach(unit => {
      unitIdToProjectDataId.set(unit.unitID, unit.projectDataID);
    });

    // Check productionDates and track unique projectDataIDs and corresponding unitIDs
    this.productionDates.forEach(productionDate => {
      const projectDataID = unitIdToProjectDataId.get(productionDate.unitID);
      if (projectDataID !== undefined && !seenProjectDataIDs.has(projectDataID)) {
        seenProjectDataIDs.add(projectDataID);
        this.activeProjects++;
        this.uniqueUnitIDs.push(productionDate.unitID); // Store the unitID
        this.uniqueProjectDataIDs.push(projectDataID); // Store the projectDataID
      }
    });

    console.log('Unique Project Data IDs Count:', this.activeProjects);
    console.log('Unique Unit IDs:', this.uniqueUnitIDs);
    console.log('Unique Project Data IDs:', this.uniqueProjectDataIDs); // Log the unique projectDataIDs
    this.productionProjects = separatedProjects.projectsInProduction.length;
    console.log('Projects in Production:', this.productionProjects);

    this.projectsScheduledArray = separatedProjects.projectsScheduled;
    console.log('Projects Scheduled:', this.productionProjects);

  }

  loadEmails(): void {
    this.localService.getEmailsTable().subscribe(
      (emails: Emails[]) => {
        console.log('Emails:', emails);
        this.checkAllProjectsForErrors(emails);
        this.calculateErrorPercentages();
        // Sort the projects after checking for errors
        this.projectsInProduction = this.sortProjectsByError(this.projectsInProduction);
        this.projectsRampingUp = this.sortProjectsByError(this.projectsRampingUp);
        this.projectsScheduled = this.sortProjectsByError(this.projectsScheduled);
      },
      error => console.error('Error loading emails:', error)
    );
  }

  private hasErrorMessage(project: ProjectDataAndMaterials): boolean {
    const errorMessages = this.errorMessages[project.id];
    const hasUnitsNotAssignedError = Array.isArray(errorMessages) && errorMessages.some(error => error.startsWith('MISSING BOM'));
    const isNotCompleted = project.completion === 0;
    const isNotSample = !project.jobName.toLowerCase().includes('sample');
    return hasUnitsNotAssignedError && isNotCompleted && isNotSample;
  }

  
  getErrorProjects(): ProjectDataAndMaterials[] {
    const errorProjects = this.projectsWithData.filter(project => this.hasErrorMessage(project));
    console.log('Projects with errors and not completed:', errorProjects);
    return errorProjects;
  }
  
  getErrorMessagesCount(): number {
    return this.projectsWithData.filter(project => this.hasErrorMessage(project)).length;
  }

  hasError(project: ProjectDataAndMaterials): boolean {
    const errors = this.errorMessages[project.id];
    return errors && errors.length > 0;
  }
  

  getProjectColor(project: ProjectDataAndMaterials): string {
    const errors = this.errorMessages[project.id];
  
    // Colors for the projects
    const Tier1 = "#076189";
    const Tier2 = '#75d69d';
    const Tier3 = '#FFA500';
    const Tier4 = '#FF5733';
    const Tier5 = '#e22941';
  
    if (!errors || errors.length === 0) {
      return Tier1; // Green if no error
    }
  
    const lastError = errors[errors.length - 1];
    let score = 0;
  
    // Extract the score from the last error message
    const scoreMatch = lastError.match(/Score: (\d+)/);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    }
  
    // Determine the tier based on the score
    if (score >= 81) {
      return Tier1;
    } else if (score >= 66) {
      return Tier2;
    } else if (score >= 50) {
      return Tier3;
    } else if (score >= 35) {
      return Tier4;
    } else if (score > 0) {
      return Tier5;
    }
  
    // Default color if score is not found or is invalid
    return '#ccc';
  }

  hasPilotJobName(project: any): boolean {
    return project.jobName.toLowerCase().includes('pilot');
  }


  getProjectById(productionId: number, projectId: number): ProjectDataAndMaterials | undefined {
    return this.projectsWithData.find(p => p.productionID === productionId && p.projectID === projectId);
}

getProfileName(id: number): void {
  this.localService.getWeightsName(id).subscribe(name => {
    if (name !== undefined) {
      this.profileName = name;
      console.log("Profile name is: ", name);
    } else {
      // Handle the case where name is undefined
      console.error("Profile name is undefined.");
    }
  });
}

loadProfileNames(): void {
  this.localService.getProfileNames().subscribe(
    (names: string[]) => {
      this.profileNames = names;
      console.log("Profile names:" , this.profileNames);
    },
    error => {
      this.errorMessage = `Error loading profile names: ${error.message}`;
    }
  );
}

onProfileNameChange(profileName: string): void {
  this.localService.getWeightsByProfileName(profileName).subscribe(
    (weights: Weights | undefined) => {
      if (weights) {
        this.weightsArray = [
          weights.id,
          weights.clericalDataWeight,
          weights.confirmationReceived,
          weights.hasOrderedMats,
          weights.allUnitsAssigned,
          weights.materialsOnTime,
          weights.batchPaperwork,
          weights.percentComplete,
          weights.deliveriesOnTime,
          weights.hasBOM
        ];
        this.tableID = weights.id;
        this.localService.setTableIDValueLocal(this.tableID);
        this.updateRelatedData();
      } else {
        // Handle the undefined case
        this.errorMessage = `No weights found for profile ${profileName}.`;
      }
    },
    error => {
      this.errorMessage = `Error loading weights for profile ${profileName}: ${error.message}`;
    }
  );
}

updateRelatedData(): void {
  // Add any logic here to update related data based on the new weights
  // For example, if you need to recalculate scores or update the UI
  this.calculateScore();
  this.calculateErrorPercentages();
  this.reloadColors();
  this.reloadPage();
}

  goToProgress(productionId: number | undefined, projectID: number | undefined): void {
    console.log("Production ID is:", productionId)
    
    if (productionId !== undefined && projectID !== undefined) {
      const project = this.getProjectById(productionId, projectID);
      console.log("project progress: ", project);
      if (project) {
        // Ensure dates are correctly parsed and formatted
        this.localService.getMiscTable().subscribe(miscData => {
          console.log("word Misc:", miscData);
          this.modalService.show(project, miscData, project.purchasingStatus);
        });
        // this.router.navigate(['/progress', productionId]).then(() => {
        //   this.modalService.show(project);
        // });
      } else {
        console.error('Project not found');
      }
    } else {
      console.error('Project ID is undefined');
    }
  }

  sortProjectsByError(projects: ProjectDataAndMaterials[]): ProjectDataAndMaterials[] {
    return projects.sort((a, b) => {
      const getScoreFromErrors = (errors: string[]): number => {
        if (!errors || errors.length === 0) return 0;
        const lastError = errors[errors.length - 1];
        const scoreMatch = lastError.match(/Score: (\d+)/);
        return scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      };
  
      const aScore = getScoreFromErrors(this.errorMessages[a.id]);
      const bScore = getScoreFromErrors(this.errorMessages[b.id]);
      if (aScore < bScore) {
        return -1; // a comes before b
      } else if (bScore > aScore) {
        return 1; // b comes before a
      } else {
        return 0; // maintain original order if they have the same tier
      }
    });
  }
  
  showProjectDetails(project: ProjectDataAndMaterials): void {
    this.hoveredProject = project;
    this.calculateScore();
  }

  hideProjectDetails(): void {
    this.hoveredProject = null;
  }

  getUnitsNotAssignedCount(): number {
    if (!this.hoveredProject || !this.errorMessages[this.hoveredProject.id]) {
      return 0;
    }
  
    const errorMessage = this.errorMessages[this.hoveredProject.id].find(error => error.startsWith('UNITS NOT ASSIGNED:'));
    if (errorMessage) {
      const match = errorMessage.match(/UNITS NOT ASSIGNED: (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  }

  isError(errorType: string): boolean {
    if (!this.hoveredProject || !this.errorMessages[this.hoveredProject.id]) {
      return false;
    }
  
    // Check for specific error types
    if (errorType === 'UNITS NOT ASSIGNED') {
      return this.errorMessages[this.hoveredProject.id].some(error => error.startsWith('UNITS NOT ASSIGNED'));
    }

    if (errorType === 'ORDER DATE PASSED') {
      return this.errorMessages[this.hoveredProject.id].some(error =>
        error.startsWith('ALUMINUM ORDER DATE PASSED') ||
        error.startsWith('GLASS ORDER DATE PASSED') ||
        error.startsWith('HARDWARE ORDER DATE PASSED')
      );
    }
  
    return this.errorMessages[this.hoveredProject.id].includes(errorType);
  }

  getLabel(errorType: string, presentText: string, missingText: string): string {
    if (!this.isError(errorType) || !this.hoveredProject) {
      return missingText;
    }
  
    let detailedMessage = presentText;
  
    if (errorType === 'ORDER DATE PASSED') {
      const errors = this.errorMessages[this.hoveredProject.id];
      const passedOrders = errors.filter(error =>
        error.startsWith('ALUMINUM ORDER DATE PASSED') ||
        error.startsWith('GLASS ORDER DATE PASSED') ||
        error.startsWith('HARDWARE ORDER DATE PASSED')
      );
  
      if (passedOrders.length > 0) {
        detailedMessage += '\n' + passedOrders.join('\n');
      }
    }
  
    return detailedMessage;
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

  parseDateRange(dateRangeStr: string): { start: moment.Moment, end: moment.Moment } | null {
    const monthDayRegex = /^([a-zA-Z]+) (\d+) - (\d+)$/;
    const monthMonthDayRegex = /^([a-zA-Z]+)-([a-zA-Z]+) (\d+) - (\d+)$/;

    let match = monthDayRegex.exec(dateRangeStr);
    if (match) {
      const month = match[1];
      const startDay = parseInt(match[2], 10);
      const endDay = parseInt(match[3], 10);
      const startDate = moment(`${month} ${startDay}`, 'MMMM D');
      const endDate = moment(`${month} ${endDay}`, 'MMMM D');
      return { start: startDate, end: endDate };
    }

    match = monthMonthDayRegex.exec(dateRangeStr);
    if (match) {
      const startMonth = match[1];
      const endMonth = match[2];
      const startDay = parseInt(match[3], 10);
      const endDay = parseInt(match[4], 10);
      const startDate = moment(`${startMonth} ${startDay}`, 'MMMM D');
      const endDate = moment(`${endMonth} ${endDay}`, 'MMMM D');
      return { start: startDate, end: endDate };
    }

    return null;
  }

  isDateInRange(dateRange: { start: moment.Moment, end: moment.Moment }, weekStart: moment.Moment, weekEnd: moment.Moment): boolean {
    return dateRange.start.isBetween(weekStart, weekEnd, undefined, '[]') || dateRange.end.isBetween(weekStart, weekEnd, undefined, '[]');
  }

  sampleProductions(customerName: string): void {
    this.sampleProjects = this.projectData.filter(project =>
      project.customer === customerName || project.jobName.includes('Pilot') && project.completion == 0
    );
    this.sampleProjectsLength = this.sampleProjects.length;
    console.log('Sample Projects:', this.sampleProjects);
  }
  
  uniqueCustomers(): number {
    const allProjects = [
      ...this.projectsInProduction,
      ...this.projectsRampingUp,
      ...this.projectsScheduled
    ];
  
    console.log('All Projects for Unique Customers:', allProjects);
  
    // Create a set of unique customers from all projects
    const uniqueCustomersSet = new Set(allProjects.map(project => project.customer));
  
    // Store the unique customers in this.activeCustomers for further use
    this.activeCustomers = Array.from(uniqueCustomersSet);
  
    console.log('Active Customers:', this.activeCustomers);
  
    // Return the number of unique customers
    return uniqueCustomersSet.size;
  }

  findUniqueModels(): { model: string, toBeProduced: number, receivedQuantity: number, madeQuantity: number }[] {
    const modelMap = new Map<string, { toBeProduced: number, receivedQuantity: number, madeQuantity: number }>();

    this.units.forEach(unit => {
      if (!modelMap.has(unit.model)) {
        modelMap.set(unit.model, { toBeProduced: 0, receivedQuantity: 0, madeQuantity: 0 });
      }
      const modelData = modelMap.get(unit.model)!;
      modelData.toBeProduced += unit.toBeProduced;
      modelData.receivedQuantity += unit.receivedQuantity;
      modelData.madeQuantity += unit.madeQuantity;
    });

    const uniqueModelsData: { model: string; toBeProduced: number; receivedQuantity: number; madeQuantity: number; }[] = [];
    modelMap.forEach((value, key) => {
      uniqueModelsData.push({ model: key, ...value });
    });

    return uniqueModelsData;
  }
  
  sortData(order: 'largest' | 'smallest'): void {
    this.uniqueModelsData.sort((a, b) => {
      const totalA = a.toBeProduced + a.receivedQuantity + a.madeQuantity;
      const totalB = b.toBeProduced + b.receivedQuantity + b.madeQuantity;
      return order === 'largest' ? totalB - totalA : totalA - totalB;
    });
  }

  getProjectsWithZeroIDs(): ProjectData[] {
    return this.projectData.filter(project =>
      (project.productionID === 0 || project.projectID === 0) && project.customer !== 'Northern Sample'
    );
  }

  getNotAssignedProjects(): Units[] {
    return this.units.filter(unit => unit.notAssigned);
  }


  getNotAssignedProjectDetails(): (ProjectData & Units)[] {
    const notAssignedUnits = this.getNotAssignedProjects();

    return notAssignedUnits
        .map(unit => {
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
        })
        .filter(mappedUnit => 
            !mappedUnit.jobName.toLowerCase().includes('sample') && 
            !mappedUnit.jobName.toLowerCase().includes('pilot') &&
            !mappedUnit.completion
        );
  }

  //Sort the data for the units missing table
  sortNotAssignedDataDetails(): void {
    this.notAssignedDataDetails = this.notAssignedDataDetails
        .filter(unit => unit.customer !== 'Northern Sample')
        .sort((a, b) => b.toBeProduced - a.toBeProduced);
  }
}


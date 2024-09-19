/*
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, forkJoin, ConnectableObservable, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

export class ExcelService {
  private apiUrl = ''; // Update with your actual API URL
  private weightsSubject = new BehaviorSubject<Weights | null>(null);
  weights$ = this.weightsSubject.asObservable();
  private tableID: number = 3; // Default value
  private tableIDKey = 'tableID';
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const storedTableID = localStorage.getItem(this.tableIDKey);
      this.tableID = storedTableID ? Number(storedTableID) : 3;
      console.log(`Constructor: tableID loaded from localStorage: ${this.tableID}`);
    }
   }

  setTableIDValueLocal(tableID: number): void {
    localStorage.setItem(this.tableIDKey, tableID.toString());
  }

  getProductionDates(): Observable<ProductionDates[]> {
    const endpoint = "productiontabledates";
    return this.http.get<ProductionDates[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('ProductionDates:', data)) // Log the data for debugging
    );
  }

  getUnitsTable(): Observable<Units[]> {
    const endpoint = "unitsTable"; 
    return this.http.get<Units[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Units:', data)) // Log the data for debugging
    );
  }

  getProjectDataTable(): Observable<ProjectData[]> {
    const endpoint = "projectDataTable"; 
    return this.http.get<ProjectData[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Project Data:', data)) // Log the data for debugging
    );
  }

  getPurchasingStatusTable(): Observable<PurchasingStatus[]> {
    const endpoint = "purchasingStatusTable";
    return this.http.get<PurchasingStatus[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Purchasing Status:', data)) // Log the data for debugging
    );
  }

  getMiscTable(): Observable<Misc[]> {
    const endpoint = "miscTable";
    return this.http.get<Misc[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Misc:', data)) // Log the data for debugging
    );
  }

  getEmailsTable(): Observable<Emails[]> {
    const endpoint = "emailsTable";
    return this.http.get<Emails[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Emails:', data)) // Log the data for debugging
    );
  }

  getAluminumTable(): Observable<Aluminum[]> {
    const endpoint = "aluminumTable";
    return this.http.get<Aluminum[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Aluminum:', data)) // Log the data for debugging
    );
  }

  getHardwareTable(): Observable<Hardware[]> {
    const endpoint = "hardwareTable";
    return this.http.get<Hardware[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Hardware:', data)) // Log the data for debugging
    );
  }

  getGlassTable(): Observable<Glass[]> {
    const endpoint = "glassTable";
    return this.http.get<Glass[]>(`${this.apiUrl}/${endpoint}`).pipe(
      tap(data => console.log('Glass:', data)) // Log the data for debugging
    );
  }

  markAsComplete(projectId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/completeProject/${projectId}`, {});
  }
  
  markAsUncomplete(projectId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/uncompleteProject/${projectId}`, {});
  }

  
  getWeights(id: number): Observable<Weights> {
    return this.http.get<Weights>(`${this.apiUrl}/${id}`).pipe(
      tap(weights => this.weightsSubject.next(weights)) // Update the global weights
    );
  }

  getWeightsName(id: number): Observable<String> {
    return this.http.get(`${this.apiUrl}/${id}/name`, { responseType: 'text' }).pipe(
      tap(name => console.log(`Fetched name: ${name}`)) // Optionally log the name
    );
  }

  setTableID(tableID: number): void {
    this.getWeights(tableID).subscribe();
  }

  getTableID(): number {
    if (isPlatformBrowser(this.platformId)) {
      const storedTableID = localStorage.getItem(this.tableIDKey);
      const tableID = storedTableID ? Number(storedTableID) : 3;
      console.log(`getTableID: Retrieved tableID from localStorage: ${tableID}`);
      return tableID;
    } else {
      return this.tableID;
    }
  }
  

  setTableIDValue(tableID: number): void {
      this.tableID = tableID;
  }

  addWeights(weights: Weights): Observable<Weights> {
    return this.http.post<Weights>(`${this.apiUrl}/addWeights`, weights).pipe(
      tap(newWeights => {
        this.weightsSubject.next(newWeights); // Optionally update the global weights if necessary
      })
    );
  }

  getWeightsByProfileName(profileName: string): Observable<Weights> {
    return this.http.get<Weights>(`${this.apiUrl}/profile/${profileName}`);
  }

  getProfileNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/names`);
  }

  separateProjects(projectDataAndUnits: any[], miscData: any[]): any {
    const combinedProjectsMap = new Map<number, ProjectDataAndMaterials>();

    projectDataAndUnits.forEach(projectUnit => {
      const existingProject = combinedProjectsMap.get(projectUnit.projectDataID);

      if (existingProject) {
        if (!existingProject.units) {
          existingProject.units = [];
        }
        existingProject.units.push({
          unitID: projectUnit.unitID,
          projectDataID: projectUnit.projectDataID,
          model: projectUnit.model,
          toBeProduced: projectUnit.toBeProduced,
          receivedQuantity: projectUnit.receivedQuantity,
          madeQuantity: projectUnit.madeQuantity,
          notAssigned: projectUnit.notAssigned,
          productionLine: projectUnit.productionLine
        });
      } else {
        combinedProjectsMap.set(projectUnit.projectDataID, {
          ...projectUnit,
          units: [{
            unitID: projectUnit.unitID,
            projectDataID: projectUnit.projectDataID,
            model: projectUnit.model,
            toBeProduced: projectUnit.toBeProduced,
            receivedQuantity: projectUnit.receivedQuantity,
            madeQuantity: projectUnit.madeQuantity,
            notAssigned: projectUnit.notAssigned,
            productionLine: projectUnit.productionLine
          }]
        });
      }
    });

    // Ensure each project has an empty array for aluminum, glass, and hardware
    combinedProjectsMap.forEach((value, key) => {
      if (!value.aluminum) {
        value.aluminum = [];
      }
      if (!value.glass) {
        value.glass = [];
      }
      if (!value.hardware) {
        value.hardware = [];
      }
    });

    const combinedProjects = Array.from(combinedProjectsMap.values());

    const projectsInProduction = combinedProjects.filter(project => {
      if (project.completion === 1 || project.customer === 'Northern Sample') return false;
      const units = project.units;
      return units.some(unit => unit.madeQuantity > 0 && unit.madeQuantity !== unit.receivedQuantity);
    });

    const projectsRampingUp = combinedProjects.filter(project => {
      if (project.completion === 1 || project.customer === 'Northern Sample') return false;
      const units = project.units;
      const misc = miscData.find(m => m.projectDataID === project.id);

      if (!misc) {
        console.log(`No misc data found for project ${project.id}`);
        return false;
      }

      const noCompletedInMessages = ['message1', 'message2', 'message3', 'message4', 'message5']
        .every(key => {
          const message = misc[key] || '';
          return !message.toLowerCase().includes('complete');
        });

      return units.every(unit => unit.madeQuantity === 0 && unit.notAssigned) && noCompletedInMessages;
    });

    const projectsScheduled = combinedProjects.filter(project => {
      if (project.completion === 1 || project.customer === 'Northern Sample') return false;
      const units = project.units;
      const misc = miscData.find(m => m.projectDataID === project.id);

      if (!misc) {
        console.log(`No misc data found for project ${project.id}`);
        return false;
      }

      const noCompletedInMessages = ['message1', 'message2', 'message3', 'message4', 'message5']
        .every(key => {
          const message = misc[key] || '';
          return !message.toLowerCase().includes('complete');
        });

      return units.every(unit => unit.madeQuantity === 0) &&
             units.some(unit => unit.receivedQuantity > 0 && unit.notAssigned < unit.receivedQuantity)
             && noCompletedInMessages;
    });

    const pilotsAndSamples = combinedProjects.filter(project => project.customer === 'Northern Sample');

    const totalProjects = combinedProjects.filter(project => {
      const units = project.units;
      const isProduction = units.some(unit => unit.madeQuantity > 0);
      const isRampingUp = units.every(unit => unit.madeQuantity === 0 && !unit.notAssigned);
      const isScheduled = units.every(unit => unit.madeQuantity === 0) &&
                          units.some(unit => unit.receivedQuantity > 0 && unit.notAssigned < unit.receivedQuantity);
      const isPilotSample = project.customer === 'Northern Sample';
      return isProduction || isRampingUp || isScheduled || isPilotSample;
    });

    return {
      projectsInProduction,
      projectsRampingUp,
      projectsScheduled,
      pilotsAndSamples,
      totalProjects
    };
  }

  getProjectsWithZeroIDs(projectData: ProjectData[]): ProjectData[] {
    return projectData.filter(project =>
      (project.productionID === 0 || project.projectID === 0) && project.customer !== 'Northern Sample' && project.completion !== 1
    );
  }

  getProjectsWithZeroIDs2(projectData: ProjectDataAndMaterials[]): ProjectData[] {
    return projectData.filter(project =>
      (project.productionID === 0 || project.projectID === 0) && project.customer !== 'Northern Sample'
    );
  }


  mapProjectDataWithMaterials(): Observable<ProjectDataAndMaterials[]> {
    return forkJoin({
      projects: this.getProjectDataTable(),
      units: this.getUnitsTable(),
      purchasingStatuses: this.getPurchasingStatusTable(),
      aluminum: this.getAluminumTable(),
      glass: this.getGlassTable(),
      hardware: this.getHardwareTable()
    }).pipe(
      map(data => {
        const { projects, units, purchasingStatuses, aluminum, glass, hardware } = data;
        console.log('Projects:', projects);
        console.log('Units:', units);
        console.log('Purchasing Statuses:', purchasingStatuses);
        console.log('Aluminum:', aluminum);
        console.log('Glass:', glass);
        console.log('Hardware:', hardware);
        const projectMap = new Map<number, ProjectDataAndMaterials>();
  
        projects.forEach(project => {
          projectMap.set(project.id, {
            ...project,
            units: [],
            aluminum: [],
            glass: [],
            hardware: [],
            purchasingStatus: []
          });
        });
  
        units.forEach((unit: Units) => {
          const project = projectMap.get(unit.projectDataID);
          if (project) {
            project.units.push(unit);
          }
        });
  
        const aluminumMap = new Map<number, Aluminum[]>();
        aluminum.forEach((item: Aluminum) => {
          if (!aluminumMap.has(item.aluminumId)) {
            aluminumMap.set(item.aluminumId, []);
          }
          aluminumMap.get(item.aluminumId)!.push(item);
        });
  
        const glassMap = new Map<number, Glass[]>();
        glass.forEach((item: Glass) => {
          if (!glassMap.has(item.glassid)) {
            glassMap.set(item.glassid, []);
          }
          glassMap.get(item.glassid)!.push(item);
        });
  
        const hardwareMap = new Map<number, Hardware[]>();
        hardware.forEach((item: Hardware) => {
          if (!hardwareMap.has(item.hardwareid)) {
            hardwareMap.set(item.hardwareid, []);
          }
          hardwareMap.get(item.hardwareid)!.push(item);
        });
  
        purchasingStatuses.forEach((status: PurchasingStatus) => {
          const project = projectMap.get(status.projectDataID);
          if (project) {
            // Associate purchasingStatus directly with the project
            project.purchasingStatus.push(status); // <-- Ensure status is of type PurchasingStatus
  
            const aluminumData = aluminumMap.get(status.aluminumid) || [];
            const glassData = glassMap.get(status.glassid) || [];
            const hardwareData = hardwareMap.get(status.hardwareid) || [];
  
            project.aluminum.push(...aluminumData);
            project.glass.push(...glassData);
            project.hardware.push(...hardwareData);
          }
        });
  
        console.log('Final Project Map:', Array.from(projectMap.values()));
        return Array.from(projectMap.values());
      })
    );
  }
  

  

  getEmailsByID(projectDataId: number): Observable<Emails[]> {
    return this.http.get<Emails[]>(`${this.apiUrl}/emails?projectDataId=${projectDataId}`).pipe(
      tap(data => console.log('Emails by Project Data ID:', data)) // Log the data for debugging
    );
  }

  getEmailsByProjectIDs(projectIDs: number[]): Observable<{[projectId: number]: Emails[]}> {
    const params = new HttpParams().set('projectDataIds', projectIDs.join(','));
    return this.http.get<{[projectId: number]: Emails[]}>(`${this.apiUrl}/emailsByProjectIDs`, { params }).pipe(
      tap(data => console.log('Emails by Project Data IDs:', data)) // Log the data for debugging
    );
  }

  getMiscByProjectDataID(projectDataID: number): Observable<Misc[]> {
    return this.http.get<Misc[]>(`${this.apiUrl}/miscTable/${projectDataID}`);
  }

  checkForErrors(projectData: ProjectDataAndMaterials, emails: Emails[], miscData: Misc[], weights: Weights): string[] {
    const defaultDate = new Date('2000-01-01T00:00:00');
    const projectEmails = emails.filter(email => email.projectDataID === projectData.id);
    const hasConfirmationDate = projectEmails.some(email => email.confirmationDate !== null);
    const currentDate = new Date();
    var score = 0; 
    const projectDataID = projectData.id;

    // Scores
    var clericalDataWeightScore = 100;
    var confirmationReceivedScore = 100;
    var hasOrderedMatsScore = 100;
    var allUnitsAssignedScore = 100;
    var materialsOnTimeScore = 100;
    var batchPaperworkScore = 100;
    var percentCompleteScore = 100;
    var deliveriesOnTimeScore = 100;
    var hasBOMScore = 100;
    var errorFactor = 1;
    var tableID = 3;

    // Weights
    const {
      clericalDataWeight,
      confirmationReceived,
      hasOrderedMats,
      allUnitsAssigned,
      materialsOnTime,
      batchPaperwork,
      percentComplete,
      deliveriesOnTime,
      hasBOM
    } = weights;

    // Check if order date is null or default
    const isOrderDateNullOrDefault = (date: any) => {
        if (date === null || date === undefined) return true;
        if (!(date instanceof Date)) {
            date = this.parseMonthDay(date); // Use parseMonthDay to handle parsing
        }
        return date.getTime() === defaultDate.getTime();
    };

    // Check if order date has passed
    const isOrderDatePassed = (date: any) => {
        if (date === null || date === undefined) return false;
        if (!(date instanceof Date)) {
            date = this.parseMonthDay(date); // Use parseMonthDay to handle parsing
        }

        if (isNaN(date.getTime())) {
            return false; // Handle invalid dates gracefully
        }

        const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        return dueDate < today;
    };

    const aluminumNA = projectData.aluminum.every(al => isOrderDateNullOrDefault(al.orderDate));
    const glassNA = projectData.glass.every(item => isOrderDateNullOrDefault(item.orderDate));
    const hardwareNA = projectData.hardware.every(hw => isOrderDateNullOrDefault(hw.orderDate));

    const hasNoOrders = (aluminumNA && glassNA && hardwareNA) || 
                        ((!projectData.aluminum.length) || 
                        (!projectData.glass.length) || 
                        (!projectData.hardware.length) || 
                        (!projectData.units.length)); // Check if all orders in units are null

    const unitsNotAssignedCount = projectData.units.reduce((sum, unit) => sum + unit.notAssigned, 0);
    const errors: string[] = [];
    if (!hasConfirmationDate) {
        errors.push("No signature/confirmation");
        confirmationReceivedScore = 0;
    }
    if (hasNoOrders && hasConfirmationDate) {
        errors.push('MISSING BOM');
        hasOrderedMatsScore = 0;
        errorFactor = 0.7;
    }
    if (projectData.productionID === 0 || projectData.projectID === 0) {
        errors.push('MISSING ID/PROD #');
        clericalDataWeightScore = 0;
    }
    if (unitsNotAssignedCount > 0) {
        errors.push(`UNITS NOT ASSIGNED: ${unitsNotAssignedCount}`);
        allUnitsAssignedScore = 0;
        errorFactor = 0.9;
    }
    

    // Check Misc messages
    const projectMisc = miscData.filter(misc => misc.projectDataID === projectData.id);
    console.log("Project MISC: ", JSON.stringify(projectMisc, null, 2)); // Use JSON.stringify for a readable format
    const validMessages = ["Complete", "Shipped", "All"];
    const midMessages = ["Deliver", "Delivery", "Delivering", "Partial", "No Charge"];
    const badMessages = ["Cancelled", "No More", "Drawing Stages", "Rush"];
    const foundBadMessages = new Set();

    const hasValidMiscMessage = projectMisc.some(misc => 
        Object.values(misc).some(value => 
            typeof value === 'string' && 
            validMessages.some(validMessage => value.trim().toLowerCase().includes(validMessage.toLowerCase()))
        )
    );

    const hasMidMessages = projectMisc.some(misc => 
        Object.values(misc).some(value => 
            typeof value === 'string' && 
            midMessages.some(midMessage => value.trim().toLowerCase().includes(midMessage.toLowerCase()))
        )
    );

    projectMisc.forEach(misc => 
      Object.values(misc).forEach(value => 
          typeof value === 'string' && 
          badMessages.forEach(badMessage => {
              if (value.trim().toLowerCase().includes(badMessage.toLowerCase())) {
                  foundBadMessages.add(badMessage);
              }
          })
      )
  );
  const hasBadMessages = foundBadMessages.size > 0;
    if (hasValidMiscMessage && hasMidMessages) {
        errors.push('Shipping In Progress');
        deliveriesOnTimeScore = deliveriesOnTimeScore - 30;
    } else if (hasMidMessages && !hasValidMiscMessage) {
        errors.push(`Shipping Scheduled`);
        console.log('shipping scheduled');
        deliveriesOnTimeScore = deliveriesOnTimeScore - 70;
    }  else if (hasBadMessages) {
      errors.push(`Shipping Error Keywords Found: ${Array.from(foundBadMessages).join(', ')}`);
      deliveriesOnTimeScore = 0;
        errorFactor = 0.5;
    }  

    // Check aluminum orders
    projectData.aluminum.forEach(al => {
        if (isOrderDatePassed(al.dueDate)) {
            errors.push(`ALUMINUM ORDER DATE PASSED: ${this.formatDateToString(al.dueDate)}`);
            materialsOnTimeScore = 0;
            errorFactor = 0.3;
        } else if (al.dueDate == "??" || al.dueDate == "?") {
          errors.push(`ALUMINUM ORDER UNKNOWN: ${this.formatDateToString(al.dueDate)}`);
            materialsOnTimeScore = 0;
            errorFactor = 0.5;
        }
    });

    // Check glass orders
    projectData.glass.forEach(item => {
        if (isOrderDatePassed(item.dueDate)) {
            errors.push(`GLASS ORDER DATE PASSED: ${this.formatDateToString(item.dueDate)}`);
            materialsOnTimeScore = 0;
            errorFactor = 0.3;
        }
        else if (item.dueDate == "??" || item.dueDate == "?") {
          errors.push(`GLASS ORDER UNKNOWN: ${this.formatDateToString(item.dueDate)}`);
            materialsOnTimeScore = 0;
            errorFactor = 0.5;
        }  else if (item.status == "DO NOT HAVE") {
          materialsOnTimeScore = 0;
          errors.push(`DO NOT HAVE BOM`);
          errorFactor = 0.5;
        }
    });

    // Check hardware orders
    projectData.hardware.forEach(hw => {
        if (isOrderDatePassed(hw.dueDate)) {
            errors.push(`HARDWARE ORDER DATE PASSED: ${this.formatDateToString(hw.dueDate)}`);
            materialsOnTimeScore = 0
            errorFactor = 0.3;
        }  else if (hw.dueDate == "??" || hw.dueDate == "?") {
          errors.push(`HARDWARE ORDER UNKNOWN: ${this.formatDateToString(hw.dueDate)}`);
            materialsOnTimeScore = 0;
            errorFactor = 0.5;
        }
    });


    // Check Purchasing Status messages
    const validPurchasingMessages = ["Complete", "Done"];
    const midPurchasingMessages = ["Preparing", "Load", "Bldg", "Batch", "Batches"];
    const badPurchasingMessages = ["??", "???", "?", "On Hold", "DO NOT HAVE", "Missing"]; //CHANGE TO ONLY ON HOLD
    const foundBadPurchasingMessages = new Set();

    const hasValidPurchasingMessage = projectData.purchasingStatus.some(status =>
        Object.values(status).some(value =>
            typeof value === 'string' &&
            validPurchasingMessages.some(validMessage => value.trim().toLowerCase().includes(validMessage.toLowerCase()))
        )
    );

    const hasMidPurchasingMessages = projectData.purchasingStatus.some(status =>
        Object.values(status).some(value =>
            typeof value === 'string' &&
            midPurchasingMessages.some(midMessage => value.trim().toLowerCase().includes(midMessage.toLowerCase()))
        )
    );

    projectData.purchasingStatus.forEach(status =>
      Object.values(status).forEach(value =>
          typeof value === 'string' &&
          badPurchasingMessages.forEach(badMessage => {
              if (value.trim().toLowerCase().includes(badMessage.toLowerCase())) {
                  if (badMessage == "Missing") {
                    foundBadPurchasingMessages.add("An item is marked as missing");
                  } else {
                    foundBadPurchasingMessages.add(badMessage);
                }
              }
          })
      )
  );
  const hasBadPurchasingMessages = foundBadPurchasingMessages.size > 0;

    if (hasValidPurchasingMessage && hasMidPurchasingMessages) {
        errors.push(`Purchasing In Progress`);
        batchPaperworkScore = batchPaperworkScore - 30;
    } else if (hasMidPurchasingMessages && !hasValidPurchasingMessage) {
        errors.push(`Purchasing Scheduled`);
        batchPaperworkScore = batchPaperworkScore - 70;
    } else if (hasBadPurchasingMessages) {
      errors.push(`Purchasing Errors Found: ${Array.from(foundBadPurchasingMessages).join(', ')}`);
      batchPaperworkScore = 0;
      errorFactor = 0.5;
    }

    const madeQuantity = projectData.units.reduce((sum, unit) => sum + unit.madeQuantity, 0);
    const receivedQuantity = projectData.units.reduce((sum, unit) => sum + unit.receivedQuantity, 0);
    const cumulativePercentage = receivedQuantity > 0 ? (madeQuantity / receivedQuantity) : 0;
    percentCompleteScore = (percentCompleteScore * cumulativePercentage);
    console.log("percent complete:",  percentCompleteScore);

    score = ((clericalDataWeight * clericalDataWeightScore) + (confirmationReceived * confirmationReceivedScore)
          + (hasOrderedMats * hasOrderedMatsScore) + (materialsOnTime * materialsOnTimeScore)
          + (batchPaperwork * batchPaperworkScore) + (percentComplete * percentCompleteScore) 
          + (deliveriesOnTime * deliveriesOnTimeScore) + (allUnitsAssigned * allUnitsAssignedScore) + (hasBOM * hasBOMScore)) 
          * errorFactor;
    errors.push(`Score: ${score}`);
    console.log("Errors list", errors);
    return errors;
}


  
  
  // Helper function to parse month/day strings into a Date object
  parseMonthDay(dateString: string): Date {
    const [month, day] = dateString.split('/').map(Number);
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, month - 1, day);
  }

  getPurchasingStatusByProjectDataID(projectDataID: number): Observable<PurchasingStatus[]> {
    return this.http.get<PurchasingStatus[]>(`${this.apiUrl}/purchasingStatusTable/${projectDataID}`);
  }
  
  // Helper function to format date for errors
  formatDateToString(date: any): string {
    if (typeof date === 'string' && date.includes('/')) {
      date = this.parseMonthDay(date);
    } else if (!(date instanceof Date)) {
      date = new Date(date);
    }
  
    if (isNaN(date.getTime())) {
      console.error(`Invalid date format: ${date}`);
      return 'Invalid Date';
    }
  
    return date.toDateString(); // Format date as 'Mon Jul 22 2024'
  }
  

  filterProjectsInProduction(data: ProjectDataAndMaterials[], miscData: Misc[]): ProjectDataAndMaterials[] {
    return data.filter(project => {
      if (project.completion === 1 || project.customer === 'Northern Sample') return false;
      const units = project.units;
      return units.some(unit => unit.madeQuantity > 0 && unit.madeQuantity !== unit.receivedQuantity);
    });
  }

  filterProjectsRampingUp(data: ProjectDataAndMaterials[], miscData: Misc[]): ProjectDataAndMaterials[] {
    console.log('Data received for ramping up filtering:', data);
    return data.filter(project => {
      if (project.completion === 1 || project.customer === 'Northern Sample') {
        return false;
      }
  
      const units = project.units;
      const misc = miscData.find(m => m.projectDataID === project.id);
  
      if (!misc) {
        return false;
      }
  
      const noCompletedInMessages = ['message1', 'message2', 'message3', 'message4', 'message5']
        .every(key => {
          const message = misc[key] || '';
          return !message.toLowerCase().includes('complete');
        });
  
      return units.every(unit => unit.madeQuantity === 0 && unit.notAssigned) && noCompletedInMessages;
    });
  }

  filterProjectsScheduled(data: ProjectDataAndMaterials[], miscData: Misc[]): ProjectDataAndMaterials[] {
    return data.filter(project => {
      if (project.completion === 1 || project.customer === 'Northern Sample') return false;
      const units = project.units;
      const misc = miscData.find(m => m.projectDataID === project.id);
  
      if (!misc) {
        return false;
      }
  
      const noCompletedInMessages = ['message1', 'message2', 'message3', 'message4', 'message5']
        .every(key => {
          const message = misc[key] || '';
          return !message.toLowerCase().includes('complete');
        });
  
      return units.every(unit => unit.madeQuantity === 0) &&
             units.some(unit => unit.receivedQuantity > 0 && unit.notAssigned < unit.receivedQuantity) &&
             noCompletedInMessages;
    });
  }
}

export interface ProductionDates {
  productionDateID: number,
  unitID: number, 
  amount: number,
  model: string, 
  dateToBeProduced: string,
}

export interface Units {
  unitID: number, 
  projectDataID: number,
  model: string, 
  receivedQuantity: number, 
  madeQuantity: number, 
  toBeProduced: number, 
  productionLine: string, 
  notAssigned: number,
}

export interface ProjectData {
  id: number,
  productionID: number,
  projectID: number,
  customer: string,
  jobName: string, 
  finish: string, 
  salesRep: string, 
  completion: number,
}

export interface PurchasingStatus {
  purchasingID: number, 
  projectDataID: number, 
  aluminumid: number, 
  glassid: number, 
  hardwareid: number, 
  batchStatus: number,
  batchnotes: string,
}

export interface Misc {
  miscID: number, 
  projectDataID: number,
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  [key: string]: any;  // Index signature for dynamic property access
}

export interface Emails {
  emailID: number, 
  projectDataID: number,
  orderDate: string, 
  firstEmailDate: string, 
  recentEmailDate: string, 
  confirmationDate: string, 
}

export interface Aluminum {
  id: number,
  aluminumId: number, 
  orderNumber: number,
  orderDate: Date,
  dueDate: string, 
  status: string, 
}

export interface Hardware {
  id: number, 
  hardwareid: number,
  orderNumber: number, 
  orderDate: Date,
  dueDate: string, 
  status: string, 
}

export interface Glass {
  id: number,
  glassid: number,
  orderDate: Date, 
  dueDate: string, 
  status: string,
}

export interface Weights {
  id: number;
  clericalDataWeight: number;
  confirmationReceived: number;
  hasOrderedMats: number;
  allUnitsAssigned: number;
  materialsOnTime: number;
  batchPaperwork: number;
  percentComplete: number;
  deliveriesOnTime: number;
  hasBOM: number;
  name: string;
}


export type ProjectDataAndUnits = ProjectData & { units: Units[] };

export type ProjectDataAndMaterials = ProjectData & { 
  units: Units[],
  aluminum: Aluminum[],
  glass: Glass[],
  hardware: Hardware[],
  purchasingStatus: PurchasingStatus[],
};
*/
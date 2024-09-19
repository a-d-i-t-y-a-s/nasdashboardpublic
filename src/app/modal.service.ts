import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProjectData, Units, ProjectDataAndUnits, ProjectDataAndMaterials, Emails, Misc, PurchasingStatus, LocalService } from '../app/services/local.service';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private visibilitySource = new BehaviorSubject<boolean>(false);
  private projectSource = new BehaviorSubject<ProjectDataAndMaterials | null>(null);
  private errorMessageSource = new BehaviorSubject<string | null>(null);
  private miscDataSource = new BehaviorSubject<Misc[]>([]);
  private purchasingStatusSource = new BehaviorSubject<PurchasingStatus[]>([]); // Add this

  visibility$ = this.visibilitySource.asObservable();
  project$ = this.projectSource.asObservable();
  errorMessage$ = this.errorMessageSource.asObservable();
  miscData$ = this.miscDataSource.asObservable();
  purchasingStatus$ = this.purchasingStatusSource.asObservable(); // Add this

  constructor(private localService: LocalService) {}

  
  show(project: ProjectDataAndMaterials, miscData: Misc[], purchasingStatus: PurchasingStatus[]): void {
    this.projectSource.next(project);
    this.miscDataSource.next(miscData);
    this.purchasingStatusSource.next(purchasingStatus); // Add this
    this.visibilitySource.next(true);
  }

  hide(): void {
    this.visibilitySource.next(false);
    this.projectSource.next(null);
    this.miscDataSource.next([]);
    this.purchasingStatusSource.next([]); // Add this
  }

  close(): void {
    this.projectSource.next(null);
    this.miscDataSource.next([]);
    this.purchasingStatusSource.next([]); // Add this
  }

  showSample(project: ProjectData): void {
    this.projectSource.next(project as ProjectDataAndMaterials);
    this.visibilitySource.next(true);
  }

  private checkForErrors(projectDataId: number): void {
    this.localService.getEmailsByID(projectDataId).subscribe(emails => {
      const hasConfirmationDate = emails.some(email => email.confirmationDate);
      const hasNoOrders = !this.projectSource.value?.aluminum.length && 
                          !this.projectSource.value?.glass.length && 
                          !this.projectSource.value?.hardware.length;

      if (hasConfirmationDate && hasNoOrders) {
        this.errorMessageSource.next('Error');
      } else {
        this.errorMessageSource.next(null);
      }
    });
  }
}

export interface ProjectModelInfo {
  projectID: number;
  jobName: string;
  productionID: number;
  customer: string;
  model: string;
  toBeProduced: number;
  receivedQuantity: number;
  madeQuantity: number;
}


// export type ProjectDataAndUnits = {
//   project: ProjectData;
//   units: Units[];
// };
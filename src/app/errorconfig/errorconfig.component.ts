import { AfterViewInit, Component, ViewChild, ChangeDetectionStrategy, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocalService, Weights } from '../services/local.service'; // Changed to LocalService
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-errorconfig',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './errorconfig.component.html',
  styleUrls: ['./errorconfig.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorconfigComponent implements OnInit {
  weights: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  errorMessage: string = '';
  isBrowser: boolean;
  tableID = this.localService.getTableID(); // Changed to localService
  profileName: string = ''; // Changed String to string
  profileNames: string[] = []; // Changed String[] to string[]
  loading: boolean = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object, private localService: LocalService) { // Changed to LocalService
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.tableID = this.localService.getTableID(); // Changed to localService
    this.loadWeights();
    this.getProfileName(this.tableID);
    this.loadProfileNames();
    console.log("thisprofilename ", this.profileName);
  }

  getProfileName(id: number): void {
    this.localService.getWeightsName(id).subscribe(name => { // Changed to localService
  this.profileName = name ?? ''; // Default to empty string if name is undefined
      console.log("Profile name is: ", name);
    });
  }

  loadWeights(): void {
    this.localService.getWeights(this.tableID).subscribe(
      (weights: Weights | undefined) => {
        if (weights !== undefined) {  // Explicitly comparing against undefined
          this.weights = [
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
          this.getProfileName(weights.id);
        } else {
          this.errorMessage = 'Weights data not found';
          console.error(this.errorMessage);
        }
      },
      error => {
        this.errorMessage = `Error loading weights: ${error.message}`;
        console.error(this.errorMessage);
      }
    );    
  }

  onProfileNameChange(profileName: string): void {
    this.loading = true;
    this.localService.getWeightsByProfileName(profileName).subscribe( // Changed to localService
      (weights: Weights | undefined) => {
        if (weights !== undefined) {  // Explicitly comparing against undefined
        this.weights = [
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
        this.localService.setTableIDValueLocal(this.tableID); // Changed to localService
        this.loading = false;
      }
      },
      error => {
        this.errorMessage = `Error loading weights for profile ${profileName}: ${error.message}`;
        this.loading = false;
      }
    );
  }

  onTableIDChange(value: number): void {
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      this.tableID = numericValue;
      this.localService.setTableIDValue(this.tableID); // Changed to localService
      this.loadWeights();
    }
  }

  addWeights(): void {
    // Continue with your existing logic
  }

  loadProfileNames(): void {
    this.localService.getProfileNames().subscribe( // Changed to localService
      (names: string[]) => {
        this.profileNames = names;
        console.log("Profile names:", this.profileNames);
      },
      error => {
        this.errorMessage = `Error loading profile names: ${error.message}`;
      }
    );
  }

  confirmChanges() {
    // Continue with your existing logic
  }

  reloadPage() {
    window.location.reload();
  }
}

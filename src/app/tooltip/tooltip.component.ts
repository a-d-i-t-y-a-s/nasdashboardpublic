import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


interface ColorInfo {
  hex: string;
  name: string;
  info: string;
}

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.css'
})
export class TooltipComponent {
  @Input() text: string = '';
  visible: boolean = false;
  colors: ColorInfo[] = [
    { hex: '#076189', name: 'Northern Blue', info: 'A fitting color to represent an overachieving project!'},
    { hex: '#75d69d', name: 'Green',         info: 'A project that is above average.'},
    { hex: '#FFA500', name: 'Yellow',        info: 'A project that is on target. Most projects will fall into this category.'},
    { hex: '#FF5733', name: 'Orange',        info: 'A project that is at risk.'},
    { hex: '#e22941', name: 'Red',           info: 'Something is wrong! Action Required!'}
  ];

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }
}

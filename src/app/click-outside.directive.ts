import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: HTMLElement): void {
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    const ignoreClick = this.isClickInsideIgnoredElement(targetElement);    
    if (!clickedInside && !ignoreClick) {
      this.clickOutside.emit();
    }
  }

  private isClickInsideIgnoredElement(targetElement: HTMLElement | null): boolean {
    while (targetElement) {
      if (targetElement.hasAttribute('appClickOutsideIgnore')) {
        return true;
      }
      targetElement = targetElement.parentElement as HTMLElement | null;
    }
    return false;
  }
}
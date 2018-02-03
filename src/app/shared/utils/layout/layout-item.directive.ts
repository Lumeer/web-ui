import {AfterViewInit, Directive, ElementRef, Input, OnDestroy} from '@angular/core';
import {PostItLayout} from './post-it-layout';

@Directive({
  selector: '[layout-item]'
})
export class LayoutItem implements AfterViewInit, OnDestroy {

  @Input()
  public layout: PostItLayout;

  constructor(private element: ElementRef) {
  }

  public ngAfterViewInit(): void {
    this.layout.add(this.element.nativeElement);
  }

  public ngOnDestroy(): void {
    this.layout.remove(this.element.nativeElement);
  }

}

/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {
  Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChange,
  ViewChild
} from '@angular/core';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

import {Resource} from '../../../core/dto/resource';
import {ResourceType} from '../../../shared/permissions/resource-type';
import {isNullOrUndefined} from 'util';

const squareSize: number = 200;
const arrowSize: number = 40;

@Component({
  selector: 'resource-chooser',
  templateUrl: './resource-chooser.component.html',
  styleUrls: ['./resource-chooser.component.scss'],
  animations: [
    trigger('animateVisible', [
      state('in', style({opacity: 1})),
      transition('void => *', [
        animate(500, keyframes([
          style({opacity: 0}),
          style({opacity: 1})
        ]))
      ]),
      transition('* => void', [
        animate(500, keyframes([
          style({opacity: 1}),
          style({opacity: 0})
        ]))
      ])
    ]),
    trigger('animateOpacityFromUp', [
      state('in', style({transform: 'translateY(0)', opacity: 1})),
      transition('void => *', [
        animate(300, keyframes([
          style({transform: 'translateY(-50px)', opacity: 0, offset: 0}),
          style({transform: 'translateY(0)', opacity: 1, offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(300, keyframes([
          style({transform: 'translateY(0)', opacity: 1, offset: 0}),
          style({transform: 'translateY(-50px)', opacity: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class ResourceChooserComponent implements OnChanges {

  @ViewChild('resourceContainer')
  public resourceContainer: ElementRef;

  @ViewChild('resourceDescription')
  public resourceDescription: ElementRef;

  @Input() public resourceType: ResourceType;
  @Input() public resources: Resource[];
  @Input() public initActiveIx: number;

  @Output() public resourceSelect: EventEmitter<number> = new EventEmitter();
  @Output() public resourceNew: EventEmitter<any> = new EventEmitter();
  @Output() public resourceSettings: EventEmitter<number> = new EventEmitter();
  @Output() public resourceNewDescription: EventEmitter<string> = new EventEmitter();

  public resourceContentWidth: number = 0;
  public resourceContentLeft: number = arrowSize;
  public resourceWidth: number = squareSize;
  public resourceCanScrollLeft: boolean = false;
  public resourceCanScrollRight: boolean = false;
  public resourceScroll: number = 0;
  public resourceActiveIx: number;
  public resourceLineSizes = [0, 0, 0];
  public resourceVisibleArrows = false;
  public resourceDescriptionEditable = false;

  public ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    if (changes['resources']) {
      this.actualizeWidthAndCheck();
      this.checkForScrollRightResources();
      this.resourceActiveIx = this.initActiveIx;
      this.computeResourceLines(this.resourceActiveIx);
    }
  }

  @HostListener('window:resize', ['$event'])
  private onResize(event) {
    this.actualizeWidthAndCheck();
    this.checkForScrollRightResources();
  }

  private actualizeWidthAndCheck() {
    let resourceContentWidth = this.resourceContainer.nativeElement.clientWidth;
    this.resourceWidth = Math.max((this.resources.length + 1) * squareSize, resourceContentWidth);
    this.checkForDisableResourceArrows(resourceContentWidth);
  }

  public onResourceDescriptionEdit() {
    this.resourceDescriptionEditable = true;
    setTimeout(() => {
      this.resourceDescription.nativeElement.focus();
    }, 50);
  }

  public onResourceDescriptionBlur(description: string) {
    this.resourceDescriptionEditable = false;
    this.resourceNewDescription.emit(description);
  }

  public onResourceSelected(index: number) {
    this.resourceActiveIx = index;
    this.computeResourceLines(index);
    this.resourceSelect.emit(index);
  }

  public onScrollResource(direction: number) {
    if (direction > 0) {
      this.scrollResourceToRight();
    } else {
      this.scrollResourceToLeft();
    }
  }

  private scrollResourceToLeft() {
    if (!this.resourceCanScrollLeft) {
      return;
    }
    this.resourceScroll = Math.min(this.resourceScroll + squareSize, 0);
    this.resourceCanScrollRight = true;
    this.resourceCanScrollLeft = this.resourceScroll < 0;
  }

  private scrollResourceToRight() {
    if (!this.resourceCanScrollRight) {
      return;
    }
    this.resourceScroll -= squareSize;
    this.resourceCanScrollLeft = true;
    const numVisible = this.numResourcesVisible();
    const numPotentiallyVisible = this.numResourcesPotentiallyVisible();
    this.resourceCanScrollRight = numVisible > 0 && (numPotentiallyVisible - numVisible > 0);
  }

  private checkForInitScrollResources(ix: number) {
    if (ix === 0) {
      return;
    }
    const numVisible = this.numResourcesVisible();
    if (ix >= numVisible) {
      const numShouldScroll = ix - numVisible + Math.round(numVisible / 2);
      const numMaxScroll = this.resources.length + 1 - numVisible;
      const numToScroll = Math.min(numShouldScroll, numMaxScroll);
      this.resourceScroll = -numToScroll * squareSize;
      this.resourceCanScrollLeft = true;
      this.resourceCanScrollRight = numToScroll < numMaxScroll;
    }
  }

  private checkForDisableResourceArrows(screenWidth: number) {
    if (screenWidth < this.resourceWidth) {
      this.resourceVisibleArrows = true;
      this.resourceContentWidth = screenWidth - 2 * arrowSize;
      this.resourceContentLeft = arrowSize;
    } else {
      this.resourceVisibleArrows = false;
      this.resourceContentWidth = screenWidth;
      this.resourceContentLeft = 0;
    }
  }

  private checkForScrollRightResources() {
    const numVisible = this.numResourcesVisible();
    const numPotentiallyVisible = this.numResourcesPotentiallyVisible();
    this.resourceCanScrollRight = numVisible > 0 && (numPotentiallyVisible - numVisible > 0);

    const numToScroll = numVisible - numPotentiallyVisible;
    if (numToScroll > 0) {
      this.resourceScroll += numToScroll * squareSize;
    }
  }

  private numResourcesVisible(): number {
    return Math.min(Math.floor(this.resourceContentWidth / squareSize), this.resources.length + 1);
  }

  private numResourcesPotentiallyVisible(): number {
    return this.resources.length + 1 - Math.abs(this.resourceScroll / squareSize);
  }

  private computeResourceLines(index: number) {
    if (isNullOrUndefined(index)) {
      this.resourceLineSizes = [0, 0, 0];
      return;
    }
    this.resourceLineSizes[0] = index * squareSize;
    this.resourceLineSizes[1] = squareSize;
    this.resourceLineSizes[2] = (this.resources.length - index) * squareSize;
  }

  public onCreateResource() {
    this.resourceNew.emit();
  }

  public onResourceSettings(index: number) {
    this.resourceSettings.emit(index);
  }

}

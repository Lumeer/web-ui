/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  ViewChild
} from '@angular/core';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

import {isNullOrUndefined} from 'util';
import {CorrelationIdGenerator} from '../../../core/store/correlation-id.generator';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {ProjectModel} from '../../../core/store/projects/project.model';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../core/constants';
import {KeyCode} from '../../../shared/key-code';
import {Role} from '../../../shared/permissions/role';
import {ResourceItemType} from './resource-item-type';

const squareSize: number = 200;
const arrowSize: number = 40;

type ResourceModel = OrganizationModel | ProjectModel;

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

  @Input() public resourceType: ResourceItemType;
  @Input() public resources: ResourceModel[];
  @Input() public selectedCode: string;
  @Input() public canCreateResource: boolean;

  @Output() public resourceSelect: EventEmitter<string> = new EventEmitter();
  @Output() public resourceNew: EventEmitter<ResourceModel> = new EventEmitter();
  @Output() public resourceSettings: EventEmitter<string> = new EventEmitter();
  @Output() public resourceUpdate: EventEmitter<{ code: string, resource: ResourceModel }> = new EventEmitter();

  public newResources: ResourceModel[] = [];

  public resourceContentWidth: number = 0;
  public resourceContentLeft: number = arrowSize;
  public resourceWidth: number = squareSize;
  public linesWidth: number = 0;
  public resourceCanScrollLeft: boolean = false;
  public resourceCanScrollRight: boolean = false;
  public resourceScroll: number = 0;
  public resourceLineSizes = [0, 0, 0];
  public resourceVisibleArrows = false;

  public ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    if (changes['resources']) {
      this.compute();
    } else if (changes['selectedCode']) {
      this.computeResourceLines(this.getActiveIndex());
    }
  }

  @HostListener('window:resize', ['$event'])
  private onResize(event) {
    this.compute();
  }

  private compute() {
    this.actualizeWidthAndCheck();
    this.checkForScrollRightResources();
    this.computeResourceLines(this.getActiveIndex());
  }

  private actualizeWidthAndCheck() {
    let resourceContentWidth = this.resourceContainer.nativeElement.clientWidth;
    this.resourceWidth = Math.max(this.resourcesLength() * squareSize, resourceContentWidth);
    this.checkForDisableResourceArrows(resourceContentWidth);
  }

  public onResourceSelected(code: string) {
    if (code && code !== this.selectedCode) {
      this.resourceSelect.emit(code);
    }
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

  private getActiveIndex(): number {
    if (isNullOrUndefined(this.resources) || isNullOrUndefined(this.selectedCode)) return -1;
    return this.resources.findIndex(resource => resource.code === this.selectedCode);
  }

  private checkForInitScrollResources(ix: number) {
    if (ix === 0) {
      return;
    }
    const numVisible = this.numResourcesVisible();
    if (ix >= numVisible) {
      const numShouldScroll = ix - numVisible + Math.round(numVisible / 2);
      const numMaxScroll = this.resourcesLength() - numVisible;
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
    return Math.min(Math.floor(this.resourceContentWidth / squareSize), this.resourcesLength());
  }

  private numResourcesPotentiallyVisible(): number {
    return this.resourcesLength() - Math.abs(this.resourceScroll / squareSize);
  }

  private computeResourceLines(index: number) {
    if (isNullOrUndefined(index)) {
      this.resourceLineSizes = [0, 0, 0];
      return;
    }
    const widthContent = this.resourcesLength() * squareSize;
    this.linesWidth = Math.max(this.resourceContainer.nativeElement.clientWidth, widthContent);
    this.resourceLineSizes[0] = (this.linesWidth - widthContent) / 2 + (index * squareSize);
    this.resourceLineSizes[1] = squareSize;
    this.resourceLineSizes[2] = this.linesWidth - this.resourceLineSizes[0] - this.resourceLineSizes[1];
  }

  public onCreateResource() {
    this.newResources.push({
      name: '',
      code: '',
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON,
      correlationId: CorrelationIdGenerator.generate()
    });
    this.compute();
  }

  public onResourceSettings(code: string) {
    this.resourceSettings.emit(code);
  }

  public hasManageRole(resource: ResourceModel): boolean {
    return resource.permissions && resource.permissions.users.length === 1
      && resource.permissions.users[0].roles.some(r => r === Role.Manage.toString());
  }

  public onKeyDown(event: KeyboardEvent, element: HTMLElement) {
    if (event.keyCode === KeyCode.Enter) {
      element.blur();
    }
  }

  public onCodeBlur(element: HTMLElement, resource: ResourceModel) {
    resource.code = element.textContent;
  }

  public onNameBlur(element: HTMLElement, resource: ResourceModel) {
    resource.name = element.textContent;
    if (this.resourceType === ResourceItemType.Organization) {
      this.resourceNew.emit(resource as OrganizationModel);
    } else if (this.resourceType === ResourceItemType.Project) {
      this.resourceNew.emit(resource as ProjectModel);
    }
  }

  private resourcesLength(): number {
    let length = this.resources.length;
    if (this.canCreateResource) {
      length += this.newResources.length + 1;
    }
    return length;
  }
}

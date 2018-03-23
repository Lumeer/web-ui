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

import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, QueryList, SimpleChange, ViewChild, ViewChildren} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {isNullOrUndefined} from 'util';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../core/constants';
import {NotificationService} from '../../../core/notifications/notification.service';
import {CorrelationIdGenerator} from '../../../core/store/correlation-id.generator';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {ProjectModel} from '../../../core/store/projects/project.model';
import {KeyCode} from '../../../shared/key-code';
import {Role} from '../../../shared/permissions/role';
import {ResourceItemType} from './resource-item-type';

const squareSize: number = 200;
const arrowSize: number = 40;
const warningStyle = 'border-danger';

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

  @ViewChildren('icon')
  public icons: QueryList<ElementRef>;

  @ViewChild('resourceContainer')
  public resourceContainer: ElementRef;

  @ViewChild('resourceDescription')
  public resourceDescription: ElementRef;

  @Input() public resourceType: ResourceItemType;
  @Input() public resources: ResourceModel[];
  @Input() public selectedId: string;
  @Input() public canCreateResource: boolean;
  @Input() public usedCodes: string[];

  @Output() public resourceDelete: EventEmitter<string> = new EventEmitter();
  @Output() public resourceSelect: EventEmitter<string> = new EventEmitter();
  @Output() public resourceNew: EventEmitter<ResourceModel> = new EventEmitter();
  @Output() public resourceSettings: EventEmitter<string> = new EventEmitter();
  @Output() public resourceUpdate: EventEmitter<ResourceModel> = new EventEmitter();
  @Output() public warningMessage: EventEmitter<string> = new EventEmitter();

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

  public lastIcon: string;
  public lastColor: string;
  public modifiedResourceId: string;
  public syncingCorrIds: string[] = [];

  public constructor(private i18n: I18n,
                     private notificationService: NotificationService) {
  }

  public ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    if (changes['resources']) {
      this.checkResources();
      this.compute();
    } else if (changes['selectedId']) {
      this.computeResourceLines(this.getActiveIndex());
    }
  }

  @HostListener('window:resize', ['$event'])
  private onResize(event) {
    this.compute();
  }

  private checkResources() {
    this.resources = this.resources.filter(res => res && typeof res === 'object');
    const ids: string[] = this.resources.filter(res => res.correlationId).map(res => res.correlationId);
    this.syncingCorrIds = this.syncingCorrIds.filter(id => !ids.includes(id));
    this.newResources = this.newResources.filter(newRes => !ids.includes(newRes.correlationId));
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

  public onResourceSelected(id: string) {
    if (id && id !== this.selectedId) {
      this.resourceSelect.emit(id);
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
    if (isNullOrUndefined(this.resources) || isNullOrUndefined(this.selectedId)) return -1;
    return this.resources.findIndex(resource => resource.id === this.selectedId);
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

  private checkVisibilityNewResource() {
    const numVisible = this.numResourcesVisible();
    const numPotentiallyVisible = this.numResourcesPotentiallyVisible();
    if (numPotentiallyVisible - numVisible > 1) {
      this.resourceScroll -= squareSize;
    }
    this.checkForScrollLeftArrow();
  }

  private checkForScrollLeftArrow() {
    this.resourceCanScrollLeft = this.resourceScroll < 0;
  }

  private numResourcesVisible(): number {
    return Math.min(Math.floor(this.resourceContentWidth / squareSize), this.resourcesLength());
  }

  private numResourcesPotentiallyVisible(): number {
    return this.resourcesLength() - Math.abs(this.resourceScroll / squareSize);
  }

  private computeResourceLines(index: number) {
    if (index === -1) {
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
      correlationId: CorrelationIdGenerator.generate(),
      description: ''
    });
    this.compute();
    this.checkVisibilityNewResource();
  }

  public onResourceSettings(id: string) {
    this.resourceSettings.emit(id);
  }

  public onResourceDelete(resource: ResourceModel) {
    if (resource.id) {
      const message = this.i18n(
        {
          id: 'resource.delete.dialog.message',
          value: 'Are you sure you want to remove the {resourceType, select, Project {project} Organization {organization}}} {{resourceCode}}?'
        },
        {
          resourceType: this.resourceType,
          resourceCode: resource.code
        }
      );
      const title = this.i18n({id: 'resource.delete.dialog.title', value: 'Delete?'});
      const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
      const noButtonText = this.i18n({id: 'button.no', value: 'No'});

      this.notificationService.confirm(message, title, [
        {text: yesButtonText, action: () => this.resourceDelete.emit(resource.id), bold: false},
        {text: noButtonText}
      ]);
    } else {
      this.newResources = this.newResources.filter(newRes => newRes.correlationId !== resource.correlationId);
      this.compute();
    }
  }

  public onNewColor(resource: ResourceModel, color: string) {
    if (resource.id) {
      this.lastColor = color;
    } else {
      resource.color = color;
    }
  }


  public onNewIcon(resource: ResourceModel, icon: string) {
    if (resource.id) {
      this.lastIcon = icon;
    } else {
      resource.icon = icon;
    }
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
    const newCode = element.textContent.trim();
    const isValid = this.resources.filter(res => res.id !== resource.id).findIndex(res => res.code === newCode) === -1;
    if (isValid) {
      element.classList.remove(warningStyle);
    } else {
      element.classList.add(warningStyle);

      const message = this.i18n({
        id: 'resource.already.exist',
        value: '{resourceType, select, Project {Project} Organization {Organization}}} with code {{resourceCode}} already exist'
      }, {
        resourceType: this.resourceType,
        resourceCode: newCode
      });
      this.warningMessage.emit(message);
      return;
    }

    const property = 'code';
    const propertyOther = 'name';
    if (resource.hasOwnProperty(property) && resource.hasOwnProperty(propertyOther)) {
      this.onFieldBlur(element, resource, property, propertyOther);
    }
  }

  public onNameBlur(element: HTMLElement, resource: ResourceModel) {
    const property = 'name';
    const propertyOther = 'code';
    if (resource.hasOwnProperty(property) && resource.hasOwnProperty(propertyOther)) {
      this.onFieldBlur(element, resource, property, propertyOther);
    }
  }

  private onFieldBlur(element: HTMLElement, resource: ResourceModel, property: string, propertyOther: string) {
    const contentTrim = element.textContent.trim();
    const contentTrimLength = contentTrim.length;
    const propertyLength = resource[property].length;

    if (resource.id) {
      // we know, that code is not empty
      if (contentTrimLength === 0) {
        element.textContent = resource[property];
      } else {
        if (contentTrim !== resource[property]) {
          const resourceModel = {...resource};
          resourceModel[property] = contentTrim;
          this.resourceUpdate.emit(resourceModel);
        }
      }
    } else {
      if (resource[propertyOther].length === 0) {
        resource[property] = contentTrim;
      } else if (contentTrimLength == 0 && propertyLength > 0) {
        element.textContent = resource[property];
      } else if (contentTrimLength > 0 && propertyLength == 0) {
        resource[property] = contentTrim;
        if (this.isNewCodeValid(resource.code)) {
          setTimeout(() => {
            this.showPicker(resource);
          }, 200);
        }
      }// else do nothing
    }
  }

  public showPicker(resource: ResourceModel) {
    const element = this.icons.find(icon => icon.nativeElement.id === this.getResourceIdentificator(resource));
    if (element) {
      element.nativeElement.click();
    }
  }

  public onResourcePickerClick(resource: ResourceModel) {
    this.modifiedResourceId = this.getResourceIdentificator(resource);
    this.lastIcon = null;
    this.lastColor = null;
  }

  public onResourcePickerBlur(resource: ResourceModel) {
    if (!this.modifiedResourceId || this.modifiedResourceId !== this.getResourceIdentificator(resource)) {
      return;
    }

    if (resource.id) {
      if (this.shouldUpdateResource(resource)) {
        const resourceModel = {
          ...resource,
          icon: this.lastIcon || resource.icon,
          color: this.lastColor || resource.color
        };
        this.resourceUpdate.emit(resourceModel);
      }
    } else if (!this.syncingCorrIds.includes(resource.correlationId) && resource.code && resource.name) {
      this.syncingCorrIds.push(resource.correlationId);
      this.resourceNew.emit(resource);
    }

    this.modifiedResourceId = null;
  }

  public onDescriptionBlur(resource: ResourceModel, newDescription: string) {
    const resourceModel = {...resource, description: newDescription};
    this.resourceUpdate.emit(resourceModel);
  }

  private shouldUpdateResource(resource: ResourceModel): boolean {
    return (this.lastIcon && resource.icon !== this.lastIcon) || (this.lastColor && resource.color !== this.lastColor);
  }

  public getResourceIdentificator(resource: ResourceModel): string {
    return resource.id || resource.correlationId;
  }

  public getResource(id: string) {
    return this.findResource(id);
  }

  private findResource(identificator: string): ResourceModel {
    return this.resources.find(res => res.id === identificator) ||
      this.newResources.find(newRes => newRes.correlationId === identificator);
  }

  private resourcesLength(): number {
    let length = this.resources.length;
    if (this.canCreateResource) {
      length += this.newResources.length + 1;
    }
    return length;
  }

  private isNewCodeValid(code: string): boolean {
    return !this.usedCodes.includes(code);
  }
}

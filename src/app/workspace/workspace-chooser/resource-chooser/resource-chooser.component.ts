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
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {I18n} from '@ngx-translate/i18n-polyfill';
import {isNullOrUndefined} from 'util';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../core/constants';
import {ServiceLevelType} from '../../../core/dto/service-level-type';
import {ResourceType} from '../../../core/model/resource-type';
import {Resource} from '../../../core/model/resource';
import {NotificationService} from '../../../core/notifications/notification.service';
import {CorrelationIdGenerator} from '../../../core/store/correlation-id.generator';
import {Organization} from '../../../core/store/organizations/organization';
import {ServiceLimits} from '../../../core/store/organizations/service-limits/service.limits';
import {animateOpacityFromUp} from '../../../shared/animations';
import {KeyCode} from '../../../shared/key-code';

const squareSize: number = 200;
const arrowSize: number = 40;

@Component({
  selector: 'resource-chooser',
  templateUrl: './resource-chooser.component.html',
  styleUrls: ['./resource-chooser.component.scss'],
  animations: [animateOpacityFromUp],
})
export class ResourceChooserComponent implements OnChanges {
  @ViewChild('resourceContainer')
  public resourceContainer: ElementRef;

  @ViewChild('resourceDescription')
  public resourceDescription: ElementRef;

  @Input() public resourceType: ResourceType;
  @Input() public resources: Resource[];
  @Input() public serviceLimits: ServiceLimits[];
  @Input() public resourcesRoles: {[id: string]: string[]};
  @Input() public selectedId: string;
  @Input() public canCreateResource: boolean;
  @Input() public usedCodes: string[];

  @Output() public resourceDelete: EventEmitter<string> = new EventEmitter();
  @Output() public resourceSelect: EventEmitter<string> = new EventEmitter();
  @Output() public resourceNew: EventEmitter<Resource> = new EventEmitter();
  @Output() public resourceSettings: EventEmitter<string> = new EventEmitter();
  @Output() public resourceUpdate: EventEmitter<Resource> = new EventEmitter();
  @Output() public warningMessage: EventEmitter<string> = new EventEmitter();

  public newResources: Resource[] = [];

  public resourceContentWidth: number = 0;
  public resourceContentLeft: number = arrowSize;
  public resourceWidth: number = squareSize;
  public linesWidth: number = 0;
  public resourceCanScrollLeft: boolean = false;
  public resourceCanScrollRight: boolean = false;
  public resourceScroll: number = 0;
  public resourceLineSizes = [0, 0, 0];
  public resourceVisibleArrows = false;

  public syncingCorrIds: string[] = [];

  public constructor(private i18n: I18n, private notificationService: NotificationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resources) {
      this.checkResources();
      this.compute();
    }
    if (changes.selectedId) {
      this.computeResourceLines(this.getActiveIndex());
    }
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event) {
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
    const resourceContentWidth = this.resourceContainer.nativeElement.clientWidth;
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
    this.resourceCanScrollRight = numVisible > 0 && numPotentiallyVisible - numVisible > 0;
  }

  private getActiveIndex(): number {
    if (isNullOrUndefined(this.resources) || isNullOrUndefined(this.selectedId)) {
      return -1;
    }
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
    this.resourceCanScrollRight = numVisible > 0 && numPotentiallyVisible - numVisible > 0;

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
    this.resourceLineSizes[0] = (this.linesWidth - widthContent) / 2 + index * squareSize;
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
      description: '',
    });
    this.compute();
    this.checkVisibilityNewResource();
  }

  public onResourceSettings(id: string) {
    this.resourceSettings.emit(id);
  }

  public onResourceDelete(resource: Resource) {
    if (resource.id) {
      const message = this.i18n(
        {
          id: 'resource.delete.dialog.message',
          value:
            'Do you really want to delete {resourceType, select, Project {project} Organization {organization}} {{resourceCode}}?',
        },
        {
          resourceType: this.resourceType,
          resourceCode: resource.code,
        }
      );
      const title = this.i18n({id: 'resource.delete.dialog.title', value: 'Delete?'});
      const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
      const noButtonText = this.i18n({id: 'button.no', value: 'No'});

      this.notificationService.confirm(message, title, [
        {text: noButtonText},
        {text: yesButtonText, action: () => this.resourceDelete.emit(resource.id), bold: false},
      ]);
    } else {
      this.newResources = this.newResources.filter(newRes => newRes.correlationId !== resource.correlationId);
      this.compute();
    }
  }

  public onResourceCreate(resource: Resource) {
    if (this.syncingCorrIds.includes(resource.correlationId)) {
      return;
    }

    this.syncingCorrIds.push(resource.correlationId);
    this.resourceNew.emit(resource);
  }

  public onResourceUpdate(resource: Resource) {
    this.resourceUpdate.emit(resource);
  }

  public onKeyDown(event: KeyboardEvent, element: HTMLElement) {
    if (event.code === KeyCode.Enter || event.code === KeyCode.NumpadEnter) {
      element.blur();
    }
  }

  public getRoles(resource: Resource) {
    return (this.resourcesRoles && this.resourcesRoles[resource.id]) || [];
  }

  public onDescriptionBlur(resource: Resource, newDescription: string) {
    const resourceModel = {...resource, description: newDescription};
    this.resourceUpdate.emit(resourceModel);
  }

  public getResourceIdentificator(resource: Resource): string {
    return resource.id || resource.correlationId;
  }

  public getResource(id: string) {
    return this.findResource(id);
  }

  public hasServiceLevel(resource: Resource): boolean {
    return this.resourceType === ResourceType.Organization && !isNullOrUndefined(this.getServiceLevel(resource));
  }

  public getServiceLevel(organization: Organization): ServiceLevelType {
    const serviceLimits = this.getServiceLimits(organization);
    return serviceLimits && serviceLimits.serviceLevel;
  }

  private getServiceLimits(organization: Organization): ServiceLimits {
    return this.serviceLimits && this.serviceLimits.find(limit => limit.organizationId === organization.id);
  }

  private findResource(identificator: string): Resource {
    return (
      this.resources.find(res => res.id === identificator) ||
      this.newResources.find(newRes => newRes.correlationId === identificator)
    );
  }

  private resourcesLength(): number {
    let length = this.resources.length;
    if (this.canCreateResource) {
      length += this.newResources.length + 1;
    }
    return length;
  }

  public getDescriptionPlaceholder(): string {
    return this.i18n({
      id: 'resource.description',
      value: 'Fill in description',
    });
  }
}

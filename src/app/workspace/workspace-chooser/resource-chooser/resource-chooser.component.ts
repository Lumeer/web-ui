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

import {Resource} from '../../../core/dto/resource';
import {isNullOrUndefined} from 'util';
import {Role} from '../../../shared/permissions/role';
import {COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from "../../../collection/constants";
import {OrganizationService} from '../../../core/rest/organization.service';
import {ProjectService} from '../../../core/rest/project.service';
import {NotificationsService} from 'angular2-notifications/dist';
import {Organization} from "../../../core/dto/organization";
import {WorkspaceService} from '../../../core/workspace.service';
import {Project} from '../../../core/dto/project';

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

  @Input() public resourceType: string;
  @Input() public resources: Resource[];
  @Input() public initActiveIx: number;
  @Input() public canCreateResource: boolean;

  @Output() public resourceSelect: EventEmitter<number> = new EventEmitter();
  @Output() public resourceNew: EventEmitter<any> = new EventEmitter();
  @Output() public resourceSettings: EventEmitter<number> = new EventEmitter();
  @Output() public resourceNewDescription: EventEmitter<string> = new EventEmitter();

  public resourceContentWidth: number = 0;
  public resourceContentLeft: number = arrowSize;
  public resourceWidth: number = squareSize;
  public linesWidth: number = 1000;
  public resourceCanScrollLeft: boolean = false;
  public resourceCanScrollRight: boolean = false;
  public resourceScroll: number = 0;
  public resourceActiveIx: number;
  public resourceLineSizes = [0, 0, 0];
  public resourceVisibleArrows = false;
  public newResource;

  public newOrganization: Organization = new Organization();

  public uninitializedResources: Set<Resource> = new Set();

  constructor(private organizationService: OrganizationService,
              private projectService: ProjectService,
              private notificationsService: NotificationsService,
              private workspaceService: WorkspaceService) {
  }

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
    this.computeResourceLines(this.resourceActiveIx);
  }

  private actualizeWidthAndCheck() {
    let resourceContentWidth = this.resourceContainer.nativeElement.clientWidth;
    this.resourceWidth = Math.max((this.resources.length + (this.canCreateResource ? 1 : 0)) * squareSize, resourceContentWidth);
    this.checkForDisableResourceArrows(resourceContentWidth);
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
      const numMaxScroll = this.resources.length + (this.canCreateResource ? 1 : 0) - numVisible;
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
    return Math.min(Math.floor(this.resourceContentWidth / squareSize), this.resources.length + (this.canCreateResource ? 1 : 0));
  }

  private numResourcesPotentiallyVisible(): number {
    return this.resources.length + (this.canCreateResource ? 1 : 0) - Math.abs(this.resourceScroll / squareSize);
  }

  private computeResourceLines(index: number) {
    if (isNullOrUndefined(index)) {
      this.resourceLineSizes = [0, 0, 0];
      return;
    }
    const widthContent = (this.resources.length + 1) * squareSize;
    this.linesWidth = Math.max(this.resourceContainer.nativeElement.clientWidth, widthContent);
    this.resourceLineSizes[0] = (this.linesWidth - widthContent) / 2 + (index * squareSize);
    this.resourceLineSizes[1] = squareSize;
    this.resourceLineSizes[2] = this.linesWidth - this.resourceLineSizes[0] - this.resourceLineSizes[1];
  }

  public onAddResource() {
    this.newResource = {
      name: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON,
      initialized: false
    }

    this.resources.push(this.newResource);
    this.uninitializedResources.add(this.newResource);
    // this.resourceNew.emit();
  }

  public onResourceSettings(index: number) {
    this.resourceSettings.emit(index);
  }

  public hasManageRole(resource: Resource): boolean {
    return resource.permissions && resource.permissions.users.length === 1
      && resource.permissions.users[0].roles.some(r => r === Role.Manage.toString());
  }

  public onCreateOrganization(organization: Organization): boolean {
    this.organizationService.createOrganization(organization).subscribe(response => {
      this.notificationsService
        .success('Success', 'Organization created');
      // const code = response.headers.get('Location').split('/').pop();
      // organization.code = code;
      // console.log(response);
      return true;
    }, error => {
      this.notificationsService
        .error('Error', 'Error creating organization');
      // console.log(error);
      return false;
    });
    return false;
  }

  public onCreateProject(orgCode: string, project: Project): void {
    if (!isNullOrUndefined(orgCode)) {
      this.projectService.createProject(orgCode, project).subscribe(response => this.notificationsService
        .success('Success', 'Project created'), error => this.notificationsService
        .error('Error', 'Error creating project'));
    }
  }


  public initializeResource(resource: Resource): void {
    switch (this.resourceType) {
      case 'organization':
        this.newOrganization = {
          code: 'newcode',
          name: resource.name,
          color: resource.color,
          icon: resource.icon
        };
        let created: boolean = this.onCreateOrganization(this.newOrganization);
        if (created) {
          this.uninitializedResources.delete(resource);
        }
        break;

      case 'project':
        this.onCreateProject(this.workspaceService.organizationCode, resource);
        break;
    }
  }

  public isInitialized(resource: Resource): boolean {
    return !this.uninitializedResources.has(resource);
  }


}

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
import {NotificationsService} from 'angular2-notifications';
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
  @Output() public resourceNewNumber: EventEmitter<any> = new EventEmitter();

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
  public uninitializedResources: Resource[] = [];
  private newProject: Project = new Project();
  private static activeOrganizationIdx: number;
  private static activeOrganizationCode: string;

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
      code: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON,
      initialized: false
    }

    this.uninitializedResources.push(this.newResource);
    this.resources.push(this.newResource);
  }


  public onResourceSettings(index: number) {
    this.resourceSettings.emit(index);
  }

  public hasManageRole(resource: Resource): boolean {
    return resource.permissions && resource.permissions.users.length === 1
      && resource.permissions.users[0].roles.some(r => r === Role.Manage.toString());
  }


  public initializeResource(resource: Resource): void {

    switch (this.resourceType) {
      case 'organization':
        this.newOrganization = {
          code: 'newcode2',
          name: resource.name,
          color: resource.color,
          icon: resource.icon
        };
        this.resourceNew.emit(this.newOrganization);
        break;


      case 'project':
        this.newProject = {
          code: 'newcodeProject',
          name: resource.name,
          color: resource.color,
          icon: resource.icon
        };
        this.resourceNew.emit(this.newProject);
        break;
    }
  }

  public isInitialized(resource: Resource): boolean {
    // console.log('I am initialized ' + !this.uninitializedResources.has(resource));
    // return !this.uninitializedResources.has(resource);

    return !(resource.code == '' || resource.name === '' );
  }


  public isAnyResourceInitializing(): boolean {
    return (this.uninitializedResources.length > 0);
  }

  public updateAndAppendUnitialized(resource: Resource): void {
    console.log('going to update');
    console.log('length unitialized' + this.uninitializedResources.length);
    this.uninitializedResources.splice(0, 1);

    //this.uninitializedResources.
    console.log('length unitialized' + this.uninitializedResources.length);
    console.log(this.resources.length);


    for (let i = 0; i < this.uninitializedResources.length; i++) {

      this.resources.push(this.uninitializedResources[i]);
    }
    console.log(this.resources.length);

    console.log('here');

    for (let i = 0; i < this.resources.length; i++) {
      console.log('A resource');
      console.log(this.resources[i].code);
    }
  }

  public areResourcesEqual(resource1: Resource, resource2: Resource): boolean {
    return (resource1.code === resource2.code && resource1.name === resource2.name && resource1.color === resource2.color
      && resource1.icon === resource2.icon);
  }
}

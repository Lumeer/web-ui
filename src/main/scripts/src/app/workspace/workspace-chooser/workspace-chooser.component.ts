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

import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

import {Organization} from '../../core/dto/organization';
import {Project} from '../../core/dto/project';
import {WorkspaceService} from '../../core/workspace.service';
import {OrganizationService} from '../../core/rest/organization.service';
import {ProjectService} from '../../core/rest/project.service';
import {isNullOrUndefined} from 'util';

const squareSize: number = 200;
const arrowSize: number = 40;

@Component({
  selector: 'workspace-chooser',
  templateUrl: './workspace-chooser.component.html',
  styleUrls: ['./workspace-chooser.component.scss'],
  animations: [
    trigger('animateVisible', [
      state('in', style({opacity: 1})),
      transition('void => *', [
        animate(400, keyframes([
          style({opacity: 0}),
          style({opacity: 1})
        ]))
      ]),
      transition('* => void', [
        animate(400, keyframes([
          style({opacity: 1}),
          style({opacity: 0})
        ]))
      ])
    ])
  ]
})
export class WorkspaceChooserComponent implements OnInit {

  @ViewChild('organizationContainer')
  public orgContainer: ElementRef;

  private organizations: Organization[];
  private orgContentWidth: number = 0;
  private orgContentLeft: number = arrowSize;
  private orgWidth: number = squareSize;
  private orgCanScrollLeft: boolean = false;
  private orgCanScrollRight: boolean = false;
  private orgScroll: number = 0;
  private orgActiveIx: number;
  private orgLineSizes = [0, 0, 0];
  private orgVisibleArrows = false;

  private activeProjectIx: number;

  constructor(private organizationService: OrganizationService,
              private projectService: ProjectService,
              private workspaceService: WorkspaceService,
              private router: Router) {
  }

  @HostListener('window:resize', ['$event'])
  private onResize(event) {
    let orgContentWidth = this.orgContainer.nativeElement.clientWidth;
    this.orgWidth = Math.max((this.organizations.length + 1) * squareSize, orgContentWidth);
    this.checkForDisableOrganizationArrows(orgContentWidth);
    this.checkForScrollRightOrganizations();
  }

  public ngOnInit() {
    this.organizationService.getOrganizations()
      .subscribe(organizations => {
        this.organizations = organizations;
        this.organizations.push(organizations[0], organizations[1], organizations[2], organizations[3]);
        this.organizations.push(organizations[0], organizations[1], organizations[2], organizations[3]);
        this.organizations.push(organizations[0], organizations[1], organizations[2], organizations[3]);
        let orgContentWidth = this.orgContainer.nativeElement.clientWidth;
        this.orgWidth = Math.max((this.organizations.length + 1) * squareSize, orgContentWidth);
        this.checkForDisableOrganizationArrows(orgContentWidth);

        if (this.workspaceService.organizationCode) {
          const ix: number = this.organizations.findIndex(org =>
            org.code === this.workspaceService.organizationCode
          );
          if (ix >= 0) {
            this.orgActiveIx = ix;
            this.computeOrganizationLines(ix);
            this.checkForInitScrollOrganizations(ix);

            const activeOrganization = this.organizations[this.orgActiveIx];
            this.projectService.getProjects(activeOrganization.code)
              .subscribe((projects: Project[]) => {
                activeOrganization.projects = projects;

                if (this.workspaceService.projectCode) {
                  const ixProj: number = activeOrganization.projects.findIndex(proj =>
                    proj.code === this.workspaceService.projectCode
                  );
                  if (ixProj >= 0) {
                    this.activeProjectIx = ixProj;
                  }
                }
              });
          } else {
            this.checkForScrollRightOrganizations();
          }
        } else {
          this.checkForScrollRightOrganizations();
        }
      });
  }

  public onOrganizationSelected(organization: Organization, index: number) {
    if (organization.projects) {
      organization.projects.forEach((project: Project) => project.active = false);
    } else {
      this.projectService.getProjects(organization.code)
        .subscribe((projects: Project[]) => {
          organization.projects = projects;
        });
    }
    this.orgActiveIx = index;
    this.activeProjectIx = undefined;
    this.computeOrganizationLines(index);
  }

  public onScrollOrganization(direction: number) {
    if (direction > 0) {
      this.scrollOrganizationToRight();
    } else {
      this.scrollOrganizationToLeft();
    }
  }

  private scrollOrganizationToLeft() {
    if (!this.orgCanScrollLeft) {
      return;
    }
    this.orgScroll = Math.min(this.orgScroll + squareSize, 0);
    this.orgCanScrollRight = true;
    this.orgCanScrollLeft = this.orgScroll < 0;
  }

  private scrollOrganizationToRight() {
    if (!this.orgCanScrollRight) {
      return;
    }
    this.orgScroll -= squareSize;
    this.orgCanScrollLeft = true;
    const numVisible = this.numOrganizationsVisible();
    const numPotentiallyVisible = this.numOrganizationsPotentiallyVisible();
    this.orgCanScrollRight = numVisible > 0 && (numPotentiallyVisible - numVisible > 0);
  }

  private checkForInitScrollOrganizations(ix: number) {
    if (ix === 0) {
      return;
    }
    const numVisible = this.numOrganizationsVisible();
    if (ix >= numVisible) {
      const numShouldScroll = ix - numVisible + Math.round(numVisible / 2);
      const numMaxScroll = this.organizations.length + 1 - numVisible;
      const numToScroll = Math.min(numShouldScroll, numMaxScroll);
      this.orgScroll = -numToScroll * squareSize;
      this.orgCanScrollLeft = true;
      this.orgCanScrollRight = numToScroll < numMaxScroll;
    }
  }

  private checkForDisableOrganizationArrows(screenWidth: number) {
    if (screenWidth < this.orgWidth) {
      this.orgVisibleArrows = true;
      this.orgContentWidth = screenWidth - 2 * arrowSize;
      this.orgContentLeft = arrowSize;
    } else {
      this.orgVisibleArrows = false;
      this.orgContentWidth = screenWidth;
      this.orgContentLeft = 0;
    }
  }

  private checkForScrollRightOrganizations() {
    const numVisible = this.numOrganizationsVisible();
    const numPotentiallyVisible = this.numOrganizationsPotentiallyVisible();
    this.orgCanScrollRight = numVisible > 0 && (numPotentiallyVisible - numVisible > 0);

    const numToScroll = numVisible - numPotentiallyVisible;
    if (numToScroll > 0) {
      this.orgScroll += numToScroll * squareSize;
    }
  }

  private numOrganizationsVisible(): number {
    return Math.min(Math.floor(this.orgContentWidth / squareSize), this.organizations.length + 1);
  }

  private numOrganizationsPotentiallyVisible(): number {
    return this.organizations.length + 1 - Math.abs(this.orgScroll / squareSize);
  }

  public onCreateOrganization() {
    this.router.navigate(['organization', 'add']);
  }

  public onOrganizationSettings(organization: Organization) {
    this.router.navigate(['organization', organization.code]);
  }

  private computeOrganizationLines(index: number) {
    this.orgLineSizes[0] = index * squareSize;
    this.orgLineSizes[1] = squareSize;
    this.orgLineSizes[2] = (this.organizations.length - index) * squareSize;
  }

  public onCreateProject() {
    if (!isNullOrUndefined(this.orgActiveIx)) {
      this.router.navigate(['organization', this.organizations[this.orgActiveIx].code, 'project', 'add']);
    }
  }

  public onProjectSettings(project: Project) {
    if (!isNullOrUndefined(this.orgActiveIx)) {
      this.router.navigate(['organization', this.organizations[this.orgActiveIx].code, 'project', project.code]);
    }
  }

  public onProjectSelected(project: Project, index: number) {
    this.activeProjectIx = index;
  }

  public onSaveActiveItems() {
    if (!isNullOrUndefined(this.orgActiveIx) && !isNullOrUndefined(this.activeProjectIx)) {
      // TODO save settings on the server using configuration service
      let activeOrgCode = this.organizations[this.orgActiveIx].code;
      let activeProjCode = this.organizations[this.orgActiveIx].projects[this.activeProjectIx].code;
      this.workspaceService.organizationCode = activeOrgCode;
      this.workspaceService.projectCode = activeProjCode;

      this.router.navigate(['w', activeOrgCode, activeProjCode, 'collections']);
    }
  }

}

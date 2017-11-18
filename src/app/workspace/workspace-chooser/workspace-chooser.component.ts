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
import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {first} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {Organization, Project} from '../../core/dto';
import {OrganizationService, ProjectService} from '../../core/rest';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {selectSelectedOrganizationCode} from '../../core/store/organizations/organizations.state';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {selectSelectedProjectCode} from '../../core/store/projects/projects.state';
import {UserSettingsService} from '../../core/user-settings.service';
import {Role} from '../../shared/permissions/role';

@Component({
  selector: 'workspace-chooser',
  templateUrl: './workspace-chooser.component.html',
  styleUrls: ['./workspace-chooser.component.scss'],
  animations: [
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
export class WorkspaceChooserComponent implements OnInit {

  public organizations: Organization[] = [];
  public activeOrgIx: number;
  public activeProjIx: number;

  private selectedOrganizationCode: string;
  private selectedProjectCode: string;

  private workspace: Workspace;


  @ViewChildren(ResourceChooserComponent) resourceChoosers: QueryList<ResourceChooserComponent>;

  constructor(private organizationService: OrganizationService,
              private projectService: ProjectService,
              private store: Store<AppState>,
              private userSettingsService: UserSettingsService,
              private router: Router) {
  }

  public ngOnInit() {
    Observable.combineLatest(
      this.store.select(selectWorkspace),
      this.store.select(selectSelectedOrganizationCode),
      this.store.select(selectSelectedProjectCode)
    ).pipe(
      first() // TODO it should react to all changes
    ).subscribe(([workspace, selectedOrganizationCode, selectedProjectCode]) => {
      this.workspace = workspace;
      this.selectedOrganizationCode = selectedOrganizationCode;
      this.selectedProjectCode = selectedProjectCode;

      this.getOrganizations();
    });
  }

  private getOrganizations(): void {
    this.organizationService.getOrganizations().subscribe(
      organizations => {
        this.organizations = organizations;

        if (this.workspace.organizationCode) {
          const ix: number = this.organizations.findIndex(org =>
            org.code === this.workspace.organizationCode
          );
          if (ix >= 0) {
            this.activeOrgIx = ix;

            const activeOrganization = this.organizations[this.activeOrgIx];
            activeOrganization.projects = [];
            this.projectService.getProjects(activeOrganization.code)
              .subscribe((projects: Project[]) => {
                activeOrganization.projects = projects;

                if (this.workspace.projectCode) {
                  const ixProj: number = activeOrganization.projects.findIndex(proj =>
                    proj.code === this.workspace.projectCode
                  );
                  if (ixProj >= 0) {
                    this.activeProjIx = ixProj;
                  }
                }
              });
          }
        }

        this.selectPreviousWorkspace();
      });
  }

  private selectPreviousWorkspace(): void {
    const previouslySelectedOrganizationIndex = this.getPreviouslySelectedOrganizationIndex();
    if (previouslySelectedOrganizationIndex !== -1) {
      this.activeOrgIx = previouslySelectedOrganizationIndex;
      this.selectPreviouslySelectedProject(previouslySelectedOrganizationIndex);
    }
  }

  private getPreviouslySelectedOrganizationIndex(): number {
    return this.organizations.findIndex(organization => organization.code === this.selectedOrganizationCode);
  }

  private selectPreviouslySelectedProject(index: number) {
    const selectedOrganization = this.organizations[index];
    this.getOrganizationProjects(selectedOrganization).subscribe(
      projects => {
        selectedOrganization.projects = projects;

        const previouslySelectedProjectIndex = this.getPreviouslySelectedProjectIndex(projects);
        if (previouslySelectedProjectIndex !== -1) {
          this.activeProjIx = previouslySelectedProjectIndex;
        }
      }
    );
  }

  private getPreviouslySelectedProjectIndex(projectsToSearchFrom: Project[]): number {
    return projectsToSearchFrom.findIndex(project => project.code === this.selectedProjectCode);
  }

  private getOrganizationProjects(organization: Organization): Observable<Project[]> {
    if (organization.projects) {
      return Observable.of(organization.projects);
    }

    organization.projects = [];
    return this.projectService.getProjects(organization.code);
  }

  public getOrganizations(): void {
    this.organizationService.getOrganizations()
      .subscribe(organizations => {
        console.log('got', organizations);
        this.organizations = organizations;
      });
  }

  public onSelectOrganization(index: number) {
    const selectedOrganization = this.organizations[index];
    if (!selectedOrganization.code) {
      return;
    }
    if (!selectedOrganization.projects) {
      selectedOrganization.projects = [];
      this.projectService.getProjects(selectedOrganization.code)
        .subscribe((projects: Project[]) => {
          selectedOrganization.projects = projects;
        });
    }
    this.activeProjIx = undefined;
    this.activeOrgIx = index;

    this.storeOrganizationInAppState(index);
  }

  private storeOrganizationInAppState(index: number): void {
    const selectedOrganization = this.organizations[index];
    const organizationCode = selectedOrganization.code;
    this.store.dispatch(new OrganizationsAction.Select({organizationCode: organizationCode}));
    this.store.dispatch(new ProjectsAction.Select({projectCode: null}));
  }

  public onOrganizationSettings(index: number) {
    this.router.navigate(['organization', this.organizations[index].code]);
  }

  public onNewOrganizationDescription(description: string) {
    // TODO save for selected organization ix
  }

  public onSelectProject(index: number) {
    this.activeProjIx = index;

    const activeOrganization = this.organizations[this.activeOrgIx];
    const activeProject = activeOrganization.projects[index];

    this.store.dispatch(new ProjectsAction.Select({projectCode: activeProject.code}));
  }

  public onProjectSettings(index: number) {
    if (!isNullOrUndefined(this.activeOrgIx)) {
      const project = this.organizations[this.activeOrgIx].projects[index];
      this.router.navigate(['organization', this.organizations[this.activeOrgIx].code, 'project', project.code]);
    }
  }

  public onNewProjectDescription(description: string) {
    // TODO save for selected project ix
  }

  public hasManageRole(organization: Organization) {
    return organization.permissions && organization.permissions.users.length === 1
      && organization.permissions.users[0].roles.some(r => r === Role.Manage.toString());
  }

  public onSaveActiveItems() {
    if (!isNullOrUndefined(this.activeOrgIx) && !isNullOrUndefined(this.activeProjIx)) {
      let activeOrgCode = this.organizations[this.activeOrgIx].code;
      let activeProjCode = this.organizations[this.activeOrgIx].projects[this.activeProjIx].code;

      this.workspace.organizationCode = activeOrgCode;
      this.workspace.projectCode = activeProjCode;

      this.updateDefaultWorkspace(activeOrgCode, activeProjCode);

      this.router.navigate(['w', activeOrgCode, activeProjCode, 'collections']);
    }
  }

  private updateDefaultWorkspace(organizationCode: string, projectCode: string) {
    let userSettings = this.userSettingsService.getUserSettings();
    userSettings.defaultOrganization = organizationCode;
    userSettings.defaultProject = projectCode;
    this.userSettingsService.updateUserSettings(userSettings);
  }

  public getProjectsOfOrganization(index: number) {
    const selectedOrganization = this.organizations[index];

    selectedOrganization.projects = [];
    this.projectService.getProjects(selectedOrganization.code)
      .subscribe((projects: Project[]) => {
        selectedOrganization.projects = projects;
      });
  }

  public onCreateProject(project: Project): void {
    console.log('creating project', project.code);

    if (!isNullOrUndefined(this.activeOrgIx)) {
      this.projectService.createProject(this.organizations[this.activeOrgIx].code, project).subscribe(() => {
        this.notificationsService
          .success('Success', 'Project created');
        this.getProjectsOfOrganization(this.activeOrgIx);
      }, error => this.notificationsService
        .error('Error', 'Error creating project'));
    }
  }

  public onCreateOrganization(organization: Organization): void {
    this.organizationService.createOrganization(organization)
      .subscribe(() => {
        this.notificationsService
          .success('Success', 'Organization created');
        this.getOrganizations();
        let idxOfCreated = this.organizations.findIndex(org => org.code === organization.code);
        this.activeOrgIx = idxOfCreated;


        if (this.resourceChoosers) {
          console.log('The length is' + this.resourceChoosers.length);
          this.resourceChoosers.forEach(resourceChooser => {
            if (resourceChooser) {
              console.log(resourceChooser.resourceType);
              if (resourceChooser.resourceType === 'organization') {
                resourceChooser.updateAndAppendUnitialized(organization);
              }
            } else {
              console.log('Elements are null');
            }

          });
        }
        else {
          console.log('The list is null');
        }


      }, () => {
        this.notificationsService
          .error('Error', 'Error creating organization');
      });
  }
}

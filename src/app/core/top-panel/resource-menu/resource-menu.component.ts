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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';

import {Resource} from '../../dto';
import {Workspace} from '../../store/navigation/workspace.model';
import {Observable} from 'rxjs/index';
import {OrganizationsAction} from '../../store/organizations/organizations.action';
import {selectAllOrganizations} from '../../store/organizations/organizations.state';
import {OrganizationModel} from '../../store/organizations/organization.model';
import {ProjectModel} from '../../store/projects/project.model';
import {AppState} from '../../store/app.state';
import {Store} from '@ngrx/store';
import {selectProjectsForWorkspace} from '../../store/projects/projects.state';
import {ResourceType} from '../../model/resource-type';
import {ProjectsAction} from '../../store/projects/projects.action';

@Component({
  selector: 'resource-menu',
  templateUrl: './resource-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceMenuComponent implements OnInit, OnChanges {

  @Input() public labelledBy: string = '';
  @Input() public type: ResourceType;
  @Input() public resource: Resource;
  @Input() public workspace: Workspace;

  @Output() public onNewResource = new EventEmitter<ResourceType>();
  @Output() public onResourceSelect = new EventEmitter<Resource>();

  public organizations$: Observable<OrganizationModel[]>;
  public projects$: Observable<ProjectModel[]>;

  private dispatched = false;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.bindData();
  }

  public isOrganizationType(): boolean {
    return this.type === ResourceType.Organization;
  }

  private bindData(): void {
    this.organizations$ = this.store.select(selectAllOrganizations);
    this.projects$ = this.store.select(selectProjectsForWorkspace);
  }

  public newResource(): void {
    this.onNewResource.emit(this.type);
  }

  public selectResource(resource: Resource): void {
    this.onResourceSelect.emit(resource);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.dispatched && this.resource && !this.isOrganizationType()) {
      this.store.dispatch(new ProjectsAction.Get({organizationId: (this.resource as ProjectModel).organizationId}));
      this.dispatched = true;
    }
  }

}

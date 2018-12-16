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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {ResourceType} from '../../../../core/model/resource-type';
import {AppState} from '../../../../core/store/app.state';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {Organization} from '../../../../core/store/organizations/organization';
import {selectAllOrganizations} from '../../../../core/store/organizations/organizations.state';
import {Project} from '../../../../core/store/projects/project';
import {ProjectsAction} from '../../../../core/store/projects/projects.action';
import {selectProjectsForWorkspace} from '../../../../core/store/projects/projects.state';
import {Resource} from '../../../../core/model/resource';

@Component({
  selector: 'resource-menu',
  templateUrl: './resource-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceMenuComponent implements OnInit, OnChanges {
  @Input() public labelledBy: string = '';
  @Input() public type: ResourceType;
  @Input() public resource: Resource;
  @Input() public workspace: Workspace;

  @Output() public onNewResource = new EventEmitter<ResourceType>();
  @Output() public onResourceSelect = new EventEmitter<Resource>();

  public organizations$: Observable<Organization[]>;
  public projects$: Observable<Project[]>;

  private dispatched = false;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.bindData();
  }

  public isOrganizationType(): boolean {
    return this.type === ResourceType.Organization;
  }

  private bindData(): void {
    this.organizations$ = this.store$.pipe(select(selectAllOrganizations));
    this.projects$ = this.store$.pipe(select(selectProjectsForWorkspace));
  }

  public newResource(): void {
    this.onNewResource.emit(this.type);
  }

  public selectResource(resource: Resource): void {
    this.onResourceSelect.emit(resource);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.dispatched && this.resource && !this.isOrganizationType()) {
      this.store$.dispatch(new ProjectsAction.Get({organizationId: (this.resource as Project).organizationId}));
      this.dispatched = true;
    }
  }
}

/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {Component, Input, OnInit} from '@angular/core';
import {ResourceType} from '../../../core/model/resource-type';
import {AppState} from '../../../core/store/app.state';
import {Observable} from 'rxjs';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {select, Store} from '@ngrx/store';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../../core/store/projects/projects.state';

@Component({
  selector: 'selection-lists',
  templateUrl: './selection-lists.component.html',
})
export class SelectionListsComponent implements OnInit {
  @Input()
  public resourceType: ResourceType;

  public organization$: Observable<Organization>;
  public project$: Observable<Project>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
  }
}

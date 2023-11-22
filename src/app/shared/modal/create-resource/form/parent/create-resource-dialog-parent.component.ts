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
import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {Resource} from '../../../../../core/model/resource';
import {ResourceType} from '../../../../../core/model/resource-type';
import {AppState} from '../../../../../core/store/app.state';
import {selectOrganizationById} from '../../../../../core/store/organizations/organizations.state';
import {selectProjectsByOrganizationId} from '../../../../../core/store/projects/projects.state';

@Component({
  selector: 'create-resource-dialog-parent',
  templateUrl: './create-resource-dialog-parent.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceDialogParentComponent implements OnInit {
  @Input()
  public parentId: string;

  @Input()
  public resourceType: ResourceType;

  public parent$: Observable<Resource>;
  public first$: Observable<boolean>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    if (this.resourceType === ResourceType.Project) {
      this.parent$ = this.store$.pipe(select(selectOrganizationById(this.parentId)));
      this.first$ = this.store$.pipe(
        select(selectProjectsByOrganizationId(this.parentId)),
        map(projects => projects?.length === 0)
      );
    }
  }
}

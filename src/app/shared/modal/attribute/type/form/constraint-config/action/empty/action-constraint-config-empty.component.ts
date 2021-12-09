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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {AllowedPermissions} from '../../../../../../../../core/model/allowed-permissions';
import {AttributesResource} from '../../../../../../../../core/model/resource';
import {AppState} from '../../../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {Workspace} from '../../../../../../../../core/store/navigation/workspace';
import {selectWorkspace} from '../../../../../../../../core/store/navigation/navigation.state';

@Component({
  selector: 'action-constraint-config-empty',
  templateUrl: './action-constraint-config-empty.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionConstraintConfigEmptyComponent implements OnInit {
  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public resource: AttributesResource;

  public workspace$: Observable<Workspace>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
  }
}

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

import {Component, ChangeDetectionStrategy, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {User} from '../../../../../../core/store/users/user';
import {Organization} from '../../../../../../core/store/organizations/organization';
import {View} from '../../../../../../core/store/views/view';
import {Project} from '../../../../../../core/store/projects/project';
import {AppState} from '../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Team} from '../../../../../../core/store/teams/team';
import {Observable} from 'rxjs';
import {Collection} from '../../../../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../../../../core/store/collections/collections.state';
import {ResourceType} from '../../../../../../core/model/resource-type';
import {Permissions, Role} from '../../../../../../core/store/permissions/permissions';

@Component({
  selector: 'view-users',
  templateUrl: './view-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewUsersComponent implements OnInit, OnChanges {

  @Input()
  public view: View;

  @Input()
  public staticUsers: User[];

  @Input()
  public otherUsers: User[];

  @Input()
  public teams: Team[];

  @Input()
  public currentUser: User;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public permissions: Permissions;

  @Output()
  public userRemoved = new EventEmitter<User>();

  @Output()
  public userRolesChange = new EventEmitter<{user: User; roles: Role[]}>();

  public collectionsMap$: Observable<Record<string, Collection>>;

  public removableUserIds: string[];

  public readonly resourceType = ResourceType.View;

  constructor(private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.collectionsMap$ = this.store$.pipe(select(selectCollectionsDictionary));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if(changes.otherUsers) {
      this.removableUserIds = (this.otherUsers || []).map(user => user.id);
    }
  }
}

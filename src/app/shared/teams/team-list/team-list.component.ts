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

import {User} from '../../../core/store/users/user';
import {ResourceType} from '../../../core/model/resource-type';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {Workspace} from '../../../core/store/navigation/workspace';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {filter, take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Team} from '../../../core/store/teams/team';
import {selectUsersForWorkspace} from '../../../core/store/users/users.state';
import {Permissions, Role} from '../../../core/store/permissions/permissions';

@Component({
  selector: 'team-list',
  templateUrl: './team-list.component.html',
  styleUrls: ['./team-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent implements OnInit, OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public teams: Team[];

  @Input()
  public permissions: Permissions;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Output()
  public teamCreated = new EventEmitter<string>();

  @Output()
  public teamUpdated = new EventEmitter<Team>();

  @Output()
  public teamDeleted = new EventEmitter<Team>();

  @Output()
  public teamRolesChange = new EventEmitter<{team: Team; roles: Role[]}>();

  public searchString: string;

  public users$: Observable<User[]>;

  private initialWorkspace: Workspace;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.users$ = this.store$.pipe(select(selectUsersForWorkspace));
    this.selectInitialWorkspace();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource || changes.resourceType) {
      // TODO ?
    }
  }

  private selectInitialWorkspace() {
    this.store$
      .pipe(select(selectWorkspaceWithIds))
      .pipe(
        filter(workspace => !!workspace.organizationId),
        take(1)
      )
      .subscribe(workspace => (this.initialWorkspace = workspace));
  }

  public trackByTeam(index: number, team: Team): string {
    return team.id;
  }
}

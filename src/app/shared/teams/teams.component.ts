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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ResourceType} from '../../core/model/resource-type';
import {Team} from '../../core/store/teams/team';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {Resource} from '../../core/model/resource';
import {MemoizedSelector, select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {selectWorkspaceModels} from '../../core/store/common/common.selectors';
import {filter, map, tap} from 'rxjs/operators';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {selectTeamsForWorkspace} from '../../core/store/teams/teams.state';
import {TeamsAction} from '../../core/store/teams/teams.action';
import {Permission, PermissionType, Role} from '../../core/store/permissions/permissions';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {ServiceLimits} from '../../core/store/organizations/service-limits/service.limits';
import {selectServiceLimitsByWorkspace} from '../../core/store/organizations/service-limits/service-limits.state';
import {objectsByIdMap} from '../utils/common.utils';

@Component({
  selector: 'teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsComponent implements OnInit, OnDestroy {
  @Input() public resourceType: ResourceType;

  public teams$: Observable<Team[]>;
  public organization$ = new BehaviorSubject<Organization>(null);
  public project$ = new BehaviorSubject<Project>(null);
  public serviceLimits$: Observable<ServiceLimits>;
  public resource$: Observable<Resource>;

  private resourceId: string;
  private subscriptions = new Subscription();
  private teamsSortedIds: string[] = [];

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeData();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeData() {
    const subscription = this.store$
      .pipe(
        select(selectWorkspaceModels),
        filter(models => !!models.organization)
      )
      .subscribe(models => {
        this.organization$.next(models.organization);
        this.project$.next(models.project);
      });
    this.subscriptions.add(subscription);

    this.teams$ = this.store$.pipe(
      select(selectTeamsForWorkspace),
      map(teams => this.mapAndSortTeams(teams))
    );
    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));

    this.resource$ = this.store$.pipe(
      select(this.getSelector()),
      filter(resource => !!resource),
      tap(resource => (this.resourceId = resource.id))
    );
  }

  private mapAndSortTeams(teams: Team[]): Team[] {
    const teamsSortedByName = objectsByIdMap(teams.sort((team1, team2) => team1.name.localeCompare(team2.name)));
    const teamsSorted = [];
    for (const teamId of this.teamsSortedIds) {
      const team = teamsSortedByName[teamId];
      if (team) {
        teamsSorted.push(team);
      }
      delete teamsSortedByName[teamId];
    }

    for (const teamId of Object.keys(teamsSortedByName)) {
      this.teamsSortedIds.push(teamId);
      teamsSorted.push(teamsSortedByName[teamId]);
    }

    return teamsSorted;
  }

  private getSelector(): MemoizedSelector<AppState, Resource> {
    switch (this.resourceType) {
      case ResourceType.Organization:
        return selectOrganizationByWorkspace;
      case ResourceType.Project:
        return selectProjectByWorkspace;
      case ResourceType.Collection:
        return selectCollectionByWorkspace;
    }
  }

  public onRolesChange(roles: Role[], team: Team) {
    const permissions: Permission[] = [{roles, id: team.id}];
    switch (this.resourceType) {
      case ResourceType.Organization:
        this.store$.dispatch(
          new OrganizationsAction.ChangePermission({
            organizationId: this.resourceId,
            type: PermissionType.Groups,
            permissions,
          })
        );
        break;
      case ResourceType.Project:
        this.store$.dispatch(
          new ProjectsAction.ChangePermission({
            projectId: this.resourceId,
            type: PermissionType.Groups,
            permissions,
          })
        );
        break;
      case ResourceType.Collection:
        this.store$.dispatch(
          new CollectionsAction.ChangePermission({
            collectionId: this.resourceId,
            type: PermissionType.Groups,
            permissions,
          })
        );
        break;
    }
  }

  public onNewTeam(name: string) {
    const team: Team = {name};

    this.store$.dispatch(new TeamsAction.Create({team}));
  }

  public onTeamDeleted(team: Team) {
    this.store$.dispatch(new TeamsAction.Delete({teamId: team.id}));
  }

  public onTeamUpdated(team: Team) {
    this.store$.dispatch(new TeamsAction.Update({team}));
  }
}

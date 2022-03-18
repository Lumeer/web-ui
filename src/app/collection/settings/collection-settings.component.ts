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

import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';

import {filter, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {
  selectNavigatingToOtherWorkspace,
  selectPreviousWorkspaceUrl,
  selectWorkspace,
} from '../../core/store/navigation/navigation.state';
import {convertQueryModelToString} from '../../core/store/navigation/query/query.converter';
import {Workspace} from '../../core/store/navigation/workspace';
import {selectAllUsers, selectCurrentUser} from '../../core/store/users/users.state';
import {Perspective} from '../../view/perspectives/perspective';
import {Query} from '../../core/store/navigation/query/query';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {replaceWorkspacePathInUrl} from '../../shared/utils/data.utils';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {selectCollectionPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {getLastUrlPart} from '../../shared/utils/common.utils';
import {createCollectionQueryStem} from '../../core/store/navigation/query/query.util';
import {UserHintsKeys} from '../../core/store/users/user';
import {UsersAction} from '../../core/store/users/users.action';

@Component({
  templateUrl: './collection-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSettingsComponent implements OnInit, OnDestroy {
  public readonly collectionType = ResourceType.Collection;

  public collection$ = new BehaviorSubject<Collection>(null);
  public permissions$: Observable<AllowedPermissions>;
  public userCount$: Observable<number>;
  public organizationAndProject$: Observable<{organization: Organization; project: Project}>;

  private workspace: Workspace;
  private previousUrl: string;

  public tableIdLabel: string;

  private subscriptions = new Subscription();

  public displayTableAttributesHint$: Observable<boolean>;
  public displayTableRulesHint$: Observable<boolean>;

  @ViewChild('tableId')
  private tableIdElement: ElementRef<HTMLInputElement>;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private store$: Store<AppState>,
    private route: ActivatedRoute
  ) {}

  public ngOnInit() {
    this.subscribeToStore();
    this.tableIdLabel = $localize`:@@collection.settings.tableId:Table ID:`;

    const userHints$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => user.hints)
    );

    this.displayTableAttributesHint$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => !user.hints.tableAttributesHintDismissed)
    );

    this.displayTableRulesHint$ = this.store$.pipe(
      select(selectCurrentUser),
      map(user => !user.hints.tableRulesHintDismissed)
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onNewName(name: string) {
    const collection = {...this.collection$.getValue(), name};
    this.updateCollection(collection);
  }

  public onNewDescription(description: string) {
    const collection = {...this.collection$.getValue(), description};
    this.updateCollection(collection);
  }

  public onNewColorOrIcon(event: {color: string; icon: string}) {
    const {color, icon} = event;
    const collection = {...this.collection$.getValue(), color, icon};
    this.updateCollection(collection);
  }

  private updateCollection(collection: Collection) {
    this.store$.dispatch(new CollectionsAction.Update({collection}));
  }

  public onDelete() {
    const message = $localize`:@@collection.delete.dialog.message:Do you really want to delete this table?`;
    const title = $localize`:@@collection.delete.dialog.title:Delete?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.removeCollection());
  }

  public removeCollection() {
    const collection = this.collection$.getValue();
    if (collection) {
      this.store$.dispatch(new CollectionsAction.Delete({collectionId: collection.id}));
    }
  }

  public onBack() {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: replaceWorkspacePathInUrl(this.previousUrl, this.workspace),
        organizationCode: this.workspace.organizationCode,
        projectCode: this.workspace.projectCode,
      })
    );
  }

  public documentsQuery(collectionId: string): string {
    const query: Query = {stems: [createCollectionQueryStem(collectionId)]};
    return convertQueryModelToString(query);
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public onDocumentsClick() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Table], {
      queryParams: {q: this.documentsQuery(this.collection$.getValue().id)},
    });
  }

  private subscribeToStore() {
    this.userCount$ = this.store$.pipe(
      select(selectAllUsers),
      map(users => (users ? users.length : 0))
    );

    const sub1 = this.store$
      .pipe(
        select(selectWorkspace),
        filter(workspace => !!workspace)
      )
      .subscribe(workspace => (this.workspace = workspace));
    this.organizationAndProject$ = combineLatest([
      this.store$.pipe(select(selectOrganizationByWorkspace)),
      this.store$.pipe(select(selectProjectByWorkspace)),
    ]).pipe(map(([organization, project]) => ({organization, project})));
    this.subscriptions.add(sub1);

    const sub2 = this.store$
      .pipe(
        select(selectCollectionByWorkspace),
        filter(collection => !!collection)
      )
      .subscribe(collection => this.collection$.next({...collection}));
    this.subscriptions.add(sub2);

    this.permissions$ = this.collection$.pipe(
      filter(collection => !!collection),
      switchMap(collection => this.store$.pipe(select(selectCollectionPermissions(collection.id))))
    );

    const sub3 = this.permissions$
      .pipe(
        takeUntil(
          this.store$.pipe(
            select(selectNavigatingToOtherWorkspace),
            filter(navigating => navigating)
          )
        )
      )
      .subscribe(permissions => this.checkCurrentTab(permissions));
    this.subscriptions.add(sub3);

    this.store$.pipe(select(selectPreviousWorkspaceUrl), take(1)).subscribe(url => (this.previousUrl = url));
  }

  private checkCurrentTab(permissions: AllowedPermissions) {
    const currentTab = getLastUrlPart(this.router.url);
    if (this.isInTabWithoutPermissions(permissions, currentTab)) {
      this.navigateToAnyTab(permissions);
    }
  }

  private isInTabWithoutPermissions(permissions: AllowedPermissions, tab: string) {
    switch (tab) {
      case 'attributes':
        return !permissions?.roles?.AttributeEdit;
      case 'rules':
      case 'purpose':
        return !permissions?.roles?.TechConfig;
      case 'users':
      case 'teams':
        return !permissions?.roles?.UserConfig;
      case 'activity':
        return !permissions?.roles?.Manage;
      default:
        return false;
    }
  }

  private navigateToAnyTab(permissions: AllowedPermissions) {
    if (permissions?.roles?.TechConfig) {
      this.router.navigate(['purpose'], {relativeTo: this.route});
    } else if (permissions?.roles?.AttributeEdit) {
      this.router.navigate(['attributes'], {relativeTo: this.route});
    } else if (permissions?.roles?.Manage) {
      this.router.navigate(['activity'], {relativeTo: this.route});
    } else {
      this.router.navigate(['linktypes'], {relativeTo: this.route});
    }
  }

  public onHintDismissed(hintKey: string | UserHintsKeys) {
    switch (hintKey) {
      case 'attributes':
        hintKey = UserHintsKeys.tableAttributesHintDismissed;
        break;
      case 'rules':
        hintKey = UserHintsKeys.tableRulesHintDismissed;
        break;
    }

    this.store$.dispatch(new UsersAction.SetHint({hint: hintKey, value: true}));
  }
}

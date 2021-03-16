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
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';

import {filter, map, take} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectPreviousWorkspaceUrl, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {convertQueryModelToString} from '../../core/store/navigation/query/query.converter';
import {Workspace} from '../../core/store/navigation/workspace';
import {selectAllUsers} from '../../core/store/users/users.state';
import {Perspective} from '../../view/perspectives/perspective';
import {Query} from '../../core/store/navigation/query/query';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {replaceWorkspacePathInUrl} from '../../shared/utils/data.utils';

@Component({
  templateUrl: './collection-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSettingsComponent implements OnInit, OnDestroy {
  public readonly collectionType = ResourceType.Collection;

  public collection$ = new BehaviorSubject<Collection>(null);
  public userCount$: Observable<number>;
  public organizationAndProject$: Observable<{organization: Organization; project: Project}>;

  private workspace: Workspace;
  private previousUrl: string;

  public tableIdLabel: string;

  private subscriptions = new Subscription();

  @ViewChild('tableId')
  private tableIdElement: ElementRef<HTMLInputElement>;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscribeToStore();
    this.tableIdLabel = $localize`:@@collection.settings.tableId:Table ID:`;
  }

  public ngOnDestroy(): void {
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

  public onDelete(): void {
    const message = $localize`:@@collection.delete.dialog.message:Do you really want to delete this table?`;
    const title = $localize`:@@collection.delete.dialog.title:Delete?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.removeCollection());
  }

  public removeCollection(): void {
    const collection = this.collection$.getValue();
    if (collection) {
      this.store$.dispatch(new CollectionsAction.Delete({collectionId: collection.id}));
    }
  }

  public onBack(): void {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: replaceWorkspacePathInUrl(this.previousUrl, this.workspace),
        organizationCode: this.workspace.organizationCode,
        projectCode: this.workspace.projectCode,
      })
    );
  }

  public documentsQuery(collectionId: string): string {
    const query: Query = {stems: [{collectionId: collectionId}]};
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
    this.store$.pipe(select(selectOrganizationByWorkspace));
    this.subscriptions.add(sub1);

    const sub2 = this.store$
      .pipe(
        select(selectCollectionByWorkspace),
        filter(collection => !!collection)
      )
      .subscribe(collection => this.collection$.next({...collection}));
    this.subscriptions.add(sub2);

    this.store$.pipe(select(selectPreviousWorkspaceUrl), take(1)).subscribe(url => (this.previousUrl = url));
  }
}

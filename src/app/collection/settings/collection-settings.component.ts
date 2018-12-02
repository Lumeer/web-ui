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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, Subscription} from 'rxjs';

import {filter, map, take} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectPreviousUrl, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {convertQueryModelToString} from '../../core/store/navigation/query.converter';
import {SearchTab} from '../../core/store/navigation/search-tab';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {selectAllUsers} from '../../core/store/users/users.state';
import {Perspective} from '../../view/perspectives/perspective';
import {Query} from '../../core/store/navigation/query';

@Component({
  templateUrl: './collection-settings.component.html',
})
export class CollectionSettingsComponent implements OnInit, OnDestroy {
  public collection: CollectionModel;
  public userCount$: Observable<number>;

  private workspace: Workspace;
  private previousUrl: string;

  private subscriptions = new Subscription();

  constructor(
    private i18n: I18n,
    private notificationService: NotificationService,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public onNewName(name: string) {
    const collection = {...this.collection, name};
    this.updateCollection(collection);
  }

  public onNewDescription(description: string) {
    const collection = {...this.collection, description};
    this.updateCollection(collection);
  }

  public onNewColor(color: string) {
    const collection = {...this.collection, color};
    this.updateCollection(collection);
  }

  public onNewIcon(icon: string) {
    const collection = {...this.collection, icon};
    this.updateCollection(collection);
  }

  public getResourceType(): ResourceType {
    return ResourceType.Collection;
  }

  private updateCollection(collection: CollectionModel) {
    this.store$.dispatch(new CollectionsAction.Update({collection}));
  }

  public onDelete(): void {
    const message = this.i18n({
      id: 'collection.delete.dialog.message',
      value: 'Do you really want to delete this collection?',
    });
    const title = this.i18n({id: 'collection.delete.dialog.title', value: 'Delete?'});

    this.notificationService.confirm(message, title, [
      {text: 'No'},
      {text: 'Yes', action: () => this.removeCollection(), bold: false},
    ]);
  }

  public removeCollection(): void {
    if (this.collection) {
      this.store$.dispatch(new CollectionsAction.Delete({collectionId: this.collection.id}));
      this.onBack();
    }
  }

  public onBack(): void {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: this.previousUrl,
        organizationCode: this.workspace.organizationCode,
        projectCode: this.workspace.projectCode,
        searchTab: SearchTab.Collections,
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
      queryParams: {query: this.documentsQuery(this.collection.id)},
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
    this.subscriptions.add(sub1);

    const sub2 = this.store$
      .pipe(
        select(selectCollectionByWorkspace),
        filter(collection => !!collection)
      )
      .subscribe(collection => (this.collection = collection));
    this.subscriptions.add(sub2);

    this.store$
      .pipe(
        select(selectPreviousUrl),
        take(1)
      )
      .subscribe(url => (this.previousUrl = url));
  }
}

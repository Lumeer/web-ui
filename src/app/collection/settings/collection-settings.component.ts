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
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';

import {filter, map, take} from 'rxjs/operators';
import {Subscription, Observable} from 'rxjs';
import {isNullOrUndefined} from 'util';
import {Query} from '../../core/dto';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {selectPreviousUrl, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {ResourceType} from '../../core/model/resource-type';
import {Perspective} from '../../view/perspectives/perspective';
import {selectAllUsers} from '../../core/store/users/users.state';

@Component({
  templateUrl: './collection-settings.component.html'
})
export class CollectionSettingsComponent implements OnInit, OnDestroy {

  public collection: CollectionModel;
  public userCount$: Observable<number>;

  private subscription = new Subscription();
  private workspace: Workspace;
  private previousUrl: string;

  constructor(private i18n: I18n,
              private notificationService: NotificationService,
              private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
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

  public onNewCode(code: string) {
    // TODO
  }

  public getResourceType(): ResourceType {
    return ResourceType.Collection;
  }

  private updateCollection(collection: CollectionModel) {
    this.store.dispatch(new CollectionsAction.Update({collection}));
  }

  public onDelete(): void {
    const message = this.i18n({id: 'collection.delete.dialog.message', value: 'Are you sure you want to remove the file?'});
    const title = this.i18n({id: 'collection.delete.dialog.title', value: 'Delete?'});

    this.notificationService.confirm(message, title, [
      {text: 'Yes', action: () => this.removeCollection(), bold: false},
      {text: 'No'}
    ]);
  }

  public removeCollection(): void {
    if (this.collection) {
      this.store.dispatch(new CollectionsAction.Delete({collectionId: this.collection.id}));
      this.onBack();
    }
  }

  public onBack(): void {
    if (this.previousUrl && this.previousUrl !== '/') {
      const urls = this.previousUrl.split('?', 2);
      const params = this.router.parseUrl(this.previousUrl).queryParams;
      const queryParams = urls.length > 1 ? {queryParams: params} : undefined;
      this.router.navigate([urls[0]], queryParams);
    } else {
      this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'collections']);
    }
  }

  public documentsQuery(collectionId: string): string {
    const query: Query = {collectionIds: [collectionId]};
    return QueryConverter.toString(query);
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public onDocumentsClick() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Table2], {queryParams: {query: this.documentsQuery(this.collection.id)}});
  }

  private subscribeToStore() {
    this.userCount$ = this.store.select(selectAllUsers)
      .pipe(map(users => users ? users.length : 0));

    const sub1 = this.store.select(selectWorkspace).pipe(
      filter(workspace => !isNullOrUndefined(workspace))
    ).subscribe(workspace => this.workspace = workspace);
    this.subscription.add(sub1);

    const sub2 = this.store.select(selectCollectionByWorkspace)
      .pipe(filter(collection => !isNullOrUndefined(collection)))
      .subscribe(collection => {
        this.collection = collection;
      });
    this.subscription.add(sub2);

    this.store.select(selectPreviousUrl).pipe(take(1))
      .subscribe(url => this.previousUrl = url);
  }

}

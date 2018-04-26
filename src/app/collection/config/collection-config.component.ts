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

import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {isNullOrUndefined} from 'util';
import {Query} from '../../core/dto';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {CollectionConverter} from '../../core/store/collections/collection.converter';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {CollectionSelectService} from '../service/collection-select.service';

@Component({
  selector: 'collection-config',
  templateUrl: './collection-config.component.html',
  styleUrls: ['./collection-config.component.scss']
})
export class CollectionConfigComponent implements OnInit, OnDestroy {

  public collection: CollectionModel;

  private workspaceSubscription: Subscription;
  private collectionSubscription: Subscription;
  private workspace: Workspace;

  constructor(private collectionSelectService: CollectionSelectService,
              private i18n: I18n,
              private notificationService: NotificationService,
              private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.workspaceSubscription = this.store.select(selectWorkspace).pipe(
      filter(workspace => !isNullOrUndefined(workspace))
    ).subscribe(workspace => this.workspace = workspace);

    this.collectionSubscription = this.store.select(selectCollectionByWorkspace)
      .pipe(filter(collection => !isNullOrUndefined(collection)))
      .subscribe(collection => {
        this.collection = collection;
        this.collectionSelectService.selectCollection(CollectionConverter.toDto(this.collection));
      });
  }

  public ngOnDestroy(): void {
    if (this.workspaceSubscription) {
      this.workspaceSubscription.unsubscribe();
    }
    if (this.collectionSubscription) {
      this.collectionSubscription.unsubscribe();
    }
  }

  public onNewColectionName(newName: string) {
    const collection = {...this.collection, name: newName};
    this.store.dispatch(new CollectionsAction.Update({collection}));
  }

  public onNewColectionDescription(newDescription: string) {
    const collection = {...this.collection, description: newDescription};
    this.store.dispatch(new CollectionsAction.Update({collection}));
  }

  public confirmDeletion(): void {
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
      this.goToCollectionsPage();
    }
  }

  public goToCollectionsPage(): void {
    this.router.navigate([this.workspacePath(), 'view', 'search', 'files']);
  }

  public documentsQuery(collectionId: string): string {
    const query: Query = {collectionIds: [collectionId]};
    return QueryConverter.toString(query);
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

}

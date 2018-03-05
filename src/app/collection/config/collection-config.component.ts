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

import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {Query} from '../../core/dto';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {Role} from '../../shared/permissions/role';
import {CollectionSelectService} from '../service/collection-select.service';
import {CollectionModel} from "../../core/store/collections/collection.model";
import {CollectionsAction} from "../../core/store/collections/collections.action";
import {selectCollection} from "../../core/store/collections/collections.state";
import {CollectionConverter} from "../../core/store/collections/collection.converter";
import {isNullOrUndefined} from "util";
import {PermissionModel} from "../../core/store/permissions/permissions.model";

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
              private notificationService: NotificationService,
              private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.workspaceSubscription = this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);

    this.collectionSubscription = this.store.select(selectCollection)
      .pipe(filter(collection => !isNullOrUndefined(collection)))
      .subscribe(collection => {
        this.collection = collection;
        this.collectionSelectService.selectCollection(CollectionConverter.toDto(this.collection));
      })
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
    this.notificationService.confirm('Are you sure you want to remove the file?', 'Delete?', [
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

  public hasManageRole(collection: CollectionModel): boolean {
    return this.hasRole(collection, Role.Manage);
  }

  private hasRole(collection: CollectionModel, role: string): boolean {
    return collection.permissions && collection.permissions.users
      .some((permission: PermissionModel) => permission.roles.includes(role));
  }

  public goToCollectionsPage(): void {
    this.router.navigate([this.workspacePath(), 'files']);
  }

  public documentsQuery(collectionId: string): string {
    const query: Query = {collectionIds: [collectionId]};
    return QueryConverter.toString(query);
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

}

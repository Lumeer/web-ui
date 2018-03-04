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
import {filter, map, switchMap, tap} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';

import {Collection} from '../../core/dto/collection';
import {Permission} from '../../core/dto/permission';
import {Query} from '../../core/dto/query';
import {NotificationService} from '../../core/notifications/notification.service';
import {CollectionService} from '../../core/rest/collection.service';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {Role} from '../../shared/permissions/role';
import {CollectionSelectService} from '../service/collection-select.service';

@Component({
  selector: 'collection-config',
  templateUrl: './collection-config.component.html',
  styleUrls: ['./collection-config.component.scss']
})
export class CollectionConfigComponent implements OnInit, OnDestroy {

  public collection: Collection;

  private workspaceSubscription: Subscription;
  private workspace: Workspace;

  constructor(private collectionService: CollectionService,
              private collectionSelectService: CollectionSelectService,
              private notificationService: NotificationService,
              private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.workspaceSubscription = this.store.select(selectWorkspace).pipe(
      tap(workspace => this.workspace = workspace),
      map(workspace => workspace.collectionId),
      filter(collectionId => !!collectionId),
      switchMap(collectionId => this.collectionSelectService.select(collectionId)),
      tap(collection => this.collection = collection)
    ).subscribe(
      collection => null,
      error => this.notificationService.error('Failed fetching file')
    );
  }

  public updateCollection(): void {
    this.collectionService.updateCollection(this.collection).pipe(
      switchMap(collection => this.collectionSelectService.selectCollection(collection))
    ).subscribe(
      collection => null,
      error => this.notificationService.error('Failed updating file')
    );
  }

  public removeCollection(): void {
    this.collectionService.removeCollection(this.collection.id).subscribe(
      () => this.goToCollectionsPage(),
      error => this.notificationService.error('Failed removing file')
    );
  }

  public confirmDeletion(): void {
    this.notificationService.confirm('Are you sure you want to remove the file?', 'Delete?', [
      {text: 'Yes', action: () => this.removeCollection(), bold: false},
      {text: 'No'}
    ]);
  }

  public hasManageRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.Manage);
  }

  private hasRole(collection: Collection, role: string): boolean {
    return collection.permissions && collection.permissions.users
      .some((permission: Permission) => permission.roles.includes(role));
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

  public ngOnDestroy(): void {
    this.workspaceSubscription.unsubscribe();
  }

}

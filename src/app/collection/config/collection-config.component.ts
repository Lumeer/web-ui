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

import {Component, OnInit, TemplateRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {SnotifyService} from 'ng-snotify';

import {Collection} from '../../core/dto/collection';
import {CollectionService} from '../../core/rest/collection.service';
import {WorkspaceService} from '../../core/workspace.service';
import {Role} from '../../shared/permissions/role';
import {Permission} from '../../core/dto/permission';
import {QueryConverter} from '../../shared/utils/query-converter';
import {Query} from '../../core/dto/query';
import {CollectionSelectService} from '../service/collection-select.service';
import {combineLatest, map, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'collection-config',
  templateUrl: './collection-config.component.html',
  styleUrls: ['./collection-config.component.scss']
})
export class CollectionConfigComponent implements OnInit {

  public collection: Collection;

  public initialCollectionCode: string;

  public collectionDescriptionEditable: boolean;

  constructor(private collectionService: CollectionService,
              private collectionSelectService: CollectionSelectService,
              private route: ActivatedRoute,
              private notificationService: SnotifyService,
              private workspaceService: WorkspaceService,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.route.paramMap.pipe(
      map(paramMap => paramMap.get('collectionCode')),
      switchMap(collectionCode => this.collectionSelectService.select(collectionCode)),
      tap(collection => this.collection = collection)
    ).subscribe(
      collection => this.initialCollectionCode = collection.code,
      error => this.notificationService.error('Failed fetching collection', 'Error')
    );
  }

  public updateCollection(): void {
    this.collectionService.updateCollection(this.collection).pipe(
      switchMap(collection => this.collectionSelectService.selectCollection(collection))
    ).subscribe(
      collection => this.initialCollectionCode = collection.code,
      error => this.notificationService.error('Failed updating collection', 'Error')
    );
  }

  public updateCollectionCode(): void {
    this.collectionService.updateCollection(this.collection, this.initialCollectionCode).pipe(
      switchMap(collection => this.collectionSelectService.selectCollection(collection)),
      tap(collection => this.initialCollectionCode = collection.code),
      map(collection => [this.workspacePath(), 'c', collection.code]),
      combineLatest(this.route.children[0].url.map(urlSegments => urlSegments.map(segment => segment.path))),
      map(([currentPath, childPath]) => currentPath.concat(childPath)),
      switchMap(segments => this.router.navigate(segments))
    ).subscribe(
      _ => null,
      error => this.notificationService.error('Failed updating collection code', 'Error')
    );
  }

  public removeCollection(): void {
    this.collectionService.removeCollection(this.collection.code).subscribe(
      _ => this.goToCollectionsPage(),
      error => this.notificationService.error('Failed removing collection', 'Error')
    );
  }

  public hasManageRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.Manage);
  }

  private hasRole(collection: Collection, role: string): boolean {
    return collection.permissions && collection.permissions.users
      .some((permission: Permission) => permission.roles.includes(role));
  }

  public goToCollectionsPage(): void {
    this.router.navigate([this.workspacePath(), 'collections']);
  }

  public confirmDeletion(modal: TemplateRef<any>): void {
    this.deleteConfirm = this.modalService.show(modal);
  }

  public documentsQuery(collectionCode: string): string {
    const query: Query = {collectionCodes: [collectionCode]};
    return QueryConverter.toString(query);
  }

  public workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

  public onCollectionDescriptionEdit(): void {
    this.collectionDescriptionEditable = true;
  }

}

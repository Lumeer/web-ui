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

import {NotificationsService} from 'angular2-notifications/dist';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

import {Collection, COLLECTION_NO_CODE, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../core/dto/collection';
import {CollectionService} from '../../core/rest/collection.service';
import {WorkspaceService} from '../../core/workspace.service';
import {Role} from '../../shared/permissions/role';
import {Permission} from '../../core/dto/permission';

@Component({
  selector: 'collection-config',
  templateUrl: './collection-config.component.html',
  styleUrls: ['./collection-config.component.scss']
})
export class CollectionConfigComponent implements OnInit {

  public collection: Collection;

  public initialCollectionCode: string;

  public deleteConfirm: BsModalRef;

  constructor(private collectionService: CollectionService,
              private route: ActivatedRoute,
              private notificationService: NotificationsService,
              private workspaceService: WorkspaceService,
              private router: Router,
              private modalService: BsModalService) {
  }

  public ngOnInit(): void {
    this.refreshOnUrlChange();
  }

  private refreshOnUrlChange(): void {
    this.route.params.forEach(params => this.refreshCollection());
  }

  private refreshCollection(): void {
    if (!this.collection) {
      this.collection = {
        name: '',
        description: 'Tasty collection data',
        code: COLLECTION_NO_CODE,
        icon: COLLECTION_NO_ICON,
        color: COLLECTION_NO_COLOR
      };
    }

    this.getCollectionFromParams();
  }

  private getCollectionFromParams(): void {
    this.route.paramMap
      .map(paramMap => paramMap.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getCollection(collectionCode))
      .subscribe(
        collection => {
          this.collection = collection;
          this.initialCollectionCode = collection.code;
        },
        error => this.notificationService.error('Error', 'Failed fetching collection')
      );
  }

  public updateCollection(): void {
    this.collectionService.updateCollection(this.collection).subscribe(
      collection => this.collection = collection,
      error => this.notificationService.error('Error', 'Failed updating collection')
    );
  }

  public updateCollectionCode(): void {
    this.collectionService.updateCollection(this.collection, this.initialCollectionCode).subscribe(
      collection => this.collection = collection,
      error => this.notificationService.error('Error', 'Failed updating collection code')
    );
  }

  public removeCollection(): void {
    this.collectionService.removeCollection(this.collection.code).subscribe(
      _ => this.goToCollectionsPage(),
      error => this.notificationService.error('Error', 'Failed removing collection')
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

  public workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

}

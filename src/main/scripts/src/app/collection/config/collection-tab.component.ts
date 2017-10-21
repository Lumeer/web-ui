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

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {NotificationsService} from 'angular2-notifications/dist';

import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../core/dto/collection';
import {CollectionService} from '../../core/rest/collection.service';
import {WorkspaceService} from '../../core/workspace.service';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/take';

// Class can't be abstract because of an issue with compiler https://github.com/angular/angular/issues/13590
@Component({template: ''})
export class CollectionTabComponent implements OnInit {

  public collection: Collection;

  constructor(protected collectionService: CollectionService,
              protected route: ActivatedRoute,
              protected notificationService: NotificationsService,
              protected workspaceService: WorkspaceService) {
  }

  public ngOnInit(): void {
    this.getCurrentCollection();
  }

  protected getCurrentCollection(): Promise<Collection> {
    if (!this.collection) {
      this.collection = {
        attributes: [],
        description: '',
        icon: COLLECTION_NO_ICON,
        color: COLLECTION_NO_COLOR,
        name: ''
      };
    }

    return this.getCollectionFromParams();
  }

  private getCollectionFromParams(): Promise<Collection> {
    return this.route.parent.paramMap
      .map(paramMap => paramMap.get('collectionCode'))
      .switchMap(collectionCode => this.collectionService.getCollection(collectionCode))
      .take(1)
      .toPromise()
      .then(collection => this.collection = collection)
      .catch(error => {
        this.notificationService.error('Error', `Failed fetching collection`);
        return null;
      });
  }

  protected updateCollection(): void {
    this.collectionService.updateCollection(this.collection)
      .subscribe(
        collection => this.collection = collection,
        error => this.notificationService.error('Error', 'Failed updating collection')
      );
  }

  protected workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

}

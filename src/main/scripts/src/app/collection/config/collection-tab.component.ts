/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {NotificationsService} from 'angular2-notifications/dist';
import {BsModalService} from 'ngx-bootstrap';

import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../core/dto/collection';
import {CollectionService} from '../../core/rest/collection.service';
import {WorkspaceService} from '../../core/workspace.service';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/take';

@Component({})
export abstract class CollectionTabComponent implements OnInit {

  protected collection: Collection;

  constructor(protected collectionService: CollectionService,
              protected route: ActivatedRoute,
              protected notificationService: NotificationsService,
              protected workspaceService: WorkspaceService,
              protected modalService: BsModalService) {
  }

  public ngOnInit(): void {
    this.getCurrentCollection();
  }

  private async getCurrentCollection(): Promise<void> {
    this.collection = {
      attributes: [],
      icon: COLLECTION_NO_ICON,
      color: COLLECTION_NO_COLOR,
      name: ''
    };

    this.collection = await this.getCollectionFromParams();
  }

  private async getCollectionFromParams(): Promise<Collection> {
    const collectionCode = await this.route.parent.paramMap
      .map(paramMap => paramMap.get('collectionCode'))
      .take(1)
      .toPromise();

    return await this.getCollection(collectionCode);
  }

  protected async getCollection(collectionCode: string): Promise<Collection> {
    return this.collectionService.getCollection(collectionCode)
      .retry(3)
      .take(1)
      .toPromise()
      .catch(error => {
        this.notificationService.error('Error', `Failed fetching collection ${collectionCode}`);
        return null;
      });
  }

  protected updateCollection(): void {
    this.collectionService.updateCollection(this.collection)
      .retry(3)
      .subscribe(
        collection => this.collection = collection,
        error => this.notificationService.error('Error', 'Failed updating collection')
      );
  }

  protected workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

}

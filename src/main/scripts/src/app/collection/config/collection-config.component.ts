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

@Component({
  selector: 'collection-config',
  templateUrl: './collection-config.component.html',
  styleUrls: ['./collection-config.component.scss']
})
export class CollectionConfigComponent implements OnInit {

  public collection: Collection;

  constructor(private collectionService: CollectionService,
              private route: ActivatedRoute,
              private notificationService: NotificationsService,
              private workspaceService: WorkspaceService,
              private modalService: BsModalService) {
  }

  public ngOnInit(): void {
    this.collection = {
      name: '',
      icon: COLLECTION_NO_ICON,
      color: COLLECTION_NO_COLOR
    };

    this.route.paramMap.subscribe(paramMap => {
      this.collectionService.getCollection(paramMap.get('collectionCode'))
        .retry(3)
        .subscribe(
          collection => this.collection = collection,
          error => this.notificationService.error('Error', 'Failed fetching collection')
        );
    });
  }

  public workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

}

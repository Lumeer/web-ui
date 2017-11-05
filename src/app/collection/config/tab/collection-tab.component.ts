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

import {NotificationsService} from 'angular2-notifications';

import {Collection} from '../../../core/dto/collection';
import {CollectionService} from '../../../core/rest/collection.service';
import {WorkspaceService} from '../../../core/workspace.service';
import {CollectionSelectService} from '../../service/collection-select.service';

// Class can't be abstract because of an issue with compiler https://github.com/angular/angular/issues/13590
@Component({template: ''})
export class CollectionTabComponent implements OnInit {

  public collection: Collection;

  constructor(protected collectionService: CollectionService,
              protected collectionSelectService: CollectionSelectService,
              protected route: ActivatedRoute,
              protected notificationService: NotificationsService,
              protected workspaceService: WorkspaceService) {
  }

  public ngOnInit(): void {
    this.collection = this.collectionSelectService.getSelected();
  }

  protected workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

}

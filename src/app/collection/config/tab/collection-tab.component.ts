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
import {Store} from '@ngrx/store';

import {Collection} from '../../../core/dto/collection';
import {CollectionService} from '../../../core/rest/collection.service';
import {CollectionSelectService} from '../../service/collection-select.service';
import {NotificationService} from '../../../notifications/notification.service';
import {AppState} from '../../../core/store/app.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';

// Class can't be abstract because of an issue with compiler https://github.com/angular/angular/issues/13590
@Component({template: ''})
export class CollectionTabComponent implements OnInit {

  public collection: Collection;

  private workspace: Workspace;

  constructor(protected collectionService: CollectionService,
              protected collectionSelectService: CollectionSelectService,
              protected notificationService: NotificationService,
              protected route: ActivatedRoute,
              protected store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);

    this.collection = this.collectionSelectService.getSelected();
  }

  protected workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

}

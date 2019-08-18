/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output, OnDestroy} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {Project} from '../../../core/store/projects/project';
import {Workspace} from '../../../core/store/navigation/workspace';
import {CollectionFavoriteToggleService} from '../../toggle/collection-favorite-toggle.service';
import {Router} from '@angular/router';
import {Perspective} from '../../../view/perspectives/perspective';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Query} from '../../../core/store/navigation/query/query';
import {QueryParam} from '../../../core/store/navigation/query-param';
import {ResourceType} from '../../../core/model/resource-type';
import {CollectionImportData} from './import-button/post-it-collection-import-button.component';
import {safeGetRandomIcon} from '../../picker/icon-picker/icons';
import * as Colors from '../../picker/color-picker/colors';
import {isNullOrUndefined} from '../../utils/common.utils';
import {NotificationService} from '../../../core/notifications/notification.service';
import {I18n} from '@ngx-translate/i18n-polyfill';

const UNCREATED_THRESHOLD = 5;

@Component({
  selector: 'post-it-collections-wrapper',
  templateUrl: './post-it-collections-wrapper.component.html',
  styleUrls: ['./post-it-collections-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CollectionFavoriteToggleService],
})
export class PostItCollectionsWrapperComponent implements OnInit, OnDestroy {
  @Input()
  public maxCollections: number;

  @Input()
  public collections: Collection[];

  @Input()
  public project: Project;

  @Input()
  public workspace: Workspace;

  @Input()
  public query: Query;

  @Output()
  public delete = new EventEmitter<Collection>();

  @Output()
  public update = new EventEmitter<Collection>();

  @Output()
  public create = new EventEmitter<Collection>();

  @Output()
  public import = new EventEmitter<{importData: CollectionImportData; emptyCollection: Collection}>();

  public readonly projectType = ResourceType.Project;
  private readonly colors = Colors.palette;

  constructor(
    private toggleService: CollectionFavoriteToggleService,
    private notificationService: NotificationService,
    private i18n: I18n,
    private router: Router
  ) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
  }

  public onShowAllClicked() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'collections'], {
      queryParams: {[QueryParam.Query]: convertQueryModelToString(this.query)},
    });
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public trackByCollection(index: number, collection: Collection): string {
    return collection.correlationId || collection.id;
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }

  public onFavoriteToggle(collection: Collection) {
    this.toggleService.set(collection.id, !collection.favorite);
  }

  public updateCollection(collection: Collection) {
    this.update.emit(collection);
  }

  public createCollection(collection: Collection) {
    this.create.emit(collection);
  }

  public deleteCollection(collection: Collection) {
    if (collection.id) {
      this.delete.emit(collection);
    } else {
      // TODO
    }
  }

  public createNewCollection() {
    // TODO
  }

  public notifyOfError(error: string) {
    this.notificationService.error(error);
  }

  public onImportCollection(importData: CollectionImportData) {
    this.import.emit({importData, emptyCollection: this.emptyCollection()});
  }

  private emptyCollection(): Collection {
    return {
      name: '',
      color: this.colors[Math.round(Math.random() * this.colors.length)],
      icon: safeGetRandomIcon(),
      description: '',
      attributes: [],
    };
  }

  private checkNumberOfUncreatedCollections() {
    const numUncreated = this.collections.filter(coll => isNullOrUndefined(coll.id)).length;

    if (numUncreated % UNCREATED_THRESHOLD === 0) {
      const message = this.i18n({
        id: 'collections.postit.empty.info',
        value:
          'Looks like you have lot of empty tables. Is it okay? I would suggest to fill in their names or delete them.',
      });

      this.notificationService.info(message);
    }
  }
}

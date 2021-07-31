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

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {Workspace} from '../../../core/store/navigation/workspace';
import {CollectionFavoriteToggleService} from '../../toggle/collection-favorite-toggle.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Perspective} from '../../../view/perspectives/perspective';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Query} from '../../../core/store/navigation/query/query';
import {QueryParam} from '../../../core/store/navigation/query-param';
import {CollectionImportData} from './import-button/post-it-collection-import-button.component';
import {safeGetRandomIcon} from '../../picker/icons';
import * as Colors from '../../picker/colors';
import {isNullOrUndefined} from '../../utils/common.utils';
import {NotificationService} from '../../../core/notifications/notification.service';
import {BehaviorSubject} from 'rxjs';
import {generateCorrelationId} from '../../utils/resource.utils';
import {animate, style, transition, trigger} from '@angular/animations';
import {take} from 'rxjs/operators';
import {QueryAction} from '../../../core/model/query-action';
import {SearchTab} from '../../../core/store/navigation/search-tab';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ConfigurationService} from '../../../configuration/configuration.service';

const UNCREATED_THRESHOLD = 5;

@Component({
  selector: 'post-it-collections-content',
  templateUrl: './post-it-collections-content.component.html',
  styleUrls: ['./post-it-collections-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CollectionFavoriteToggleService],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({transform: 'translateX(-50%)', opacity: '0'}),
        animate('.3s ease-out', style({transform: 'translateX(0%)', opacity: '1'})),
      ]),
      transition(':leave', [
        style({transform: 'translateX(0%)', opacity: '1'}),
        animate('.3s ease-out', style({transform: 'translateX(-50%)', opacity: '0'})),
      ]),
    ]),
  ],
})
export class PostItCollectionsContentComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public maxCollections: number;

  @Input()
  public collections: Collection[];

  @Input()
  public projectPermissions: AllowedPermissions;

  @Input()
  public workspace: Workspace;

  @Input()
  public query: Query;

  @Input()
  public showAddTaskTable: boolean;

  @Output()
  public delete = new EventEmitter<Collection>();

  @Output()
  public update = new EventEmitter<Collection>();

  @Output()
  public create = new EventEmitter<Collection>();

  @Output()
  public import = new EventEmitter<{importData: CollectionImportData; emptyCollection: Collection}>();

  public allCollections$ = new BehaviorSubject<Collection[]>([]);
  public selectedCollections$ = new BehaviorSubject<string[]>([]);
  public correlationIdsOrder = [];

  public readonly canImportCollection: boolean;

  private readonly colors = Colors.palette;

  constructor(
    private toggleService: CollectionFavoriteToggleService,
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private configurationService: ConfigurationService
  ) {
    this.canImportCollection = !configurationService.getConfiguration().publicView;
  }

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
    this.subscribeOnRoute();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections) {
      this.initCollections();
    }
  }

  private initCollections() {
    const currentCollections = this.allCollections$.getValue();
    const newCollections = this.collections || [];
    const collectionsWithCorrelationId: Collection[] = [];
    for (const correlationId of this.correlationIdsOrder) {
      let collection = newCollections.find(coll => coll.correlationId === correlationId);
      if (newCollections.find(coll => coll.correlationId === correlationId)) {
        collectionsWithCorrelationId.push(collection);
      } else {
        collection = currentCollections.find(coll => coll.correlationId === correlationId);
        if (!collection.id) {
          collectionsWithCorrelationId.push(collection);
        }
      }
    }

    const newCollectionsFiltered = newCollections.filter(
      coll => !collectionsWithCorrelationId.find(c => c.id === coll.id)
    );
    this.allCollections$.next([...collectionsWithCorrelationId, ...newCollectionsFiltered]);
    this.correlationIdsOrder = collectionsWithCorrelationId.map(coll => coll.correlationId);
  }

  public onShowAllClicked() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, SearchTab.Collections], {
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
      this.correlationIdsOrder = this.correlationIdsOrder.filter(id => id !== collection.correlationId);
      const collections = this.allCollections$
        .getValue()
        .filter(coll => coll.correlationId !== collection.correlationId);
      this.allCollections$.next(collections);
    }
  }

  public createNewCollection() {
    const newCollection = {...this.emptyCollection(), correlationId: generateCorrelationId()};
    this.correlationIdsOrder.unshift(newCollection.correlationId);
    this.allCollections$.next([newCollection, ...this.allCollections$.getValue()]);

    this.checkNumberOfUncreatedCollections();
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
    const numUncreated = this.allCollections$.getValue().filter(coll => isNullOrUndefined(coll.id)).length;

    if (numUncreated % UNCREATED_THRESHOLD === 0) {
      const message = $localize`:@@collections.postit.empty.info:Looks like you have lot of empty tables. Is it okay? I would suggest to fill in their names or delete them.`;
      this.notificationService.info(message);
    }
  }

  public onCollectionSelected(collection: Collection) {
    this.selectedCollections$.next([
      collection.correlationId || collection.id,
      ...this.selectedCollections$.getValue(),
    ]);
  }

  public onCollectionUnselected(collection: Collection) {
    this.selectedCollections$.next(
      this.selectedCollections$.getValue().filter(id => id !== (collection.correlationId || collection.id))
    );
  }

  private subscribeOnRoute() {
    this.activatedRoute.queryParamMap.pipe(take(1)).subscribe(queryParamsMap => {
      const action = queryParamsMap.get('action');
      if (action && action === QueryAction.CreateCollection) {
        this.createNewCollection();

        const myQueryParams = queryParamsMap.keys.reduce((acc, key) => {
          if (key !== 'action') {
            acc[key] = queryParamsMap.get(key);
          }
          return acc;
        }, {});
        this.router.navigate([], {
          relativeTo: this.activatedRoute,
          queryParams: myQueryParams,
        });
      }
    });
  }
}

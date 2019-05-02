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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanCollectionConfig, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {buildKanbanConfig} from '../util/kanban.util';
import isEqual from 'lodash/isEqual';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {Query} from '../../../../core/store/navigation/query';
import {getBaseCollectionIdsFromQuery, queryIsEmpty} from '../../../../core/store/navigation/query.util';

@Component({
  selector: 'kanban-config',
  templateUrl: './kanban-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanConfigComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<KanbanConfig>();

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents || changes.collections) {
      this.checkConfigColumns(this.config);
    }
    if (changes.query) {
      this.checkQueryCollections();
    }
  }

  private checkConfigColumns(kanbanConfig: KanbanConfig) {
    const config = buildKanbanConfig(kanbanConfig, this.documents, this.collections, this.constraintData);
    if (!isEqual(config, this.config)) {
      setTimeout(() => this.configChange.emit(config));
    }
  }

  private checkQueryCollections() {
    const collectionIdsInQuery = getBaseCollectionIdsFromQuery(this.query);
    if (this.config && collectionIdsInQuery.length > 0) {
      const collectionsConfig = {...this.config.collections};
      const collectionIdsToRemove = Object.entries(collectionsConfig)
        .filter(([, collectionConfig]) => collectionConfig && !!collectionConfig.attribute)
        .map(([collectionId]) => collectionId)
        .filter(collectionId => !collectionIdsInQuery.includes(collectionId));

      if (collectionIdsToRemove.length > 0) {
        collectionIdsToRemove.forEach(collectionId => delete collectionsConfig[collectionId]);
        const newConfig = {...this.config, collections: collectionsConfig};
        this.checkConfigColumns(newConfig);
      }
    }
  }

  public trackByCollection(index: number, collection: Collection): string {
    return collection.id;
  }

  public onCollectionConfigChange(collection: Collection, collectionConfig: KanbanCollectionConfig) {
    const collectionsConfig = {...this.config.collections, [collection.id]: collectionConfig};
    const newConfig = {...this.config, collections: collectionsConfig};
    const config = buildKanbanConfig(newConfig, this.documents, this.collections, this.constraintData);
    this.configChange.emit(config);
  }
}

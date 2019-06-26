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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanCollectionConfig, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {Query} from '../../../../core/store/navigation/query';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {KanbanConverter} from '../util/kanban-converter';
import {checkOrTransformKanbanConfig} from '../util/kanban.util';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';

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

  private readonly converter: KanbanConverter;

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {
    this.converter = new KanbanConverter(constraintItemsFormatter);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents || changes.collections || changes.constraintData || changes.query) {
      this.checkConfigColumns();
    }
  }

  private checkConfigColumns() {
    const config = this.converter.buildKanbanConfig(
      checkOrTransformKanbanConfig(this.config, this.collections),
      this.documents,
      this.collections,
      this.constraintData
    );
    if (!deepObjectsEquals(config, this.config)) {
      setTimeout(() => this.configChange.emit(config));
    }
  }

  public trackByCollection(index: number, collection: Collection): string {
    return collection.id;
  }

  public onCollectionConfigChange(collection: Collection, collectionConfig: KanbanCollectionConfig) {
    const collectionsConfig = {...this.config.collections, [collection.id]: collectionConfig};
    const newConfig = {...this.config, collections: collectionsConfig};
    const config = this.converter.buildKanbanConfig(newConfig, this.documents, this.collections, this.constraintData);
    this.configChange.emit(config);
  }
}

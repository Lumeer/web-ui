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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanConfig, KanbanStemConfig, KanbanValueAttribute} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {KanbanConverter} from '../util/kanban-converter';
import {checkOrTransformKanbanConfig, createDefaultKanbanStemConfig} from '../util/kanban.util';
import {deepObjectCopy, deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {AttributesResourceType} from '../../../../core/model/resource';

@Component({
  selector: 'kanban-config',
  templateUrl: './kanban-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanConfigComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<KanbanConfig>();

  private readonly converter: KanbanConverter;

  public readonly defaultStemConfig = createDefaultKanbanStemConfig();

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {
    this.converter = new KanbanConverter(constraintItemsFormatter);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents || changes.collections || changes.linkTypes || changes.constraintData || changes.query) {
      this.checkConfigColumns();
    }
  }

  private checkConfigColumns() {
    const config = this.converter.buildKanbanConfig(
      checkOrTransformKanbanConfig(this.config, this.query, this.collections, this.linkTypes),
      this.collections,
      this.linkTypes,
      this.documents,
      this.linkInstances,
      this.constraintData
    );
    if (!deepObjectsEquals(config, this.config)) {
      setTimeout(() => this.configChange.emit(config));
    }
  }

  public trackByStem(index: number, stem: QueryStem): string {
    return stem.collectionId + index;
  }

  public onConfigChange(stemConfig: KanbanStemConfig, stem: QueryStem, index: number) {
    const newConfig = deepObjectCopy<KanbanConfig>(this.config);
    newConfig.stemsConfigs[index] = {...stemConfig, stem};

    // remove aggregation when the cards are from different collection
    if (newConfig && newConfig.aggregation) {
      const existingResources = (newConfig.stemsConfigs || [])
        .map(_stemConfig => _stemConfig.attribute)
        .filter(attribute => attribute.resourceType === AttributesResourceType.Collection)
        .map(attribute => attribute.resourceId);

      if (existingResources.indexOf(this.config.aggregation.resourceId) < 0) {
        newConfig.aggregation = null;
      }
    }

    this.rebuildConfigChange(newConfig);
  }

  private rebuildConfigChange(newConfig: KanbanConfig) {
    const config = this.converter.buildKanbanConfig(
      newConfig,
      this.collections,
      this.linkTypes,
      this.documents,
      this.linkInstances,
      this.constraintData
    );
    this.configChange.emit(config);
  }

  public onAggregateAttributeSelect(attribute: KanbanValueAttribute) {
    this.rebuildConfigChange({...this.config, aggregation: attribute});
  }

  public onAggregateAttributeRemove() {
    this.rebuildConfigChange({...this.config, aggregation: null});
  }
}

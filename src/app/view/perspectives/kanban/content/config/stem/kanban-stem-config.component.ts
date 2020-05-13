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
import {Constraint} from '../../../../../../core/model/constraint';
import {Collection} from '../../../../../../core/store/collections/collection';
import {KanbanAttribute, KanbanResource, KanbanStemConfig} from '../../../../../../core/store/kanbans/kanban';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SelectItemWithConstraintId} from '../../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {queryStemAttributesResourcesOrder} from '../../../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../../../shared/utils/resource.utils';
import {AttributesResource} from '../../../../../../core/model/resource';
import {QueryResource} from '../../../../../../core/model/query-attribute';

@Component({
  selector: 'kanban-stem-config',
  templateUrl: './kanban-stem-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanStemConfigComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public config: KanbanStemConfig;

  @Input()
  public stem: QueryStem;

  @Input()
  public columnTitles: any[];

  @Output()
  public configChange = new EventEmitter<{config: KanbanStemConfig; shouldRebuildConfig: boolean}>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly emptyValueString: string;
  public readonly emptyResourceString: string;
  public readonly dueDateEmptyValueString: string;
  public readonly doneAttributeEmptyValueString: string;
  public readonly doneAttributeString: string;

  public attributesResourcesOrder: AttributesResource[];

  constructor(private i18n: I18n) {
    this.emptyResourceString = i18n({id: 'kanban.config.collection.resource.empty', value: 'Select table or link'});
    this.emptyValueString = i18n({id: 'kanban.config.collection.attribute.empty', value: 'Select attribute'});
    this.dueDateEmptyValueString = i18n({id: 'kanban.config.collection.dueDate.empty', value: 'Select due date'});
    this.doneAttributeEmptyValueString = i18n({
      id: 'kanban.config.collection.doneAttribute.empty',
      value: 'Select done state',
    });
    this.doneAttributeString = i18n({id: 'kanban.config.collection.doneAttribute', value: 'Done state'});
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.stem || changes.collections || changes.linkTypes) {
      this.attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
    }
  }

  public onAttributeSelected(selectId: SelectItemWithConstraintId) {
    this.configElementSelected(selectId, 'attribute');
  }

  public onAttributeConstraintSelected(constraint: Constraint) {
    const attribute = {...this.config.attribute};
    this.onConfigChange({...this.config, attribute: {...attribute, constraint}});
  }

  public onAttributeRemoved() {
    this.onConfigChange({...this.config, attribute: null, resource: null});
  }

  public onDueDateSelected(attribute: KanbanAttribute) {
    this.onConfigChange({...this.config, dueDate: attribute}, false);
  }

  public onDueDateRemoved() {
    this.onConfigChange({...this.config, dueDate: null}, false);
  }

  public onDoneColumnRemoved(index: number) {
    const newTitles = [
      ...(this.config.doneColumnTitles.slice(0, index) || []),
      ...(this.config.doneColumnTitles.slice(index + 1) || []),
    ];
    const doneColumnTitles = newTitles.length ? newTitles : undefined;
    this.onConfigChange({...this.config, doneColumnTitles}, false);
  }

  public onDoneColumnSelected(selectId: string, index: number) {
    if (index === -1) {
      const newTitles = [...(this.config.doneColumnTitles || []), selectId];
      this.onConfigChange({...this.config, doneColumnTitles: newTitles}, false);
    } else {
      const doneColumnTitles = [...this.config.doneColumnTitles];
      doneColumnTitles.splice(index, 1, selectId);
      this.onConfigChange({...this.config, doneColumnTitles}, false);
    }
  }

  private configElementSelected(selectId: SelectItemWithConstraintId, element: string) {
    const {attributeId, resourceIndex} = selectId;
    const resource = (this.attributesResourcesOrder || [])[resourceIndex];
    if (resource) {
      const resourceType = getAttributesResourceType(resource);
      const selection = {attributeId, resourceIndex, resourceType, resourceId: resource.id};

      const config = {...this.config, doneColumnTitles: []};
      config[element] = selection;

      this.onConfigChange(config);
    }
  }

  public onAggregationSelected(aggregation: KanbanAttribute) {
    this.onConfigChange({...this.config, aggregation}, false);
  }

  public onAggregationRemoved() {
    this.onConfigChange({...this.config, aggregation: null}, false);
  }

  private onConfigChange(config: KanbanStemConfig, shouldRebuildConfig: boolean = true) {
    const kanbanResource: KanbanResource = config.resource || config.attribute;
    if (config.aggregation && !this.areFromSameResource(config.aggregation, kanbanResource)) {
      config.aggregation = null;
    }

    if (config.dueDate && !this.areFromSameResource(config.dueDate, kanbanResource)) {
      config.dueDate = null;
    }

    this.configChange.emit({config, shouldRebuildConfig});
  }

  private areFromSameResource(a1: KanbanResource, a2: KanbanResource): boolean {
    return a1 && a2 && a1.resourceIndex === a2.resourceIndex;
  }

  public onResourceSelected(resource: QueryResource) {
    this.onConfigChange({...this.config, resource});
  }

  public onResourceRemoved() {
    this.onConfigChange({...this.config, resource: null});
  }
}

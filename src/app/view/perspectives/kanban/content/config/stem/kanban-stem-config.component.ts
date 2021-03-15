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
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {KanbanAttribute, KanbanResource, KanbanStemConfig} from '../../../../../../core/store/kanbans/kanban';
import {SelectItemWithConstraintId} from '../../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {queryStemAttributesResourcesOrder} from '../../../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../../../shared/utils/resource.utils';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../../../core/model/resource';
import {QueryResource} from '../../../../../../core/model/query-attribute';
import {findAttribute} from '../../../../../../core/store/collections/collection.util';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {AppState} from '../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectDocumentsByCollectionId} from '../../../../../../core/store/documents/documents.state';
import {selectLinkInstancesByType} from '../../../../../../core/store/link-instances/link-instances.state';
import {DataInputConfiguration} from '../../../../../../shared/data-input/data-input-configuration';
import {isArray} from '../../../../../../shared/utils/common.utils';
import {Constraint, ConstraintData, DataValue} from '@lumeer/data-filters';

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
  public constraintData: ConstraintData;

  @Output()
  public configChange = new EventEmitter<{config: KanbanStemConfig; shouldRebuildConfig: boolean}>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly emptyValueString: string;
  public readonly emptyResourceString: string;
  public readonly dueDateEmptyValueString: string;
  public readonly dataInputConfiguration: DataInputConfiguration = {select: {wrapItems: true}};

  public attributesResourcesOrder: AttributesResource[];
  public attribute: Attribute;
  public attributeResource: AttributesResource;
  public dataResources$: Observable<DataResource[]>;
  public doneTitlesEditing$ = new BehaviorSubject(false);

  constructor(private store$: Store<AppState>) {
    this.emptyResourceString = $localize`:@@kanban.config.collection.resource.empty:Select table or link`;
    this.emptyValueString = $localize`:@@kanban.config.collection.attribute.empty:Select attribute`;
    this.dueDateEmptyValueString = $localize`:@@kanban.config.collection.dueDate.empty:Select due date`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.stem || changes.collections || changes.linkTypes) {
      this.attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
    }
    if (changes.config || changes.collections || changes.linkTypes) {
      this.bindData();
    }
  }

  private bindData() {
    this.attributeResource =
      this.config.attribute && this.attributesResourcesOrder[this.config.attribute.resourceIndex];
    this.attribute =
      this.config.attribute && findAttribute(this.attributeResource?.attributes, this.config.attribute.attributeId);
    if (this.attributeResource) {
      if (this.config.attribute.resourceType === AttributesResourceType.Collection) {
        this.dataResources$ = this.store$.pipe(select(selectDocumentsByCollectionId(this.attributeResource.id)));
      } else {
        this.dataResources$ = this.store$.pipe(select(selectLinkInstancesByType(this.attributeResource.id)));
      }
    } else {
      this.dataResources$ = of([]);
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

  public doneTitlesEditing(editing: boolean) {
    this.doneTitlesEditing$.next(editing);
  }

  public onDoneTitlesChange(dataValue: DataValue) {
    const serializedValue = dataValue.serialize();
    this.doneTitlesEditing(false);
    this.onConfigChange({
      ...this.config,
      doneColumnTitles: isArray(serializedValue) ? serializedValue : [serializedValue],
    });
  }
}

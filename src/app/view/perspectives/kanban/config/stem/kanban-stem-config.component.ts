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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Constraint} from '../../../../../core/model/constraint';
import {Collection} from '../../../../../core/store/collections/collection';
import {KanbanAttribute, KanbanStemConfig} from '../../../../../core/store/kanbans/kanban';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../core/store/navigation/query/query';
import {queryStemAttributesResourcesOrder} from '../../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';
import {findAttributeConstraint} from '../../../../../core/store/collections/collection.util';

@Component({
  selector: 'kanban-collection-config',
  templateUrl: './kanban-stem-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanStemConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public config: KanbanStemConfig;

  @Input()
  public stem: QueryStem;

  @Input()
  public columnTitles: string[];

  @Output()
  public configChange = new EventEmitter<KanbanStemConfig>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly emptyValueString: string;
  public readonly dueDateEmptyValueString: string;
  public readonly dueDateString: string;
  public readonly doneAttributeEmptyValueString: string;
  public readonly doneAttributeString: string;
  public readonly doneValueString: string;

  constructor(private i18n: I18n) {
    this.emptyValueString = i18n({id: 'kanban.config.collection.attribute.empty', value: 'Select attribute'});
    this.dueDateEmptyValueString = i18n({id: 'kanban.config.collection.dueDate.empty', value: 'Select due date'});
    this.dueDateString = i18n({id: 'kanban.config.collection.dueDate', value: 'Due date'});
    this.doneAttributeEmptyValueString = i18n({
      id: 'kanban.config.collection.doneAttribute.empty',
      value: 'Select done state',
    });
    this.doneAttributeString = i18n({id: 'kanban.config.collection.doneAttribute', value: 'Done state'});
    this.doneValueString = i18n({id: 'kanban.config.collection.doneAttribute', value: 'Done value'});
  }

  public onAttributeRemoved() {
    this.configChange.emit({...this.config, attribute: null});
  }

  public onDueDateRemoved() {
    this.configChange.emit({...this.config, dueDate: null});
  }

  public onDoneColumnRemoved(index: number) {
    const newTitles = [
      ...(this.config.doneColumnTitles.slice(0, index) || []),
      ...(this.config.doneColumnTitles.slice(index + 1) || []),
    ];
    const doneColumnTitles = newTitles.length ? newTitles : undefined;
    this.configChange.emit({...this.config, doneColumnTitles});
  }

  public onConstraintSelected(constraint: Constraint) {
    const attribute = {...this.config.attribute};
    this.configChange.emit({...this.config, attribute: {...attribute, constraint}});
  }

  public onAttributeSelected(selectId: SelectItemWithConstraintId) {
    this.configElementSelected(selectId, 'attribute');
  }

  public onDueDateSelected(attribute: KanbanAttribute) {
    const config = {...this.config, dueDate: attribute};
    this.configChange.emit(config);
  }

  public onDoneColumnSelected(selectId: string, index: number) {
    if (index === -1) {
      const newTitles = [...(this.config.doneColumnTitles || []), selectId];
      this.configChange.emit({...this.config, doneColumnTitles: newTitles});
    } else {
      this.configChange.emit({
        ...this.config,
        doneColumnTitles: this.config.doneColumnTitles.splice(index, 1, selectId),
      });
    }
  }

  private configElementSelected(selectId: SelectItemWithConstraintId, element: string) {
    const {attributeId, resourceIndex} = selectId;
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
    const resource = attributesResourcesOrder[resourceIndex];
    const constraint = findAttributeConstraint(resource.attributes, attributeId);
    if (resource) {
      const resourceType = getAttributesResourceType(resource);
      const selection = {attributeId, resourceIndex, resourceType, resourceId: resource.id, constraint};

      const config = {...this.config, doneColumnTitles: []};
      config[element] = selection;

      this.configChange.emit(config);
    }
  }
}

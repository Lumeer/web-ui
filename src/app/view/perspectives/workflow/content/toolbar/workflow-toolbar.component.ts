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
import {WorkflowStemConfig} from '../../../../../core/store/workflows/workflow';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../core/store/navigation/query/query';
import {QueryAttribute} from '../../../../../core/model/query-attribute';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {AttributesResource} from '../../../../../core/model/resource';
import {queryStemAttributesResourcesOrder} from '../../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';

@Component({
  selector: 'workflow-toolbar',
  templateUrl: './workflow-toolbar.component.html',
  styleUrls: ['./workflow-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowToolbarComponent implements OnChanges {
  @Input()
  public config: WorkflowStemConfig;

  @Input()
  public stem: QueryStem;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Output()
  public configChange = new EventEmitter<WorkflowStemConfig>();

  public attributesResourcesOrder: AttributesResource[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.stem || changes.collections || changes.linkTypes) {
      this.attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
    }
  }

  public onResourceSelected(resource: QueryAttribute) {
    this.onConfigChange({...this.config, resource});
  }

  public onAttributeSelected(selectId: SelectItemWithConstraintId) {
    const {attributeId, resourceIndex} = selectId;
    const resource = (this.attributesResourcesOrder || [])[resourceIndex];
    if (resource) {
      const resourceType = getAttributesResourceType(resource);
      const selection = {attributeId, resourceIndex, resourceType, resourceId: resource.id};

      this.onConfigChange({...this.config, attribute: selection});
    }
  }

  public onAttributeRemoved() {
    const configCopy = {...this.config};
    delete configCopy.attribute;
    this.onConfigChange(configCopy);
  }

  private onConfigChange(config: WorkflowStemConfig) {
    this.configChange.next(config);
  }
}

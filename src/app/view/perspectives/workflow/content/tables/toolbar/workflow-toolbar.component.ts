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
import {WorkflowFooterConfig, WorkflowStemConfig} from '../../../../../../core/store/workflows/workflow';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {
  QueryAttribute,
  queryAttributesAreSame,
  queryResourcesAreSame,
} from '../../../../../../core/model/query-attribute';
import {SelectItemWithConstraintId} from '../../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {AttributesResource, AttributesResourceType} from '../../../../../../core/model/resource';
import {queryStemAttributesResourcesOrder} from '../../../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../../../shared/utils/resource.utils';
import {SelectItem2Model} from '../../../../../../shared/select/select-item2/select-item2.model';
import {View} from '../../../../../../core/store/views/view';
import {AppState} from '../../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {ViewSettingsAction} from '../../../../../../core/store/view-settings/view-settings.action';
import {resourceAttributeSettings} from '../../../../../../shared/settings/settings.util';
import {Constraint} from '@lumeer/data-filters';
import {viewSettingsIdByView} from '../../../../../../core/store/view-settings/view-settings.util';
import {WorkflowsAction} from '../../../../../../core/store/workflows/workflows.action';
import {AttributeSortType, ViewSettings} from '../../../../../../core/store/view-settings/view-settings';

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

  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public currentView: View;

  @Input()
  public editable: boolean;

  @Input()
  public footerConfig: WorkflowFooterConfig;

  @Input()
  public workflowId: string;

  @Output()
  public configChange = new EventEmitter<WorkflowStemConfig>();

  public attributesResourcesOrder: AttributesResource[];
  public hasAttribute: boolean;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.stem || changes.collections || changes.linkTypes) {
      this.attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
      this.hasAttribute = this.attributesResourcesOrder.some(resource => resource.attributes.length);
    }
  }

  public onResourceSelected(items: [SelectItem2Model]) {
    const resource = items?.[0]?.id;
    if (!queryResourcesAreSame(resource, this.config?.collection)) {
      this.onConfigChange({...this.config, collection: resource});
    }
  }

  public onAttributeSelected(data: {id: SelectItemWithConstraintId; constraint?: Constraint}) {
    const {attributeId, resourceIndex} = data.id;
    const resource = (this.attributesResourcesOrder || [])[resourceIndex];
    if (resource) {
      const resourceType = getAttributesResourceType(resource);
      const selection: QueryAttribute = {
        attributeId,
        resourceIndex,
        resourceType,
        resourceId: resource.id,
        constraint: data.constraint,
      };

      const previousAttribute = {...this.config?.attribute};
      this.onConfigChange({...this.config, attribute: selection});
      this.setAttributeSort(resource, resourceType, attributeId, AttributeSortType.Ascending);
      if (previousAttribute && !queryAttributesAreSame(selection, previousAttribute)) {
        this.removeAttributeSort(previousAttribute.attributeId, previousAttribute.resourceIndex);
      }
    }
  }

  public onAttributeRemoved() {
    if (this.config.attribute) {
      const {attributeId, resourceIndex} = this.config.attribute;
      const configCopy = {...this.config};
      delete configCopy.attribute;
      this.onConfigChange(configCopy);
      this.removeAttributeSort(attributeId, resourceIndex);
    }
  }

  private removeAttributeSort(attributeId: string, resourceIndex: number) {
    const resource = (this.attributesResourcesOrder || [])[resourceIndex];
    const resourceType = getAttributesResourceType(resource);
    this.setAttributeSort(resource, resourceType, attributeId, undefined);
  }

  private setAttributeSort(
    resource: AttributesResource,
    resourceType: AttributesResourceType,
    attributeId: string,
    sort: AttributeSortType
  ) {
    const attributeSettings = resourceAttributeSettings(this.viewSettings, attributeId, resource?.id, resourceType);
    if ((!sort && attributeSettings?.sort) || (sort && !attributeSettings?.sort)) {
      this.store$.dispatch(
        new ViewSettingsAction.SetAttribute({
          settingsId: viewSettingsIdByView(this.currentView),
          attributeId,
          collection: resourceType === AttributesResourceType.Collection ? resource : undefined,
          linkType: resourceType === AttributesResourceType.LinkType ? <LinkType>resource : undefined,
          settings: {sort},
        })
      );
    }
  }

  private onConfigChange(config: WorkflowStemConfig) {
    this.configChange.next(config);
  }

  public onFooterToggle(checked: boolean) {
    this.store$.dispatch(
      new WorkflowsAction.SetFooterEnabled({
        workflowId: this.workflowId,
        stem: this.stem,
        enabled: checked,
      })
    );
  }
}

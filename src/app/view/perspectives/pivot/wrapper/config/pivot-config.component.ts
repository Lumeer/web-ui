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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {PivotAttribute, PivotColumnAttribute, PivotConfig, PivotRowAttribute, PivotValueAttribute} from '../../../../../core/store/pivots/pivot';
import {PivotData} from '../../util/pivot-data';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Query} from '../../../../../core/store/navigation/query';
import {pivotAttributesAreSame} from '../../util/pivot-util';
import {DataAggregationType} from '../../../../../shared/utils/data/data-aggregation';

@Component({
  selector: 'pivot-config',
  templateUrl: './pivot-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PivotConfigComponent {

  @Input()
  public config: PivotConfig;

  @Input()
  public pivotData: PivotData;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<PivotConfig>();

  public onRowAttributeSelect(attribute: PivotAttribute, previousAttribute?: PivotRowAttribute) {
    const rowAttribute = {...attribute, showSums: true};
    this.onAttributeChange(rowAttribute, previousAttribute, 'rowAttributes');
  }

  public onRowAttributeRemove(attribute: PivotRowAttribute) {
    this.onAttributeRemove(attribute, 'rowAttributes');
  }

  public onRowAttributeChange(attribute: PivotRowAttribute) {
    this.onAttributeChange(attribute, attribute, 'rowAttributes');
  }

  public onColumnAttributeSelect(attribute: PivotAttribute, previousAttribute?: PivotColumnAttribute) {
    const columnAttribute = {...attribute, showSums: true};
    this.onAttributeChange(columnAttribute, previousAttribute, 'columnAttributes');
  }

  public onColumnAttributeRemove(attribute: PivotColumnAttribute) {
    this.onAttributeRemove(attribute, 'columnAttributes');
  }

  public onColumnAttributeChange(attribute: PivotColumnAttribute) {
    this.onAttributeChange(attribute, attribute, 'columnAttributes');
  }

  public onValueAttributeSelect(attribute: PivotAttribute, previousAttribute?: PivotValueAttribute) {
    const valueAttribute = {...attribute, aggregation: DataAggregationType.Sum};
    this.onAttributeChange(valueAttribute, previousAttribute, 'valueAttributes');
  }

  public onValueAttributeRemove(attribute: PivotValueAttribute) {
    this.onAttributeRemove(attribute, 'valueAttributes');
  }

  public onValueAttributeChange(attribute: PivotValueAttribute) {
    this.onAttributeChange(attribute, attribute, 'valueAttributes');
  }

  private onAttributeChange(attribute: PivotAttribute, previousAttribute: PivotAttribute, parameterName: string) {
    const previousIndex = previousAttribute && (this.config[parameterName] || [])
      .findIndex(attr => pivotAttributesAreSame(attr, previousAttribute));

    const newAttributes = [...(this.config[parameterName] || [])];
    if (previousIndex >= 0) {
      newAttributes.splice(previousIndex, 1, attribute);
    } else {
      newAttributes.push(attribute);
    }

    this.configChange.emit({...this.config, [parameterName]: newAttributes});
  }

  private onAttributeRemove(attribute: PivotAttribute, parameterName: string) {
    const newAttributes = (this.config[parameterName] || [])
      .filter(attr => !pivotAttributesAreSame(attr, attribute));
    this.configChange.emit({...this.config, [parameterName]: newAttributes});
  }

  public trackByAttribute(index: number, attribute: PivotAttribute): string {
    return `${attribute.resourceIndex}:${attribute.resourceId}:${attribute.attributeId}`;
  }
}

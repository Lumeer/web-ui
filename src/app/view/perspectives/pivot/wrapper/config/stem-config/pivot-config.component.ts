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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {
  PivotAttribute,
  PivotColumnAttribute,
  PivotRowAttribute,
  PivotRowColumnAttribute,
  PivotStemConfig,
  PivotValueAttribute,
} from '../../../../../../core/store/pivots/pivot';
import {PivotStemData} from '../../../util/pivot-data';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {cleanPivotAttribute, pivotAttributesAreSame} from '../../../util/pivot-util';
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {deepObjectCopy, isNotNullOrUndefined} from '../../../../../../shared/utils/common.utils';
import {DataAggregationType} from '../../../../../../shared/utils/data/data-aggregation';
import {DRAG_DELAY} from '../../../../../../core/constants';

@Component({
  selector: 'pivot-config',
  templateUrl: './pivot-config.component.html',
  styleUrls: ['pivot-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotConfigComponent {
  @Input()
  public config: PivotStemConfig;

  @Input()
  public pivotData: PivotStemData;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public stem: QueryStem;

  @Output()
  public configChange = new EventEmitter<PivotStemConfig>();

  public readonly rowsListId = `${generateId()}:row`;
  public readonly columnsListId = `${generateId()}:column`;
  public readonly valuesListId = `${generateId()}:value`;
  public readonly dragDelay = DRAG_DELAY;

  public onRowAttributeSelect(attribute: PivotRowAttribute, previousAttribute?: PivotRowAttribute) {
    this.onAttributeChange(attribute, previousAttribute, 'rowAttributes');
  }

  public onRowAttributeRemove(index: number) {
    this.onAttributeRemove(index, 'rowAttributes');
  }

  public onRowAttributeChange(index: number, attribute: PivotRowAttribute) {
    this.onAttributeChange(attribute, attribute, 'rowAttributes', index);
  }

  public onColumnAttributeSelect(attribute: PivotColumnAttribute, previousAttribute?: PivotColumnAttribute) {
    this.onAttributeChange(attribute, previousAttribute, 'columnAttributes');
  }

  public onColumnAttributeRemove(index: number) {
    this.onAttributeRemove(index, 'columnAttributes');
  }

  public onColumnAttributeChange(index: number, attribute: PivotColumnAttribute) {
    this.onAttributeChange(attribute, attribute, 'columnAttributes', index);
  }

  public onValueAttributeSelect(attribute: PivotValueAttribute, previousAttribute?: PivotValueAttribute) {
    this.onAttributeChange(attribute, previousAttribute, 'valueAttributes');
  }

  public onValueAttributeRemove(index: number) {
    this.onAttributeRemove(index, 'valueAttributes');
  }

  public onValueAttributeChange(index: number, attribute: PivotValueAttribute) {
    this.onAttributeChange(attribute, attribute, 'valueAttributes', index);
  }

  private onAttributeChange(
    attribute: PivotAttribute,
    previousAttribute: PivotAttribute,
    parameterName: string,
    index?: number
  ) {
    const previousIndex = isNotNullOrUndefined(index)
      ? index
      : previousAttribute &&
        (this.config[parameterName] || []).findIndex(attr => pivotAttributesAreSame(attr, previousAttribute));

    const newAttributes = [...(this.config[parameterName] || [])];
    if (previousIndex >= 0) {
      newAttributes.splice(previousIndex, 1, attribute);
    } else {
      newAttributes.push(attribute);
    }

    this.configChange.emit({...this.config, [parameterName]: newAttributes});
  }

  private onAttributeRemove(index: number, parameterName: string) {
    const newAttributes = [...(this.config[parameterName] || [])];
    if (index >= 0) {
      newAttributes.splice(index, 1);
      this.configChange.emit({...this.config, [parameterName]: newAttributes});
    }
  }

  public trackByAttribute(index: number, attribute: PivotAttribute): string {
    return `${attribute.resourceIndex}:${attribute.resourceId}:${attribute.attributeId}`;
  }

  public rowsListPredicate(event: CdkDrag<PivotAttribute>) {
    if (event.dropContainer.id === this.rowsListId) {
      return true;
    }

    return !(this.config.rowAttributes || []).some(attribute => pivotAttributesAreSame(attribute, event.data));
  }

  public columnsListPredicate(event: CdkDrag<PivotAttribute>) {
    if (event.dropContainer.id === this.columnsListId) {
      return true;
    }

    return !(this.config.columnAttributes || []).some(attribute => pivotAttributesAreSame(attribute, event.data));
  }

  public onDrop(event: CdkDragDrop<PivotAttribute, PivotAttribute>) {
    if (event.previousContainer.id === event.container.id && event.previousIndex === event.currentIndex) {
      return;
    }

    const config = deepObjectCopy<PivotStemConfig>(this.config);
    const previousContainerArray = this.getConfigArrayByContainerId(event.previousContainer.id, config);
    const containerArray = this.getConfigArrayByContainerId(event.container.id, config);

    if (event.previousContainer.id === event.container.id) {
      moveItemInArray(previousContainerArray, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(previousContainerArray, containerArray, event.previousIndex, event.currentIndex);
      this.resetAttributeByDrag(event.previousContainer, event.container, containerArray, event.currentIndex);
    }

    this.configChange.emit(config);
  }

  private resetAttributeByDrag(
    previousContainer: CdkDropList<PivotAttribute>,
    container: CdkDropList<PivotAttribute>,
    containerArray: PivotAttribute[],
    currentIndex: number
  ) {
    const pivotAttribute = containerArray[currentIndex];
    const cleanedAttribute = cleanPivotAttribute(pivotAttribute);
    if (this.movedFromValuesOrHeaderToHeader(previousContainer, container)) {
      const asc = !!(<PivotRowColumnAttribute>cleanedAttribute).sort
        ? (<PivotRowColumnAttribute>cleanedAttribute).sort.asc
        : true;
      containerArray[currentIndex] = {
        ...cleanedAttribute,
        showSums: true,
        sort: {attribute: cleanedAttribute, asc},
      } as PivotRowColumnAttribute;
    } else if (this.movedFromHeaderToValues(previousContainer, container)) {
      containerArray[currentIndex] = {...cleanedAttribute, aggregation: DataAggregationType.Sum} as PivotValueAttribute;
    }
  }

  private movedFromValuesOrHeaderToHeader(
    previousContainer: CdkDropList<PivotAttribute>,
    container: CdkDropList<PivotAttribute>
  ): boolean {
    return previousContainer.id !== container.id && [this.rowsListId, this.columnsListId].includes(container.id);
  }

  private movedFromHeaderToValues(
    previousContainer: CdkDropList<PivotAttribute>,
    container: CdkDropList<PivotAttribute>
  ): boolean {
    return [this.rowsListId, this.columnsListId].includes(previousContainer.id) && container.id === this.valuesListId;
  }

  private getConfigArrayByContainerId(id: string, config: PivotStemConfig): PivotAttribute[] {
    if (id === this.rowsListId) {
      return config.rowAttributes;
    } else if (id === this.columnsListId) {
      return config.columnAttributes;
    }
    return config.valueAttributes;
  }
}

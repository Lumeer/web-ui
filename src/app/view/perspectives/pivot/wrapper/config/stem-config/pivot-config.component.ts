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
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {DataAggregationType, cleanQueryAttribute} from '@lumeer/data-filters';
import {
  LmrPivotAttribute,
  LmrPivotColumnAttribute,
  LmrPivotRowAttribute,
  LmrPivotRowColumnAttribute,
  LmrPivotStemConfig,
  LmrPivotStemData,
  LmrPivotValueAttribute,
  pivotAttributesAreSame,
} from '@lumeer/pivot';
import {deepObjectCopy, isNotNullOrUndefined} from '@lumeer/utils';

import {DRAG_DELAY} from '../../../../../../core/constants';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {generateId} from '../../../../../../shared/utils/resource.utils';

@Component({
  selector: 'pivot-config',
  templateUrl: './pivot-config.component.html',
  styleUrls: ['pivot-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotConfigComponent {
  @Input()
  public config: LmrPivotStemConfig;

  @Input()
  public pivotData: LmrPivotStemData;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public stem: QueryStem;

  @Output()
  public configChange = new EventEmitter<LmrPivotStemConfig>();

  public readonly rowsListId = `${generateId()}:row`;
  public readonly columnsListId = `${generateId()}:column`;
  public readonly valuesListId = `${generateId()}:value`;
  public readonly dragDelay = DRAG_DELAY;

  public onRowAttributeSelect(attribute: LmrPivotRowAttribute, previousAttribute?: LmrPivotRowAttribute) {
    this.onAttributeChange(attribute, previousAttribute, 'rowAttributes');
  }

  public onRowAttributeRemove(index: number) {
    this.onAttributeRemove(index, 'rowAttributes');
  }

  public onRowAttributeChange(index: number, attribute: LmrPivotRowAttribute) {
    this.onAttributeChange(attribute, attribute, 'rowAttributes', index);
  }

  public onColumnAttributeSelect(attribute: LmrPivotColumnAttribute, previousAttribute?: LmrPivotColumnAttribute) {
    this.onAttributeChange(attribute, previousAttribute, 'columnAttributes');
  }

  public onColumnAttributeRemove(index: number) {
    this.onAttributeRemove(index, 'columnAttributes');
  }

  public onColumnAttributeChange(index: number, attribute: LmrPivotColumnAttribute) {
    this.onAttributeChange(attribute, attribute, 'columnAttributes', index);
  }

  public onValueAttributeSelect(attribute: LmrPivotValueAttribute, previousAttribute?: LmrPivotValueAttribute) {
    this.onAttributeChange(attribute, previousAttribute, 'valueAttributes');
  }

  public onValueAttributeRemove(index: number) {
    this.onAttributeRemove(index, 'valueAttributes');
  }

  public onValueAttributeChange(index: number, attribute: LmrPivotValueAttribute) {
    this.onAttributeChange(attribute, attribute, 'valueAttributes', index);
  }

  private onAttributeChange(
    attribute: LmrPivotAttribute,
    previousAttribute: LmrPivotAttribute,
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

  public trackByAttribute(index: number, attribute: LmrPivotAttribute): string {
    return `${attribute.resourceIndex}:${attribute.resourceId}:${attribute.attributeId}`;
  }

  public rowsListPredicate(event: CdkDrag<LmrPivotAttribute>) {
    if (event.dropContainer.id === this.rowsListId) {
      return true;
    }

    return !(this.config.rowAttributes || []).some(attribute => pivotAttributesAreSame(attribute, event.data));
  }

  public columnsListPredicate(event: CdkDrag<LmrPivotAttribute>) {
    if (event.dropContainer.id === this.columnsListId) {
      return true;
    }

    return !(this.config.columnAttributes || []).some(attribute => pivotAttributesAreSame(attribute, event.data));
  }

  public onDrop(event: CdkDragDrop<LmrPivotAttribute, LmrPivotAttribute>) {
    if (event.previousContainer.id === event.container.id && event.previousIndex === event.currentIndex) {
      return;
    }

    const config = deepObjectCopy<LmrPivotStemConfig>(this.config);
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
    previousContainer: CdkDropList<LmrPivotAttribute>,
    container: CdkDropList<LmrPivotAttribute>,
    containerArray: LmrPivotAttribute[],
    currentIndex: number
  ) {
    const pivotAttribute = containerArray[currentIndex];
    const cleanedAttribute = cleanQueryAttribute(pivotAttribute);
    if (this.movedFromValuesOrHeaderToHeader(previousContainer, container)) {
      const asc = !!(<LmrPivotRowColumnAttribute>cleanedAttribute).sort
        ? (<LmrPivotRowColumnAttribute>cleanedAttribute).sort.asc
        : true;
      containerArray[currentIndex] = {
        ...cleanedAttribute,
        showSums: true,
        sort: {attribute: cleanedAttribute, asc},
      } as LmrPivotRowColumnAttribute;
    } else if (this.movedFromHeaderToValues(previousContainer, container)) {
      containerArray[currentIndex] = {
        ...cleanedAttribute,
        aggregation: DataAggregationType.Sum,
      } as LmrPivotValueAttribute;
    }
  }

  private movedFromValuesOrHeaderToHeader(
    previousContainer: CdkDropList<LmrPivotAttribute>,
    container: CdkDropList<LmrPivotAttribute>
  ): boolean {
    return previousContainer.id !== container.id && [this.rowsListId, this.columnsListId].includes(container.id);
  }

  private movedFromHeaderToValues(
    previousContainer: CdkDropList<LmrPivotAttribute>,
    container: CdkDropList<LmrPivotAttribute>
  ): boolean {
    return [this.rowsListId, this.columnsListId].includes(previousContainer.id) && container.id === this.valuesListId;
  }

  private getConfigArrayByContainerId(id: string, config: LmrPivotStemConfig): LmrPivotAttribute[] {
    if (id === this.rowsListId) {
      return config.rowAttributes;
    } else if (id === this.columnsListId) {
      return config.columnAttributes;
    }
    return config.valueAttributes;
  }
}

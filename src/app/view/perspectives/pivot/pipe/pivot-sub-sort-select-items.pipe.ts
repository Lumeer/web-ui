import {Pipe, PipeTransform} from '@angular/core';
import {PivotDataHeader} from '../util/pivot-data';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {PivotRowColumnAttribute} from '../../../../core/store/pivots/pivot';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';

@Pipe({
  name: 'pivotSubSortSelectItems',
})
export class PivotSubSortSelectItemsPipe implements PipeTransform {
  public transform(
    pivotAttribute: PivotRowColumnAttribute,
    otherSideHeaders: PivotDataHeader[],
    index: number,
    summaryTitle: string
  ): SelectItemModel[] {
    let pivotHeader: PivotDataHeader = null;
    let currentOtherSideHeaders = otherSideHeaders;

    const values = pivotAttribute.sort.list.values || [];
    for (let i = 0; i < index; i++) {
      const value = values[i];
      pivotHeader = value && (otherSideHeaders || []).find(header => header.title === value.title);
      if (!pivotHeader) {
        break;
      }

      currentOtherSideHeaders = pivotHeader.children || [];
    }

    const items: SelectItemModel[] = [];
    if (!this.isLastHeader(currentOtherSideHeaders)) {
      items.push({id: {title: summaryTitle, isSummary: true}, value: summaryTitle});
    }

    return [
      ...items,
      ...(currentOtherSideHeaders || []).map(header => ({id: {title: header.title}, value: header.title})),
    ];
  }

  private isLastHeader(otherSideHeaders: PivotDataHeader[]): boolean {
    if (otherSideHeaders && otherSideHeaders[0] && otherSideHeaders[0].children) {
      return otherSideHeaders[0].children[0] && isNotNullOrUndefined(otherSideHeaders[0].children[0].targetIndex);
    }
    return false;
  }
}

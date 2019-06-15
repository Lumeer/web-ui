import {Pipe, PipeTransform} from '@angular/core';
import {PivotRowColumnAttribute, PivotSortValue} from '../../../../core/store/pivots/pivot';
import {PivotData, PivotDataHeader} from '../util/pivot-data';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';

@Pipe({
  name: 'pivotSubSortValues',
})
export class PivotSubSortValuesPipe implements PipeTransform {
  public transform(pivotAttribute: PivotRowColumnAttribute, otherSideHeaders: PivotDataHeader[]): PivotSortValue[] {
    let index = -1;
    let currentOtherSideHeaders = otherSideHeaders;

    const values = pivotAttribute.sort.list.values || [];
    while (true) {
      const value = values[index + 1];
      if (value && value.isSummary) {
        return values.slice(0, index + 2);
      }

      const pivotHeader = value && (currentOtherSideHeaders || []).find(header => header.title === value.title);
      if (!pivotHeader) {
        break;
      }

      currentOtherSideHeaders = pivotHeader.children || [];
      index++;
    }

    const items = index >= 0 ? values.slice(0, index + 1) : [];
    if (!this.isLastHeader(otherSideHeaders)) {
      console.log(index, 'isLasHeader');
      return [...items, null];
    }
    console.log(index, 'not isLasHeader');
    return items;
  }

  private isLastHeader(otherSideHeaders: PivotDataHeader[]): boolean {
    if (otherSideHeaders && otherSideHeaders[0] && otherSideHeaders[0].children) {
      return otherSideHeaders[0].children[0] && isNotNullOrUndefined(otherSideHeaders[0].children[0].targetIndex);
    }
    return false;
  }
}

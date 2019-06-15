import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {
  PivotAttribute,
  PivotRowColumnAttribute,
  PivotSort,
  PivotSortList,
  PivotSortValue,
} from '../../../../../../../../core/store/pivots/pivot';
import {PivotData} from '../../../../../util/pivot-data';
import {cleanPivotAttribute} from '../../../../../util/pivot-util';
import {SelectItemModel} from '../../../../../../../../shared/select/select-item/select-item.model';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'pivot-attribute-sort',
  templateUrl: './pivot-attribute-sort.component.html',
  styleUrls: ['./pivot-attribute-sort.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotAttributeSortComponent {
  @Input()
  public pivotAttribute: PivotRowColumnAttribute;

  @Input()
  public attributeSelectItem: SelectItemModel;

  @Input()
  public pivotData: PivotData;

  @Input()
  public isRow: boolean;

  @Output()
  public attributeChange = new EventEmitter<PivotRowColumnAttribute>();

  public readonly summaryTitle: string;
  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  constructor(private i18n: I18n) {
    this.summaryTitle = i18n({id: 'perspective.pivot.config.summary', value: 'Summary'});
  }

  public onSortSelected(sort: PivotAttribute | string) {
    const currentSort = this.getCurrentSort();
    if (sort['attributeId']) {
      const newAttribute = {
        ...this.pivotAttribute,
        sort: {attribute: sort as PivotAttribute, value: null, asc: currentSort.asc},
      };
      this.attributeChange.emit(newAttribute);
    } else {
      const list: PivotSortList = {valueTitle: sort as string, values: [{title: this.summaryTitle, isSummary: true}]};
      const newAttribute = {...this.pivotAttribute, sort: {attribute: null, list, asc: currentSort.asc}};
      this.attributeChange.emit(newAttribute);
    }
  }

  public onSortToggle() {
    const currentSort: PivotSort = this.pivotAttribute.sort || {
      attribute: cleanPivotAttribute(this.pivotAttribute),
      asc: true,
    };
    const newAttribute = {...this.pivotAttribute, sort: {...currentSort, asc: !currentSort.asc}};
    this.attributeChange.emit(newAttribute);
  }

  private getCurrentSort(): PivotSort {
    return this.pivotAttribute.sort || {attribute: cleanPivotAttribute(this.pivotAttribute), asc: true};
  }

  public onSubSortSelected(index: number, value: PivotSortValue) {
    const list = this.pivotAttribute.sort.list;
    if (list) {
      const values = [...list.values];
      values[index] = {...value};
      this.changeSortValues(values);
    }
  }

  public onSubSortRemoved(index: number) {
    const list = this.pivotAttribute.sort.list;
    if (list) {
      const values = [...list.values].slice(index);
      this.changeSortValues(values);
    }
  }

  private changeSortValues(values: PivotSortValue[]) {
    const newAttribute = {
      ...this.pivotAttribute,
      sort: {...this.pivotAttribute.sort, list: {...this.pivotAttribute.sort.list, values}},
    };
    this.attributeChange.emit(newAttribute);
  }
}

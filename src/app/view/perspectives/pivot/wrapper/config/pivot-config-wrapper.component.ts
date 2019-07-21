import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {PivotConfig, PivotStemConfig} from '../../../../../core/store/pivots/pivot';
import {PivotData} from '../../util/pivot-data';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Query, QueryStem} from '../../../../../core/store/navigation/query';
import {deepObjectCopy} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'pivot-config-wrapper',
  templateUrl: './pivot-config-wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotConfigWrapperComponent {
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

  public onStemConfigChange(stemConfig: PivotStemConfig, index: number) {
    const config = deepObjectCopy<PivotConfig>(this.config);
    config.stemsConfigs[index] = stemConfig;
    if (config.mergeTables) {
      this.syncConnectedConfig(config, stemConfig, index);
    }
    this.configChange.emit(config);
  }

  public syncConnectedConfig(config: PivotConfig, newStemConfig: PivotStemConfig, index: number) {
    for (let i = 0; i < config.stemsConfigs.length; i++) {
      if (i === index) {
        continue;
      }
      const stemConfig = config.stemsConfigs[i];
      if (stemConfig.rowAttributes && newStemConfig.rowAttributes) {
        (newStemConfig.rowAttributes || []).forEach((attribute, index) => {
          if (stemConfig.rowAttributes[index]) {
            stemConfig.rowAttributes[index].showSums = attribute.showSums;
            stemConfig.rowAttributes[index].sort = attribute.sort;
          }
        });
      }
      if (stemConfig.columnAttributes && newStemConfig.columnAttributes) {
        (newStemConfig.columnAttributes || []).forEach((attribute, index) => {
          if (stemConfig.columnAttributes[index]) {
            stemConfig.columnAttributes[index].showSums = attribute.showSums;
            stemConfig.columnAttributes[index].sort = attribute.sort;
          }
        });
      }
    }
  }

  public onMergeTablesChange(checked: boolean) {
    // TODO
  }

  public trackByStem(index: number, stem: QueryStem): string {
    return stem.collectionId + index;
  }
}

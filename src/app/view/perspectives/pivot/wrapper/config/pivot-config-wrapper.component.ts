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

import {LmrPivotConfig, LmrPivotData, LmrPivotStemConfig} from '@lumeer/pivot';
import {deepObjectCopy} from '@lumeer/utils';

import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Query, QueryStem} from '../../../../../core/store/navigation/query/query';
import {createDefaultPivotStemConfig} from '../../util/pivot-util';

@Component({
  selector: 'pivot-config-wrapper',
  templateUrl: './pivot-config-wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotConfigWrapperComponent {
  @Input()
  public config: LmrPivotConfig;

  @Input()
  public pivotData: LmrPivotData;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<LmrPivotConfig>();

  public readonly defaultStemConfig = createDefaultPivotStemConfig();

  public onStemConfigChange(stemConfig: LmrPivotStemConfig, stem: QueryStem, index: number) {
    const config = deepObjectCopy<LmrPivotConfig>(this.config);
    config.stemsConfigs[index] = {...stemConfig, stem};
    this.configChange.emit(config);
  }

  public onMergeTablesChange(mergeTables: boolean) {
    this.configChange.emit({...this.config, mergeTables});
  }

  public trackByStem(index: number, stem: QueryStem): string {
    return stem.collectionId + index;
  }
}

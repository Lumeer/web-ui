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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {PivotDataConverter} from '../util/pivot-data-converter';
import {PivotConfig} from '../../../../core/store/pivots/pivot';
import {asyncScheduler, BehaviorSubject, Observable} from 'rxjs';
import {filter, map, throttleTime} from 'rxjs/operators';
import {PivotData} from '../util/pivot-data';
import {DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {checkOrTransformPivotConfig} from '../util/pivot-util';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../../../shared/utils/translation.utils';
import {PivotPerspectiveConfiguration} from '../../perspective-configuration';
import {View} from '../../../../core/store/views/view';

interface Data {
  collections: Collection[];
  linkTypes: LinkType[];
  data: DocumentsAndLinksData;
  query: Query;
  constraintData: ConstraintData;
  config: PivotConfig;
}

@Component({
  selector: 'pivot-perspective-wrapper',
  templateUrl: './pivot-perspective-wrapper.component.html',
  styleUrls: ['./pivot-perspective-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotPerspectiveWrapperComponent implements OnInit, OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public data: DocumentsAndLinksData;

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public pivotConfig: PivotConfig;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public sidebarOpened: boolean;

  @Input()
  public dataLoaded: boolean;

  @Input()
  public view: View;

  @Input()
  public perspectiveConfiguration: PivotPerspectiveConfiguration;

  @Output()
  public configChange = new EventEmitter<PivotConfig>();

  @Output()
  public sidebarToggle = new EventEmitter();

  private readonly pivotTransformer: PivotDataConverter;
  private dataSubject = new BehaviorSubject<Data>(null);

  public pivotData$: Observable<PivotData>;

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {
    this.pivotTransformer = new PivotDataConverter(constraintItemsFormatter, type =>
      this.createValueAggregationTitle(type)
    );
  }

  private createValueAggregationTitle(aggregation: DataAggregationType): string {
    return parseSelectTranslation(
      $localize`:@@perspective.pivot.data.aggregation:{aggregation, select, sum {Sum of} min {Min of} max {Max of} avg {Average of} count {Count of} unique {Unique of} median {Median of}}`,
      {aggregation}
    );
  }

  public ngOnInit() {
    const observable = this.dataSubject.pipe(filter(data => !!data));

    this.pivotData$ = observable.pipe(
      throttleTime(200, asyncScheduler, {trailing: true, leading: true}),
      map(data => this.handleData(data))
    );
  }

  private handleData(data: Data): PivotData {
    return this.pivotTransformer.transform(
      data.config,
      data.collections,
      data.linkTypes,
      data.data,
      data.query,
      data.constraintData
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.checkConfig(changes);
    this.checkData(changes);
  }

  private checkConfig(changes: SimpleChanges) {
    if (changes.config || changes.query || changes.collections || changes.linkTypes) {
      const previousConfig = {...this.pivotConfig};
      this.pivotConfig = checkOrTransformPivotConfig(this.pivotConfig, this.query, this.collections, this.linkTypes);
      if (!deepObjectsEquals(previousConfig, this.pivotConfig)) {
        this.configChange.emit(this.pivotConfig);
      }
    }
  }

  private checkData(changes: SimpleChanges) {
    if (
      changes.data ||
      changes.config ||
      changes.collections ||
      changes.linkTypes ||
      changes.query ||
      changes.constraintData
    ) {
      this.dataSubject.next({
        config: this.pivotConfig,
        collections: this.collections,
        linkTypes: this.linkTypes,
        data: this.data,
        query: this.query,
        constraintData: this.constraintData,
      });
    }
  }

  public onConfigChange(config: PivotConfig) {
    this.configChange.emit(config);
  }

  public onSidebarToggle() {
    this.sidebarToggle.emit();
  }
}

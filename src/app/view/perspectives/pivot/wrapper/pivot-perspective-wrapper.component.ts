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
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {PivotDataConverter} from '../util/pivot-data-converter';
import {PivotConfig} from '../../../../core/store/pivots/pivot';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {PivotData} from '../util/pivot-data';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {View} from '../../../../core/store/views/view';
import {checkOrTransformPivotConfig} from '../util/pivot-util';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  linkTypes: LinkType[];
  linkInstances: LinkInstance[];
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
  public documents: DocumentModel[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public config: PivotConfig;

  @Input()
  public currentView: View;

  @Input()
  public sidebarOpened: boolean;

  @Output()
  public configChange = new EventEmitter<PivotConfig>();

  @Output()
  public sidebarToggle = new EventEmitter();

  private readonly pivotTransformer: PivotDataConverter;
  private dataSubject = new BehaviorSubject<Data>(null);

  public pivotData$: Observable<PivotData>;

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter, private i18n: I18n) {
    this.pivotTransformer = new PivotDataConverter(constraintItemsFormatter, type =>
      this.createValueAggregationTitle(type)
    );
  }

  private createValueAggregationTitle(aggregation: DataAggregationType): string {
    return this.i18n(
      {
        id: 'perspective.pivot.data.aggregation',
        value: '{aggregation, select, sum {Sum of} min {Min of} max {Max of} avg {Average of} count {Count of}}',
      },
      {aggregation}
    );
  }

  public ngOnInit() {
    this.pivotData$ = this.dataSubject.pipe(
      filter(data => !!data),
      debounceTime(100),
      map(data => this.handleData(data))
    );
  }

  private handleData(data: Data): PivotData {
    const config = checkOrTransformPivotConfig(data.config, data.query, data.collections, data.linkTypes);
    if (!deepObjectsEquals(data.config, config)) {
      this.configChange.next(config);
    }

    return this.pivotTransformer.transform(
      config,
      data.collections,
      data.documents,
      data.linkTypes,
      data.linkInstances,
      data.query,
      data.constraintData
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.dataSubject.next({
      documents: this.documents,
      config: this.config,
      collections: this.collections,
      linkTypes: this.linkTypes,
      linkInstances: this.linkInstances,
      query: this.query,
      constraintData: this.constraintData,
    });
  }

  public onConfigChange(config: PivotConfig) {
    this.configChange.emit(config);
  }

  public onSidebarToggle() {
    this.sidebarToggle.emit();
  }
}

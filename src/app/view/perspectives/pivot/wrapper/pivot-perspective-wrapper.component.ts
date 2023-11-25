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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

import {ConstraintData, DataAggregationType, DocumentsAndLinksData} from '@lumeer/data-filters';
import {
  LmrPivotConfig,
  LmrPivotData,
  LmrPivotStrings,
  LmrPivotTableCell,
  LmrPivotTransform,
} from '@lumeer/lmr-pivot-table';
import {deepObjectsEquals} from '@lumeer/utils';

import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {View} from '../../../../core/store/views/view';
import {ModalService} from '../../../../shared/modal/modal.service';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {parseSelectTranslation} from '../../../../shared/utils/translation.utils';
import {PivotPerspectiveConfiguration} from '../../perspective-configuration';
import {checkOrTransformPivotConfig} from '../util/pivot-util';

@Component({
  selector: 'pivot-perspective-wrapper',
  templateUrl: './pivot-perspective-wrapper.component.html',
  styleUrls: ['./pivot-perspective-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotPerspectiveWrapperComponent implements OnChanges {
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
  public pivotConfig: LmrPivotConfig;

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
  public configChange = new EventEmitter<LmrPivotConfig>();

  @Output()
  public sidebarToggle = new EventEmitter();

  public pivotData$ = new BehaviorSubject<LmrPivotData>(null);

  public transform: LmrPivotTransform;
  public strings: LmrPivotStrings = {
    headerSummaryString: $localize`:@@perspective.pivot.table.summary.header:Summary of`,
    summaryString: $localize`:@@perspective.pivot.table.summary.total:Summary`,
  };

  constructor(
    private constraintItemsFormatter: SelectItemWithConstraintFormatter,
    private modalService: ModalService
  ) {
    this.transform = {
      checkValidConstraintOverride: (c1, c2) => this.constraintItemsFormatter.checkValidConstraintOverride(c1, c2),
      translateAggregation: type => this.createValueAggregationTitle(type),
    };
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.checkConfig(changes);
  }

  private createValueAggregationTitle(aggregation: DataAggregationType): string {
    return parseSelectTranslation(
      $localize`:@@perspective.pivot.data.aggregation:{aggregation, select, sum {Sum of} min {Min of} max {Max of} avg {Average of} count {Count of} unique {Unique of} median {Median of}}`,
      {aggregation}
    );
  }

  private checkConfig(changes: SimpleChanges) {
    if (changes.pivotConfig || changes.query || changes.collections || changes.linkTypes) {
      const previousConfig = {...this.pivotConfig};
      this.pivotConfig = checkOrTransformPivotConfig(this.pivotConfig, this.query, this.collections, this.linkTypes);
      if (!deepObjectsEquals(previousConfig, this.pivotConfig)) {
        this.configChange.emit(this.pivotConfig);
      }
    }
  }

  public onConfigChange(config: LmrPivotConfig) {
    this.configChange.emit(config);
  }

  public onSidebarToggle() {
    this.sidebarToggle.emit();
  }

  public onCellClick(cell: LmrPivotTableCell) {
    if (!cell.isHeader && cell.dataResources?.length > 0) {
      const modalTitle = $localize`:@@perspective.pivot.cell.detail.title:Records by value: <b>${cell.value}</b>`;
      this.modalService.showDataResourcesDetail(cell.dataResources, modalTitle, this.view?.id);
    }
  }
}

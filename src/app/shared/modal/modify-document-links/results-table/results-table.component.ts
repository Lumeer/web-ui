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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges, ViewChild,
} from '@angular/core';
import {ConstraintData} from '@lumeer/data-filters';
import {getOtherLinkedDocumentId, LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {objectsByIdMap, objectValues} from '../../../utils/common.utils';

export type ResultTableRow = { document: DocumentModel, linkInstance: LinkInstance };

@Component({
  selector: 'results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsTableComponent implements OnChanges {

  @Input()
  public mainDocumentId: string;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public selectRow = new EventEmitter<ResultTableRow>();

  @Output()
  public unselectRow = new EventEmitter<ResultTableRow>();

  @ViewChild(CdkVirtualScrollViewport, {static: true})
  public viewPort: CdkVirtualScrollViewport;

  public readonly configuration: DataInputConfiguration = {
    common: {inline: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
    action: {center: true},
  };

  public get inverseTranslation(): string {
    const offset = this.viewPort.getOffsetToRenderedContentStart();
    return `-${offset + 1}px`;
  }

  public rows: ResultTableRow[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents || changes.linkInstances) {
      this.rows = this.createRows();
    }
  }

  private createRows(): ResultTableRow[] {
    const rows = [];
    const documentsMap = objectsByIdMap(this.documents);
    for (const linkInstance of (this.linkInstances || [])) {
      const otherDocumentId = getOtherLinkedDocumentId(linkInstance, this.mainDocumentId);
      if (documentsMap[otherDocumentId]) {
        rows.push({linkInstance, document: documentsMap[otherDocumentId]});
      }

      delete documentsMap[otherDocumentId];
    }

    return [...rows, ...objectValues(documentsMap).map(document => ({document}))];
  }

  public toggleRow(row: ResultTableRow) {
    // TODO
  }

  public trackByAttribute(index: number, attribute: Attribute): string {
    return attribute.correlationId || attribute.id;
  }

  public trackByRow(index: number, row: ResultTableRow): string {
    return row.linkInstance?.id || row.document.id;
  }

  public onCheckedChange(checked: boolean, row: ResultTableRow) {
    if (checked) {
      this.selectRow.emit(row);
    } else {
      this.unselectRow.emit(row);
    }
  }
}

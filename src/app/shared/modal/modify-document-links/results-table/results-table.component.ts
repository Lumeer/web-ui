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
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {ConstraintData} from '@lumeer/data-filters';
import {getOtherLinkedDocumentId, LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {objectsByIdMap, objectValues} from '../../../utils/common.utils';
import {isResultRowChecked} from './pipes/is-result-row-checked.pipe';
import {ResourceAttributeSettings, View} from '../../../../core/store/views/view';
import {
  filterVisibleAttributesByResourceSettings,
  filterVisibleAttributesBySettings,
} from '../../../utils/attribute.utils';
import {sortDataObjectsByResourceAttributesSettings} from '../../../utils/data-resource.utils';

export type ResultTableRow = {document: DocumentModel; linkInstance?: LinkInstance};

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

  @Input()
  public view: View;

  @Input()
  public collectionAttributesSettings: ResourceAttributeSettings[];

  @Input()
  public linkTypesAttributesSettings: Record<string, ResourceAttributeSettings[]>;

  @Input()
  public removedLinkInstancesIds: string[];

  @Input()
  public selectedDocumentIds: string[];

  @Output()
  public selectRow = new EventEmitter<ResultTableRow>();

  @Output()
  public unselectRow = new EventEmitter<ResultTableRow>();

  @Output()
  public selectAll = new EventEmitter<{documentsIds: string[]; linkInstancesIds: string[]}>();

  @Output()
  public unselectAll = new EventEmitter<{documentsIds: string[]; linkInstancesIds: string[]}>();

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
  public isAllChecked: boolean;
  public collectionAttributes: Attribute[] = [];
  public linkTypeAttributes: Attribute[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    let sortRows = false;
    if (
      changes.collection ||
      changes.linkType ||
      changes.constraintData ||
      changes.collectionAttributesSettings ||
      changes.linkTypesAttributesSettings
    ) {
      sortRows = true;
    }
    if (changes.documents || changes.linkInstances || sortRows) {
      this.rows = this.createRows();
    }
    if (changes.documents || changes.linkInstances || changes.removedLinkInstancesIds || changes.selectedDocumentIds) {
      this.isAllChecked = this.rows.every(row =>
        isResultRowChecked(row, this.removedLinkInstancesIds, this.selectedDocumentIds)
      );
    }
    if (changes.collection || changes.collectionAttributesSettings) {
      this.collectionAttributes = filterVisibleAttributesByResourceSettings(
        this.collection,
        this.collectionAttributesSettings
      );
    }
    if (changes.linkType || changes.linkTypesAttributesSettings) {
      this.linkTypeAttributes = filterVisibleAttributesBySettings(this.linkType, this.linkTypesAttributesSettings);
    }
  }

  private createRows(): ResultTableRow[] {
    const rows = [];
    const documentsMap = objectsByIdMap(this.documents);
    for (const linkInstance of this.linkInstances || []) {
      const otherDocumentId = getOtherLinkedDocumentId(linkInstance, this.mainDocumentId);
      if (documentsMap[otherDocumentId]) {
        rows.push({linkInstance, document: documentsMap[otherDocumentId]});
      }

      if (!this.selectedDocumentIds?.includes(otherDocumentId)) {
        delete documentsMap[otherDocumentId];
      }
    }

    return [...this.sortRows(rows), ...this.sortRows(objectValues(documentsMap).map(document => ({document})))];
  }

  private sortRows(rows: ResultTableRow[]): ResultTableRow[] {
    return sortDataObjectsByResourceAttributesSettings(
      rows,
      this.collection,
      this.linkType,
      this.collectionAttributesSettings,
      this.linkTypesAttributesSettings?.[this.linkType?.id],
      this.constraintData
    );
  }

  public toggleRow(row: ResultTableRow) {
    if (row.linkInstance) {
      if (this.removedLinkInstancesIds?.includes(row.linkInstance.id)) {
        this.selectRow.emit(row);
      } else {
        this.unselectRow.emit(row);
      }
    } else {
      if (this.selectedDocumentIds?.includes(row.document.id)) {
        this.unselectRow.emit(row);
      } else {
        this.selectRow.emit(row);
      }
    }
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

  public onCheckedAllChange(checked: boolean) {
    if (checked) {
      const linkInstancesIds = this.rows.filter(row => !!row.linkInstance).map(row => row.linkInstance.id);
      const documentsIds = this.rows.filter(row => !row.linkInstance && !!row.document).map(row => row.document.id);
      this.selectAll.emit({documentsIds, linkInstancesIds});
    } else {
      const linkInstancesIds = this.linkInstances.map(linkInstance => linkInstance.id);
      this.unselectAll.emit({documentsIds: [], linkInstancesIds});
    }
  }
}

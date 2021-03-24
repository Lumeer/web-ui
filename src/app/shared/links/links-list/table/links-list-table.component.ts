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
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  EventEmitter,
  Output,
} from '@angular/core';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkColumn} from '../model/link-column';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../core/store/collections/collection.util';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {LinkRow} from '../model/link-row';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectLinkInstancesByTypeAndDocuments} from '../../../../core/store/link-instances/link-instances.state';
import {map, mergeMap, switchMap} from 'rxjs/operators';
import {
  getOtherLinkedDocumentId,
  getOtherLinkedDocumentIds,
  LinkInstance,
} from '../../../../core/store/link-instances/link.instance';
import {selectDocumentsByIds} from '../../../../core/store/documents/documents.state';
import {ModalService} from '../../../modal/modal.service';
import {Query} from '../../../../core/store/navigation/query/query';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {generateCorrelationId} from '../../../utils/resource.utils';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {ViewSettings} from '../../../../core/store/views/view';
import {createAttributesSettingsOrder} from '../../../settings/settings.util';
import {objectChanged, objectsByIdMap} from '../../../utils/common.utils';
import {ConstraintData} from '@lumeer/data-filters';

const columnWidth = 100;

@Component({
  selector: 'links-list-table',
  templateUrl: './links-list-table.component.html',
  styleUrls: ['./links-list-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableComponent implements OnChanges, AfterViewInit {
  @Input()
  public linkType: LinkType;

  @Input()
  public document: DocumentModel;

  @Input()
  public collection: Collection;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public ignoreSettingsOnReadPermission: boolean;

  @Input()
  public allowSelectDocument: boolean;

  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public visible: boolean;

  @ViewChild('tableWrapper')
  public tableWrapperComponent: ElementRef;

  @Output()
  public detail = new EventEmitter<{document: DocumentModel; collection: Collection}>();

  @Output()
  public unLink = new EventEmitter<LinkInstance>();

  public columns$ = new BehaviorSubject<LinkColumn[]>([]);

  public rows$: Observable<LinkRow[]>;
  public constraintData$: Observable<ConstraintData>;

  private stickyColumnWidth: number;

  constructor(private store$: Store<AppState>, private modalService: ModalService) {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      changes.document ||
      changes.linkType ||
      changes.collection ||
      changes.query ||
      changes.permissions ||
      changes.viewSettings ||
      changes.ignoreSettingsOnReadPermission
    ) {
      this.mergeColumns();
    }

    if (objectChanged(changes.linkType) || objectChanged(changes.document)) {
      this.rows$ = this.selectLinkRows$();
    }

    if (changes.visible) {
      setTimeout(() => this.computeStickyColumnWidth());
    }
  }

  private mergeColumns() {
    const linkTypeColumns = this.createLinkTypeColumns();
    const collectionColumns = this.createCollectionColumns();

    this.columns$.next([...linkTypeColumns, ...collectionColumns]);
    this.computeStickyColumnWidth();
  }

  private createLinkTypeColumns(): LinkColumn[] {
    const settings =
      this.ignoreSettingsOnReadPermission && this.permissions?.read
        ? []
        : this.viewSettings?.attributes?.linkTypes?.[this.linkType?.id];
    return createAttributesSettingsOrder(this.linkType?.attributes, settings)
      .filter(setting => !setting.hidden)
      .reduce((columns, setting) => {
        const attribute = findAttribute(this.linkType?.attributes, setting.attributeId);
        const editable = isLinkTypeAttributeEditable(attribute.id, this.linkType, this.permissions, this.query);
        const column: LinkColumn = (this.columns$.value || []).find(
          c => c.linkTypeId === this.linkType.id && c.attribute.id === attribute.id
        ) || {attribute, width: columnWidth, linkTypeId: this.linkType.id, editable};
        columns.push({...column, attribute, editable});
        return columns;
      }, []);
  }

  private createCollectionColumns(): LinkColumn[] {
    const defaultAttributeId = getDefaultAttributeId(this.collection);
    const settings =
      this.ignoreSettingsOnReadPermission && this.permissions?.read
        ? []
        : this.viewSettings?.attributes?.collections?.[this.collection?.id];
    return createAttributesSettingsOrder(this.collection?.attributes, settings)
      .filter(setting => !setting.hidden)
      .reduce((columns, setting) => {
        const attribute = findAttribute(this.collection?.attributes, setting.attributeId);
        const editable = isCollectionAttributeEditable(attribute.id, this.collection, this.permissions, this.query);
        const column: LinkColumn = (this.columns$.value || []).find(
          c => c.collectionId === this.collection.id && c.attribute.id === attribute.id
        ) || {
          attribute,
          width: columnWidth,
          collectionId: this.collection.id,
          color: this.collection.color,
          bold: attribute.id === defaultAttributeId,
          editable,
        };
        columns.push({...column, attribute, editable});
        return columns;
      }, []);
  }

  private selectLinkRows$(): Observable<LinkRow[]> {
    if (this.linkType && this.document) {
      return this.store$.pipe(
        select(selectLinkInstancesByTypeAndDocuments(this.linkType.id, [this.document.id])),
        switchMap(linkInstances => this.getLinkRowsForLinkInstances(linkInstances))
      );
    }

    return of([]);
  }

  private getLinkRowsForLinkInstances(linkInstances: LinkInstance[]): Observable<LinkRow[]> {
    const documentsIds = getOtherLinkedDocumentIds(linkInstances, this.document.id);
    return this.store$.pipe(
      select(selectDocumentsByIds(documentsIds)),
      map(documents => {
        const documentsMap = objectsByIdMap(documents);
        return linkInstances.reduce((rows, linkInstance) => {
          const otherDocumentId = getOtherLinkedDocumentId(linkInstance, this.document.id);
          const document = documentsMap[otherDocumentId];
          if (document) {
            rows.push({linkInstance, document, correlationId: linkInstance.correlationId});
          }
          return rows;
        }, []);
      })
    );
  }

  public onResizeColumn(data: {index: number; width: number}) {
    const columns = [...this.columns$.value];
    columns[data.index] = {...columns[data.index], width: data.width};
    this.columns$.next(columns);
    this.computeStickyColumnWidth();
  }

  public onAttributeType(column: LinkColumn) {
    this.modalService.showAttributeType(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public onAttributeFunction(column: LinkColumn) {
    this.modalService.showAttributeFunction(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public onColumnFocus(index: number) {
    if (this.tableWrapperComponent) {
      const element = this.tableWrapperComponent.nativeElement;
      const columnStart = this.columns$.value.reduce((val, column, ix) => val + (ix < index ? column.width : 0), 0);
      const columnEnd = columnStart + this.columns$.value[index].width;
      if (columnStart < element.scrollLeft) {
        element.scrollLeft = columnStart;
      } else if (columnEnd > element.scrollLeft + element.clientWidth - (this.stickyColumnWidth || 0)) {
        element.scrollLeft = columnEnd - element.clientWidth + (this.stickyColumnWidth || 0);
      }
    }
  }

  public ngAfterViewInit() {
    setTimeout(() => this.computeStickyColumnWidth());
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.computeStickyColumnWidth();
  }

  private computeStickyColumnWidth() {
    if (this.tableWrapperComponent) {
      const columnsWidth = this.columns$.value.reduce((val, col) => val + col.width, 0);
      const stickyWidth = this.tableWrapperComponent.nativeElement.clientWidth - columnsWidth;
      if (stickyWidth > 0) {
        this.tableWrapperComponent.nativeElement.style.removeProperty('--detail-links-sticky-width');
        this.stickyColumnWidth = null;
      } else {
        const defaultColumnWidth = 55;
        this.tableWrapperComponent.nativeElement.style.setProperty(
          '--detail-links-sticky-width',
          `${defaultColumnWidth}px`
        );
        this.stickyColumnWidth = defaultColumnWidth;
      }
    }
  }

  public onDetail(row: LinkRow) {
    row.document && this.detail.emit({document: row.document, collection: this.collection});
  }

  public onUnLink(row: LinkRow) {
    row.linkInstance && this.unLink.emit(row.linkInstance);
  }

  public onNewLink(object: {column: LinkColumn; value: any; correlationId: string}) {
    const {column, value, correlationId} = object;
    const data = {[column.attribute.id]: value};
    const documentData = column.collectionId ? data : {};
    const linkData = column.linkTypeId ? data : {};

    const document: DocumentModel = {
      collectionId: this.collection.id,
      correlationId: generateCorrelationId(),
      data: documentData,
    };
    this.store$.dispatch(
      new DocumentsAction.CreateWithLink({
        document,
        otherDocumentId: this.document.id,
        linkInstance: {
          correlationId,
          data: linkData,
          documentIds: [this.document.id, ''], // other will be set after document is created
          linkTypeId: this.linkType.id,
        },
      })
    );
  }

  public onAttributeDescription(column: LinkColumn) {
    this.modalService.showAttributeDescription(column.attribute.id, column.collectionId, column.linkTypeId);
  }
}

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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
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
import {Action, select, Store} from '@ngrx/store';
import {
  selectLinkInstanceById,
  selectLinkInstancesByTypeAndDocuments,
} from '../../../../core/store/link-instances/link-instances.state';
import {map, switchMap} from 'rxjs/operators';
import {
  getOtherLinkedDocumentId,
  getOtherLinkedDocumentIds,
  LinkInstance,
} from '../../../../core/store/link-instances/link.instance';
import {selectDocumentById, selectDocumentsByIds} from '../../../../core/store/documents/documents.state';
import {Query} from '../../../../core/store/navigation/query/query';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {generateCorrelationId} from '../../../utils/resource.utils';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {AttributesSettings} from '../../../../core/store/views/view';
import {
  composeViewSettingsLinkTypeCollectionId,
  createAndModifyAttributesSettings,
  createAttributesSettingsOrder,
  setAttributeToAttributeSettings,
} from '../../../settings/settings.util';
import {objectChanged, objectsByIdMap} from '../../../utils/common.utils';
import {ConstraintData} from '@lumeer/data-filters';
import {AttributesResourceType} from '../../../../core/model/resource';
import {User} from '../../../../core/store/users/user';
import {selectCurrentUserForWorkspace} from '../../../../core/store/users/users.state';

const columnWidth = 100;

@Component({
  selector: 'links-list-table',
  templateUrl: './links-list-table.component.html',
  styleUrls: ['./links-list-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input()
  public linkType: LinkType;

  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkInstance: LinkInstance;

  @Input()
  public query: Query;

  @Input()
  public collectionPermissions: AllowedPermissions;

  @Input()
  public linkTypePermissions: AllowedPermissions;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public allowSelect: boolean;

  @Input()
  public allowCreate: boolean;

  @Input()
  public allowUnlink: boolean;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public visible: boolean;

  @ViewChild('tableWrapper')
  public tableWrapperComponent: ElementRef;

  @Output()
  public detail = new EventEmitter<{document: DocumentModel; collection: Collection}>();

  @Output()
  public unLink = new EventEmitter<LinkInstance>();

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public patchLinkData = new EventEmitter<LinkInstance>();

  @Output()
  public createDocumentWithLink = new EventEmitter<{document: DocumentModel; linkInstance: LinkInstance}>();

  @Output()
  public updateLink = new EventEmitter<{linkInstance: LinkInstance; nextAction?: Action}>();

  @Output()
  public createLink = new EventEmitter<{linkInstance: LinkInstance}>();

  @Output()
  public attributesSettingsChanged = new EventEmitter<AttributesSettings>();

  @Output()
  public attributeFunction = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public attributeDescription = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  @Output()
  public attributeType = new EventEmitter<{collectionId: string; linkTypeId: string; attributeId: string}>();

  public columns$ = new BehaviorSubject<LinkColumn[]>([]);

  public rows$: Observable<LinkRow[]>;
  public constraintData$: Observable<ConstraintData>;
  public currentUser$: Observable<User>;

  private stickyColumnWidth: number;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.currentUser$ = this.store$.pipe(select(selectCurrentUserForWorkspace));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      changes.document ||
      changes.linkType ||
      changes.collection ||
      changes.query ||
      changes.permissions ||
      changes.attributesSettings ||
      changes.ignoreSettingsOnReadPermission
    ) {
      this.mergeColumns();
    }

    if (objectChanged(changes.linkType) || objectChanged(changes.document) || objectChanged(changes.linkInstance)) {
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
    const settings = this.attributesSettings?.linkTypes?.[this.linkType?.id];
    return createAttributesSettingsOrder(this.linkType?.attributes, settings)
      .filter(setting => !setting.hidden)
      .reduce((columns, setting) => {
        const attribute = findAttribute(this.linkType?.attributes, setting.attributeId);
        const editable = isLinkTypeAttributeEditable(attribute.id, this.linkType, this.linkTypePermissions, this.query);
        const width = setting.width || columnWidth;
        const column: LinkColumn = (this.columns$.value || []).find(
          c => c.linkTypeId === this.linkType.id && c.attribute.id === attribute.id
        ) || {attribute, width, linkTypeId: this.linkType.id, editable};
        columns.push({...column, attribute, editable, width});
        return columns;
      }, []);
  }

  private createCollectionColumns(): LinkColumn[] {
    const defaultAttributeId = getDefaultAttributeId(this.collection);
    const composedId = composeViewSettingsLinkTypeCollectionId(this.collection?.id, this.linkType?.id);
    const settings = this.attributesSettings?.linkTypesCollections?.[composedId];
    return createAttributesSettingsOrder(this.collection?.attributes, settings)
      .filter(setting => !setting.hidden)
      .reduce((columns, setting) => {
        const attribute = findAttribute(this.collection?.attributes, setting.attributeId);
        const editable = isCollectionAttributeEditable(
          attribute.id,
          this.collection,
          this.collectionPermissions,
          this.query
        );
        const width = setting.width || columnWidth;
        const column: LinkColumn = (this.columns$.value || []).find(
          c => c.collectionId === this.collection.id && c.attribute.id === attribute.id
        ) || {
          attribute,
          width,
          collectionId: this.collection.id,
          color: this.collection.color,
          bold: attribute.id === defaultAttributeId,
          editable,
        };
        columns.push({...column, attribute, editable, width});
        return columns;
      }, []);
  }

  private selectLinkRows$(): Observable<LinkRow[]> {
    if (this.linkType && this.document) {
      return this.store$.pipe(
        select(selectLinkInstancesByTypeAndDocuments(this.linkType.id, [this.document.id])),
        switchMap(linkInstances => this.getLinkRowsForLinkInstances(linkInstances))
      );
    } else if (this.linkInstance && this.document) {
      return this.store$.pipe(
        select(selectLinkInstanceById(this.linkInstance.id)),
        switchMap(linkInstance => {
          const otherDocumentId = getOtherLinkedDocumentId(linkInstance, this.document.id);
          return this.store$.pipe(
            select(selectDocumentById(otherDocumentId)),
            map(document => [{linkInstance: linkInstance, document}])
          );
        })
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
    const column = this.columns$.value[data.index];
    if (column.collectionId) {
      const attributesSettings = createAndModifyAttributesSettings(
        this.attributesSettings,
        this.collection,
        AttributesResourceType.Collection,
        array => {
          return setAttributeToAttributeSettings(column.attribute.id, array, {width: data.width});
        },
        this.linkType.id
      );
      this.attributesSettingsChanged.emit(attributesSettings);
    } else if (column.linkTypeId) {
      const attributesSettings = createAndModifyAttributesSettings(
        this.attributesSettings,
        this.linkType,
        AttributesResourceType.LinkType,
        array => {
          return setAttributeToAttributeSettings(column.attribute.id, array, {width: data.width});
        }
      );
      this.attributesSettingsChanged.emit(attributesSettings);
    }
  }

  public onAttributeType(column: LinkColumn) {
    this.attributeType.emit({
      collectionId: column.collectionId,
      linkTypeId: column.linkTypeId,
      attributeId: column.attribute.id,
    });
  }

  public onAttributeFunction(column: LinkColumn) {
    this.attributeFunction.emit({
      collectionId: column.collectionId,
      linkTypeId: column.linkTypeId,
      attributeId: column.attribute.id,
    });
  }

  public onAttributeDescription(column: LinkColumn) {
    this.attributeDescription.emit({
      collectionId: column.collectionId,
      linkTypeId: column.linkTypeId,
      attributeId: column.attribute.id,
    });
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
    const linkInstance: LinkInstance = {
      correlationId,
      data: linkData,
      documentIds: [this.document.id, ''], // other will be set after document is created
      linkTypeId: this.linkType.id,
    };
    this.createDocumentWithLink.emit({document, linkInstance});
  }
}

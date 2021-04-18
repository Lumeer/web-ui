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
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {DataInputConfiguration} from '../../data-input/data-input-configuration';
import {ConstraintData} from '@lumeer/data-filters';
import {AttributesSettings} from '../../../core/store/views/view';
import {createAttributesSettingsOrder} from '../../settings/settings.util';
import {objectsByIdMap} from '../../utils/common.utils';

const PAGE_SIZE = 100;

@Component({
  selector: 'preview-results-table',
  templateUrl: './preview-results-table.component.html',
  styleUrls: ['./preview-results-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsTableComponent implements OnChanges, AfterViewInit {
  @Input()
  public documents: DocumentModel[];

  @Input()
  public collection: Collection;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public selectedDocumentId: string;

  @Input()
  public loaded: boolean;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public resizeable = true;

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  @ViewChild('table', {static: true, read: ElementRef})
  public tableElement: ElementRef;

  @ViewChildren('tableRow')
  public rowsElements: QueryList<ElementRef>;

  public readonly configuration: DataInputConfiguration = {
    common: {inline: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
    action: {center: true},
  };

  public page = 0;
  public attributes: Attribute[];

  public readonly pageSize = PAGE_SIZE;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection || changes.attributesSettings) {
      this.attributes = this.createAttributes();
    }
    if (this.documents && this.selectedDocumentId) {
      this.countPageForDocument(this.selectedDocumentId);
      setTimeout(() => this.scrollToCurrentRow());
    }
  }

  private createAttributes(): Attribute[] {
    const settings = this.attributesSettings?.collections?.[this.collection?.id];
    const attributesMap = objectsByIdMap(this.collection?.attributes);
    return createAttributesSettingsOrder(this.collection?.attributes, settings)
      .filter(setting => !setting.hidden)
      .map(setting => attributesMap[setting.attributeId])
      .filter(attribute => !!attribute);
  }

  public activate(document: DocumentModel) {
    this.selectDocument.emit(document);
    this.countPageForDocument(document.id);
  }

  private countPageForDocument(documentId: string) {
    const index = this.documents.findIndex(doc => doc.id === documentId);
    if (index !== -1) {
      this.countPage(index);
    }
  }

  private countPage(index: number) {
    this.page = Math.floor(index / PAGE_SIZE);
  }

  public selectPage(page: number) {
    this.page = page;
  }

  public trackByAttribute(index: number, attribute: Attribute): string {
    return attribute.correlationId || attribute.id;
  }

  public trackByDocument(index: number, document: DocumentModel): string {
    return document.correlationId || document.id;
  }

  public ngAfterViewInit() {
    this.scrollToCurrentRow();
  }

  private scrollToCurrentRow() {
    if (this.selectedDocumentId && this.rowsElements && this.tableElement) {
      const id = `preview-result-row-${this.selectedDocumentId}`;
      const index = this.rowsElements.toArray().findIndex(elem => elem.nativeElement.id === id);
      if (index > 0) {
        const rowElement = this.rowsElements.toArray()[index - 1]; // because of sticky header
        if (
          rowElement.nativeElement.offsetTop >
          this.tableElement.nativeElement.scrollTop + this.tableElement.nativeElement.clientHeight
        ) {
          this.tableElement.nativeElement.scrollTop = rowElement.nativeElement.offsetTop;
        } else if (rowElement.nativeElement.offsetTop < this.tableElement.nativeElement.scrollTop) {
          this.tableElement.nativeElement.scrollTop = rowElement.nativeElement.offsetTop;
        }
      }
    }
  }
}

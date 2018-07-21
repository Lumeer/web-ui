/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AttributeModel, CollectionModel} from '../../../core/store/collections/collection.model';

const PAGE_SIZE = 100;

@Component({
  selector: 'preview-results-table',
  templateUrl: './preview-results-table.component.html',
  styleUrls: ['./preview-results-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewResultsTableComponent implements OnInit {

  @Input()
  public documents: DocumentModel[];

  @Input()
  public collection: CollectionModel;

  @Input()
  public activeIndex = 0;

  public page = 0;

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  @Output('activate')
  public activateEvent = new EventEmitter<number>();

  public readonly pageSize = PAGE_SIZE;

  public ngOnInit() {
    this.countPage();
  }

  public activate(index: number) {
    this.activeIndex = index;
    this.countPage();
    this.selectDocument.emit(this.documents[this.activeIndex]);
    this.activateEvent.emit(this.activeIndex);
  }

  private countPage(): void {
    this.page = Math.floor(this.activeIndex / PAGE_SIZE);
  }

  public selectPage(page: number) {
    this.page = page;
  }

  public trackByAttribute(index: number, attribute: AttributeModel): string {
    return attribute.correlationId || attribute.id;
  }

  public trackByDocument(index: number, document: DocumentModel): string {
    return document.correlationId || document.id;
  }

}

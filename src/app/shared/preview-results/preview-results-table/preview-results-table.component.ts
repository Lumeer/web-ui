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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DocumentModel} from "../../../core/store/documents/document.model";
import {CollectionModel} from "../../../core/store/collections/collection.model";

@Component({
  selector: 'preview-results-table',
  templateUrl: './preview-results-table.component.html',
  styleUrls: ['./preview-results-table.component.scss']
})
export class PreviewResultsTableComponent implements OnInit {

  @Input()
  public documents: DocumentModel[];

  @Input()
  public collection: CollectionModel;

  @Input()
  public activeIndex = 0;

  @Output()
  public selectedDocument = new EventEmitter<DocumentModel>();

  constructor() { }

  public ngOnInit() {
  }

  public activate(index: number) {
    this.activeIndex = index;
    this.selectedDocument.emit(this.documents[this.activeIndex]);
  }
}

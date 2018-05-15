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

import {Component, Input, OnInit} from '@angular/core';
import {PerspectiveComponent} from "../perspective.component";
import {ViewConfigModel} from "../../../core/store/views/view.model";
import {DocumentModel} from "../../../core/store/documents/document.model";
import {QueryModel} from "../../../core/store/navigation/query.model";
import {CollectionModel} from "../../../core/store/collections/collection.model";

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss']
})
export class DetailPerspectiveComponent implements PerspectiveComponent, OnInit {

  @Input()
  public linkedDocument: DocumentModel;

  @Input()
  public query: QueryModel;

  @Input()
  public config: ViewConfigModel = {};

  @Input()
  public embedded: boolean;

  @Input()
  public path: number[] = [];

  public selectedCollection: CollectionModel;

  public selectedDocument: DocumentModel;

  constructor() { }

  ngOnInit() {
  }

  public selectCollection(collection: CollectionModel) {
    this.selectedCollection = collection;
  }

  public selectDocument(document: DocumentModel) {
    this.selectedDocument = document;
  }

}

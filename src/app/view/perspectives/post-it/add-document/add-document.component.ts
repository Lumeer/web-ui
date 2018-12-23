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

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CorrelationIdGenerator} from '../../../../core/store/correlation-id.generator';
import {generateDocumentData} from '../../../../core/store/documents/document.utils';
import {Query} from '../../../../core/store/navigation/query';
import {getQueryFiltersForCollection} from '../../../../core/store/navigation/query.util';

@Component({
  selector: 'add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss'],
})
export class PostItAddDocumentComponent {
  @Input()
  public disabled: boolean;

  @Input()
  public query: Query;

  @Input()
  public collection: Collection;

  @Output()
  public createPostIt = new EventEmitter<DocumentModel>();

  public onClick(): void {
    this.createPostIt.emit({
      collectionId: this.collection.id,
      correlationId: CorrelationIdGenerator.generate(),
      data: generateDocumentData(this.collection, getQueryFiltersForCollection(this.query, this.collection.id)),
    });
  }
}

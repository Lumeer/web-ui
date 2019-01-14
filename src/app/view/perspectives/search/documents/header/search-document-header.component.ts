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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {searchDocumentDefaultAttributeHtml} from '../search-document-html-helper';
import {SizeType} from '../../../../../shared/slider/size-type';
import {ResourceType} from '../../../../../core/model/resource-type';

@Component({
  selector: 'search-document-header',
  templateUrl: './search-document-header.component.html',
  styleUrls: ['./search-document-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDocumentHeaderComponent {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public isOpened: boolean;

  @Input()
  public size: SizeType;

  @Output()
  public toggle = new EventEmitter();

  @Output()
  public detail = new EventEmitter();

  public readonly collectionType = ResourceType.Collection;
  public readonly sSize = SizeType.S;

  public onToggleDocument() {
    this.toggle.emit();
  }

  public onDetail() {
    this.detail.emit();
  }

  public createDefaultAttributeHtml(): string {
    return searchDocumentDefaultAttributeHtml(this.document, this.collection);
  }
}

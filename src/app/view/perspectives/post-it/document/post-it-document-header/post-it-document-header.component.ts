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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';

import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';

@Component({
  selector: 'post-it-document-header',
  templateUrl: './post-it-document-header.component.html',
  styleUrls: ['./post-it-document-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItDocumentHeaderComponent {
  @Input() public collection: Collection;

  @Input() public initialized: boolean;

  @Input() public favorite: boolean;

  @Input() public readonly: boolean;

  @Input() public directRead: boolean;

  @Output() public remove = new EventEmitter();

  @Output() public edit = new EventEmitter();

  @Output() public toggleFavorite = new EventEmitter();

  public onRemove() {
    this.remove.emit();
  }

  public onEdit() {
    this.edit.emit();
  }

  public onToggleFavorite() {
    this.toggleFavorite.emit();
  }
}

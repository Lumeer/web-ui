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

import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';

import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {SelectionHelper} from '../../util/selection-helper';

@Component({
  selector: 'post-it-document-new-cell',
  templateUrl: './post-it-document-new-cell.component.html',
  styleUrls: ['./post-it-document-new-cell.component.scss']
})
export class PostItDocumentNewCellComponent {

  @Input() public perspectiveId: string;
  @Input() public suggestionListId: string;
  @Input() public model: string;
  @Input() public index: number;
  @Input() public row: number;
  @Input() public selectionHelper: SelectionHelper;

  @Output() public focus = new EventEmitter();
  @Output() public blur = new EventEmitter();
  @Output() public enter = new EventEmitter();

  public onFocus(){
    this.focus.emit();
  }

  public onEnter() {
    this.enter.emit();
  }

  public onBlur() {
    // TODO check state
    this.blur.emit();
  }


}

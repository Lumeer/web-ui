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

import {SelectionHelper} from '../../util/selection-helper';

@Component({
  selector: 'post-it-document-cell',
  templateUrl: './post-it-document-cell.component.html',
  styleUrls: ['./post-it-document-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostItDocumentCellComponent {

  @Input() public perspectiveId: string;
  @Input() public suggestionListId: string;
  @Input() public additionalClasses: string;
  @Input() public model: string;
  @Input() public key: string;
  @Input() public index: number;
  @Input() public row: number;
  @Input() public column: number;
  @Input() public selectionHelper: SelectionHelper;
  @Input() public readonly: boolean;

  @Output() public focus = new EventEmitter();
  @Output() public update = new EventEmitter<string>();
  @Output() public enter = new EventEmitter();
  @Output() public remove = new EventEmitter();

  public onFocus() {
    this.focus.emit();
  }

  public onRemove() {
    this.remove.emit();
  }

  public onEnter() {
    this.enter.emit();
  }

  public onBlur() {
    this.model = this.model.trim();
    this.update.emit(this.model);
  }

}

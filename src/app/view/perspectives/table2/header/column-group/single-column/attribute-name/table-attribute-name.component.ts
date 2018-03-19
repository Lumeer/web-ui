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

import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {HtmlModifier} from '../../../../../../../shared/utils/html-modifier';

@Component({
  selector: 'table-attribute-name',
  templateUrl: './table-attribute-name.component.html',
  styleUrls: ['./table-attribute-name.component.scss']
})
export class TableAttributeNameComponent implements OnChanges {

  @Input()
  public name: string;

  @Input()
  public readonly: boolean;

  @Input()
  public selected: boolean;

  @Output()
  public blur = new EventEmitter();

  @Output()
  public nameChange = new EventEmitter<string>();

  @Output()
  public keyDown = new EventEmitter<KeyboardEvent>();

  @ViewChild('attributeNameInput')
  public attributeNameInput: ElementRef;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('selected') && this.selected) {
      this.attributeNameInput.nativeElement.focus();
    }
    if (changes.hasOwnProperty('readonly') && !this.readonly) {
      this.attributeNameInput.nativeElement.focus();
      HtmlModifier.setCursorAtTextContentEnd(this.attributeNameInput.nativeElement);
    }
  }

  public onBlur() {
    this.blur.emit();
  }

  public onInput(event) {
    const name = event.target.innerText;
    this.nameChange.emit(name);
  }

  public onKeyDown(event: KeyboardEvent) {
    this.keyDown.emit(event);
  }

}

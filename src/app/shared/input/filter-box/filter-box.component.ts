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

import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange} from '@angular/core';

const DEFAULT_PLACEHOLDER = 'Filter';

@Component({
  selector: 'filter-box',
  templateUrl: './filter-box.component.html',
  styleUrls: ['./filter-box.component.scss'],
})
export class FilterBoxComponent implements OnInit, OnChanges {
  @Input() public value: string;

  @Input() public placeholder: string;

  @Output() public textChange: EventEmitter<string> = new EventEmitter();

  @Output() public textSubmit: EventEmitter<string> = new EventEmitter();

  public mPlaceholder: string;
  public mCurrentValue: string;

  public ngOnInit() {
    this.computeProperties();
  }

  public ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    this.computeProperties();
  }

  private computeProperties() {
    this.mPlaceholder = this.placeholder || DEFAULT_PLACEHOLDER;
    this.mCurrentValue = this.value;
  }

  public onTextSubmit(value: string) {
    this.textSubmit.emit(value);
  }

  public onTextChange(value: string) {
    this.mCurrentValue = value;
    this.textChange.emit(value);
  }
}

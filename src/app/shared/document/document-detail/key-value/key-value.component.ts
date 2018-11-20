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
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'key-value',
  templateUrl: './key-value.component.html',
  styleUrls: ['./key-value.component.scss'],
})
export class KeyValueComponent {
  @Input()
  public key: string;

  @Input()
  public value: string;

  @Output()
  public keyChange = new EventEmitter<string>();

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public change = new EventEmitter<string[]>();

  @Output()
  public remove = new EventEmitter();

  @Input()
  public readOnly = false;

  @Input()
  public defaultAttribute = false;

  @Input()
  public warning: string = '';

  constructor(public i18n: I18n) {}

  public onNewKey($event: string) {
    this.key = $event;
    this.keyChange.emit($event);
    this.change.emit([$event, this.value]);
  }

  public onNewRowValue($event: string) {
    this.value = $event;
    this.valueChange.emit($event);
    this.change.emit([this.key, $event]);
  }

  public invokeRemove() {
    this.remove.emit();
  }
}

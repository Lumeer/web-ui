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

import {Component, ChangeDetectionStrategy, EventEmitter, Output, Input} from '@angular/core';
import * as Icons from './icons';
import {BehaviorSubject} from 'rxjs';
import {generateId} from '../../../utils/resource.utils';
import {IconIdPipe} from './icon-id.pipe';

@Component({
  selector: 'icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPickerComponent {
  @Input()
  public icon: string;

  @Output()
  public selected = new EventEmitter<string>();

  @Output()
  public preview = new EventEmitter<string>();

  public readonly icons = Icons.solid.concat(Icons.brand);
  public readonly iconPickerId = generateId();

  public text$ = new BehaviorSubject<string>('');

  constructor(private iconIdPipe: IconIdPipe) {}

  public scrollToSelection(): void {
    setTimeout(() => {
      const elem = (document as any).getElementById(this.iconIdPipe.transform(this.icon, this.iconPickerId));

      if (elem) {
        elem.parentElement.parentElement.scrollTop = elem.offsetTop - elem.parentElement.offsetTop;
      }
    });
  }

  public onInput(value: string) {
    this.text$.next(value);
  }

  public onSelect(icon: string) {
    this.selected.emit(icon);
  }

  public onPreview(icon: string) {
    this.preview.emit(icon);
  }
}

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

import {Directive, HostBinding, HostListener, Input} from '@angular/core';
import {DragService} from './drag.service';
import {DraggableOptions} from './draggable-options';

@Directive({
  selector: '[lmrDraggable]',
})
export class DraggableDirective {
  private _options: DraggableOptions = {};

  constructor(private dragService: DragService) {}

  @HostBinding('draggable')
  get draggable(): boolean {
    return this._options.enabled;
  }

  @Input('lmrDraggable')
  set options(options: DraggableOptions) {
    if (options) {
      this._options = options;
    }
  }

  @HostListener('dragstart', ['$event'])
  public onDragStart(event) {
    const {zone = 'zone', data = {}} = this._options;

    this.dragService.startDrag(zone);

    event.dataTransfer.setData('Text', JSON.stringify(data));
  }
}

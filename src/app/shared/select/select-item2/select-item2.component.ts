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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges, ViewChild,
} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {SelectItem2Model} from './select-item2.model';
import {preventEvent} from '../../utils/common.utils';

@Component({
  selector: 'select-item2',
  templateUrl: './select-item2.component.html',
  styleUrls: ['./select-item2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItem2Component implements OnChanges {
  @Input()
  public items: SelectItem2Model[];

  @Input()
  public selectedId: any;

  @Input()
  public emptyValue: string = '';

  @Input()
  public disabled: boolean;

  @Input()
  public removable: boolean;

  @Output()
  public select = new EventEmitter<any>();

  @Output()
  public remove = new EventEmitter();

  @ViewChild(MatMenuTrigger)
  public contextMenu: MatMenuTrigger;

  public ngOnChanges(changes: SimpleChanges): void {
  }

  public onSelect(event: MouseEvent, item: SelectItem2Model) {
    preventEvent(event);
    this.contextMenu.closeMenu();
    this.select.emit(item.id);
  }

  public onRemove(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.remove.emit();
  }

}

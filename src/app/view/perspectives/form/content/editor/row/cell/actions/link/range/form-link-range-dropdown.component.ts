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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

import {DropdownDirective} from '../../../../../../../../../../shared/dropdown/dropdown.directive';

@Component({
  selector: 'form-link-range-dropdown',
  templateUrl: './form-link-range-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLinkRangeDropdownComponent extends DropdownDirective implements OnChanges {
  @Input()
  public minLinks: number;

  @Input()
  public maxLinks: number;

  @Output()
  public minLinksChange = new EventEmitter<number>();

  @Output()
  public maxLinksChange = new EventEmitter<number>();

  public minLinksValue: number;
  public maxLinksValue: number;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.minLinks) {
      this.minLinksValue = this.minLinks;
    }
    if (changes.maxLinks) {
      this.maxLinksValue = this.maxLinks;
    }
  }

  public onMinValueBlur() {
    this.minLinksChange.emit(this.minLinksValue);
  }

  public onMaxValueBlur() {
    this.maxLinksChange.emit(this.maxLinksValue);
  }

  public onClose() {
    if (this.minLinks !== this.minLinksValue) {
      this.minLinksChange.emit(this.minLinksValue);
    }
    if (this.maxLinks !== this.maxLinksValue) {
      this.maxLinksChange.emit(this.maxLinksValue);
    }
  }
}

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
import {Highlightable} from '@angular/cdk/a11y';
import {ChangeDetectorRef, Directive, HostBinding, Input} from '@angular/core';

@Directive({
  selector: '[dropdownOption]',
})
export class DropdownOptionDirective implements Highlightable {
  @Input()
  public activeClass = 'active';

  @Input()
  public disabled: boolean;

  @Input()
  public value: any;

  @HostBinding('class.active')
  public active: boolean;

  constructor(private changeDetector: ChangeDetectorRef) {}

  public getLabel(): string {
    return this.value;
  }

  public setActiveStyles() {
    this.active = true;
    this.changeDetector.markForCheck();
  }

  public setInactiveStyles() {
    this.active = false;
    this.changeDetector.markForCheck();
  }
}

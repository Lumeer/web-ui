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

import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'link-name-input',
  templateUrl: './link-name-input.component.html',
})
export class LinkNameInputComponent implements OnChanges {
  @Input()
  public colors: string[];

  @Input()
  public icons: string[];

  @Input()
  public formGroup: FormGroup;

  @Input()
  public focused: boolean;

  @ViewChild('linkName')
  public linkName: ElementRef;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('focused') && this.focused) {
      this.linkName.nativeElement.focus();
    }
  }

  public get linkNameInput(): AbstractControl {
    return this.formGroup.get('linkName');
  }
}

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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {formatLinkValue, LinkDataValue} from '../../../core/model/data-value/link.data-value';

@Component({
  selector: 'link-data-input',
  templateUrl: './link-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkDataInputComponent implements OnChanges {

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: LinkDataValue;

  @Output()
  public valueChange = new EventEmitter<LinkDataValue>();

  @Output()
  public save = new EventEmitter<LinkDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  public linkValue: string;
  public titleValue: string;

  constructor() {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value && this.value) {
      this.linkValue = this.value.linkValue;
      this.titleValue = this.value.titleValue;
    }
  }

  public onCancel() {
    this.cancel.emit();
  }

  public onSave(data: { link: string; title: string }) {
    const formattedValue = formatLinkValue(data.link, data.title);
    const newValue = this.value.parseInput(formattedValue);
    this.save.next(newValue);
  }
}

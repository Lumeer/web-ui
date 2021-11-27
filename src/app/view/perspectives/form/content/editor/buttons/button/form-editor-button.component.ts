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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {FormButtonConfig} from '../../../../../../../core/store/form/form-model';

@Component({
  selector: 'form-editor-button',
  templateUrl: './form-editor-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorButtonComponent implements OnChanges {
  @Input()
  public buttonLabel: string;

  @Input()
  public button: FormButtonConfig;

  @Output()
  public buttonChange = new EventEmitter<FormButtonConfig>();

  public color: string;
  public icon: string;
  public title: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.button) {
      this.title = this.button?.title;
      this.icon = this.button?.icon;
      this.color = this.button?.color;
    }
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.icon = data.icon;
    this.color = data.color;
  }

  public onIconColorSave(data: {icon: string; color: string}) {
    this.buttonChange.emit({
      ...this.button,
      icon: data.icon,
      color: data.color,
    });
  }

  public onBlur() {
    this.buttonChange.emit({
      ...this.button,
      title: this.title,
    });
  }

  public revertTitle() {
    this.title = this.button?.title;
  }
}

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
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {TextConstraintConfig} from '../../../core/model/data/constraint-config';
import {HtmlModifier} from '../../utils/html-modifier';
import {KeyCode} from '../../key-code';
import {transformTextBasedOnCaseStyle} from '../../utils/string.utils';
import {formatTextDataValue, isTextValid} from '../../utils/data.utils';

@Component({
  selector: 'text-data-input',
  templateUrl: './text-data-input.component.html',
  styleUrls: ['./text-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDataInputComponent implements OnChanges {
  @Input()
  public constraintConfig: TextConstraintConfig;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<any>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public dataBlur = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  public valid = true;
  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        const input = this.textInput;
        HtmlModifier.setCursorAtTextContentEnd(input.nativeElement);
        input.nativeElement.focus();
      });
    }

    this.refreshValid(this.value);
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const value = this.transformValue(element.value);
    this.refreshValid(element.value);

    this.valueChange.emit(value);
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.saveValue(this.textInput);
    }
    this.dataBlur.emit();
  }

  private refreshValid(value: any) {
    this.valid = isTextValid(value, this.constraintConfig);
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        // needs to be executed after parent event handlers
        const input = this.textInput;
        this.preventSave = true;
        setTimeout(() => input && this.saveValue(input));
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.textInput.nativeElement.value = formatTextDataValue(this.value);
        this.cancel.emit();
        return;
    }
  }

  private saveValue(input: ElementRef) {
    const value = this.transformValue(input.nativeElement.value);
    this.save.emit(value);
  }

  private transformValue(value: string) {
    const caseStyle = this.constraintConfig && this.constraintConfig.caseStyle;
    return transformTextBasedOnCaseStyle(value, caseStyle);
  }
}

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
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import {DurationConstraintConfig} from '../../../core/model/data/constraint-config';
import {HtmlModifier} from '../../utils/html-modifier';
import {KeyCode} from '../../key-code';
import {
  formatDurationDataValue,
  getDurationSaveValue,
  isDurationDataValueValid,
} from '../../utils/constraint/duration-constraint.utils';
import {TranslationService} from '../../../core/service/translation.service';
import {DurationUnitsMap} from '../../../core/model/data/constraint';
import {isNumeric} from '../../utils/common.utils';

@Component({
  selector: 'duration-data-input',
  templateUrl: './duration-data-input.component.html',
  styleUrls: ['./duration-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DurationDataInputComponent implements OnChanges {
  @Input()
  public constraintConfig: DurationConstraintConfig;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Input()
  public skipValidation: boolean;

  @Output()
  public valueChange = new EventEmitter<number | string>();

  @Output()
  public save = new EventEmitter<number | string>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  @ViewChild('durationInput', {static: false})
  public durationInput: ElementRef<HTMLInputElement>;

  public readonly durationUnitsMap: DurationUnitsMap;

  public valid = true;

  private preventSave: boolean;

  constructor(private translationService: TranslationService) {
    this.durationUnitsMap = translationService.createDurationUnitsMap();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        this.initValue();
        HtmlModifier.setCursorAtTextContentEnd(this.durationInput.nativeElement);
        this.durationInput.nativeElement.focus();
      });
    }
    if (changes.value) {
      this.initValue();
    }
    this.valid = isDurationDataValueValid(this.value, this.durationUnitsMap);
  }

  private initValue() {
    const input = this.durationInput;
    setTimeout(() => {
      if (input && input.nativeElement) {
        if (!input.nativeElement.value && isNumeric(this.value)) {
          input.nativeElement.value = String(this.value);
        } else {
          input.nativeElement.value = formatDurationDataValue(this.value, this.constraintConfig, this.durationUnitsMap);
        }
      }
    });
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.durationInput;

        if (
          !this.skipValidation &&
          input &&
          !isDurationDataValueValid(input.nativeElement.value, this.durationUnitsMap)
        ) {
          event.stopImmediatePropagation();
          event.preventDefault();
          return;
        }

        this.preventSave = true;
        // needs to be executed after parent event handlers
        setTimeout(() => input && this.save.emit(this.transformValue(input.nativeElement.value)));
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.durationInput.nativeElement.value = this.value || '';
        this.cancel.emit();
        return;
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const value = this.transformValue(element.value);
    this.valid = isDurationDataValueValid(element.value, this.durationUnitsMap);

    this.valueChange.emit(value);
  }

  public onBlur() {
    if (this.preventSave) {
      this.cancel.emit();
      this.preventSave = false;
    } else {
      this.save.emit(this.transformValue(this.durationInput.nativeElement.value));
    }
  }

  private transformValue(value: any): number | string {
    return getDurationSaveValue(value, this.constraintConfig, this.durationUnitsMap);
  }
}

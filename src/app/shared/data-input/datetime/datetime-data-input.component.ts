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
  AfterViewChecked,
  AfterViewInit,
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

import {ConstraintType, DateTimeDataValue} from '@lumeer/data-filters';
import {isDateValid, isNotNullOrUndefined} from '@lumeer/utils';

import {ConfigurationService} from '../../../configuration/configuration.service';
import {LanguageCode} from '../../../core/model/language';
import {DateTimeOptions, createDateTimeOptions} from '../../date-time/date-time-options';
import {DateTimePickerComponent} from '../../date-time/picker/date-time-picker.component';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {checkDataInputElementValue, isElementActive, setCursorAtDataInputEnd} from '../../utils/html-modifier';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';

@Component({
  selector: 'datetime-data-input',
  templateUrl: './datetime-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeDataInputComponent implements OnChanges, AfterViewInit, AfterViewChecked {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: DateTimeDataValue;

  @Input()
  public fontColor: string;

  @Output()
  public valueChange = new EventEmitter<DateTimeDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: DateTimeDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('dateTimeInput', {static: true})
  public dateTimeInput: ElementRef<HTMLInputElement>;

  @ViewChild(DateTimePickerComponent)
  public dateTimePicker: DateTimePickerComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.DateTime);

  public date: Date;
  public options: DateTimeOptions;

  private preventSave: boolean;
  private pendingUpdate: Date;
  private keyDownListener: (event: KeyboardEvent) => void;
  private setFocus: boolean;

  constructor(
    public element: ElementRef,
    private configurationService: ConfigurationService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      this.setFocus = true;
      this.preventSave = false;
    }
    if (this.changedFromEditableToReadonly(changes)) {
      this.removeKeyDownListener();
      if (isNotNullOrUndefined(this.pendingUpdate)) {
        this.onSave(this.pendingUpdate);
      }
    }
    if (changes.readonly && this.readonly) {
      this.preventSaveAndBlur();
    }
    if (changes.focus && !this.focus) {
      this.dateTimePicker?.close();
    }
    if (changes.value && this.value) {
      this.date = this.value.toDate?.();
      this.options = createDateTimeOptions(this.value.config?.format);
      if (this.readonly) {
        checkDataInputElementValue(this.dateTimeInput?.nativeElement, this.value);
      }
    }
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.dateTimePicker?.open();
      this.setFocus = false;
    }
  }

  public setFocusToInput() {
    if (this.dateTimeInput) {
      setCursorAtDataInputEnd(this.dateTimeInput.nativeElement, this.value);
    }
  }

  private addKeyDownListener() {
    this.removeKeyDownListener();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);
  }

  private removeKeyDownListener() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;
  }

  @HostListener('document:mousedown', ['$event'])
  public onMouseMove(event: MouseEvent) {
    this.preventSave = this.dateTimePicker?.clickedInside(event);
  }

  private changedFromEditableToReadonly(changes: SimpleChanges): boolean {
    return (
      changes.readonly &&
      isNotNullOrUndefined(changes.readonly.previousValue) &&
      !changes.readonly.previousValue &&
      this.readonly
    );
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.dateTimeInput;
        const dataValue = this.value.parseInput(input.nativeElement.value);
        this.pendingUpdate = null;

        event.preventDefault();

        if (!this.commonConfiguration?.skipValidation && input.nativeElement.value && !dataValue.isValid()) {
          event.stopImmediatePropagation();
          this.enterInvalid.emit();
          return;
        }

        this.preventSaveAndBlur();
        this.saveDataValue(dataValue, event);
        return;
      case KeyCode.Escape:
        this.onCancel();
        return;
    }
  }

  private saveDataValue(dataValue: DateTimeDataValue, event: KeyboardEvent) {
    const action = keyboardEventInputSaveAction(event);
    if (this.commonConfiguration?.delaySaveAction) {
      // needs to be executed after parent event handlers
      setTimeout(() => this.save.emit({action, dataValue}));
    } else {
      this.save.emit({action, dataValue});
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);
    this.pendingUpdate = dataValue.toDate();
    this.valueChange.emit(dataValue);
  }

  public onSave(date: Date) {
    if (date && !isDateValid(date)) {
      this.onCancel();
      return;
    }

    this.onSaveDataValue(this.value.copy(date));
  }

  private onSaveDataValue(dataValue: DateTimeDataValue) {
    this.pendingUpdate = null;
    this.value = dataValue;
    this.save.emit({action: DataInputSaveAction.Button, dataValue});
  }

  public onSaveOnClose(inputValue: string, selectedDate: Date) {
    const inputDataValue = this.value.parseInput(inputValue || '');
    if (!inputValue || isDateValid(inputDataValue.toDate())) {
      this.onSaveDataValue(inputDataValue);
    } else {
      this.onSave(selectedDate);
    }
  }

  public onCancel() {
    this.pendingUpdate = null;
    this.cancel.emit();
  }

  public ngAfterViewInit() {
    document.body.style.setProperty('--first-day-of-week', this.firstDayOfWeek());
  }

  private firstDayOfWeek(): string {
    const locale = this.configurationService.getConfiguration().locale;
    switch (locale) {
      case LanguageCode.EN:
        return '2';
      default:
        return '8';
    }
  }

  public onValueChange(date: Date) {
    this.preventSave = true;
    this.pendingUpdate = date;
    const dataValue = this.value.copy(date);
    this.dateTimeInput.nativeElement.value = dataValue.format();
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    this.removeKeyDownListener();

    if (this.preventSave) {
      this.preventSave = false;
    } else {
      const dataValue = this.value.parseInput(this.dateTimeInput.nativeElement.value);
      if (this.commonConfiguration?.skipValidation || dataValue.isValid()) {
        this.emitSaveIfChanged(dataValue, DataInputSaveAction.Blur);
      } else {
        this.cancel.emit();
      }
    }
  }

  private emitSaveIfChanged(dataValue: DateTimeDataValue, action: DataInputSaveAction) {}

  private preventSaveAndBlur() {
    if (isElementActive(this.dateTimeInput?.nativeElement)) {
      this.preventSave = true;
      this.dateTimeInput.nativeElement.blur();
      this.dateTimePicker?.close();
      this.removeKeyDownListener();
    }
  }

  public onFocus() {
    this.addKeyDownListener();
  }
}

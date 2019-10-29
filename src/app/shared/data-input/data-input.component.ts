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
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import {Constraint} from '../../core/model/constraint';
import {DataValue} from '../../core/model/data-value';
import {UnknownDataValue} from '../../core/model/data-value/unknown.data-value';
import {ConstraintData, ConstraintType} from '../../core/model/data/constraint';
import {generateCorrelationId} from '../utils/resource.utils';
import {DataCursor} from './data-cursor';
import {USER_AVATAR_SIZE} from './user/user-data-input.component';
import {DataSuggestion} from './data-suggestion';

@Component({
  selector: 'data-input',
  templateUrl: './data-input.component.html',
  styleUrls: ['./data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataInputComponent implements OnChanges, OnDestroy {
  @Input()
  public constraint: Constraint;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public cursor: DataCursor;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Input()
  public skipValidation = false;

  @Input()
  public resizeToContent = false;

  @Input()
  public placeholder: string;

  @Input()
  public suggestions: DataSuggestion[];

  @Output()
  public valueChange = new EventEmitter<any>();

  @Output()
  public save = new EventEmitter<any>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public dataBlur = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  public dataValue: DataValue;

  private tempElement: HTMLElement;
  public readonly constraintType = ConstraintType;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value || changes.constraint || changes.constraintData) {
      this.dataValue = this.createDataValue();
      if (this.resizeToContent) {
        this.recalculateWidth(this.dataValue);
      }
    }
  }

  private createDataValue(): DataValue {
    return this.constraint
      ? this.constraint.createDataValue(this.value, this.constraintData)
      : new UnknownDataValue(this.value);
  }

  private recalculateWidth(value: DataValue, raw?: boolean) {
    const width = this.getWidthOfInput(value, raw);
    this.renderer.setStyle(this.elementRef.nativeElement, 'width', `${width}px`);
  }

  private getWidthOfInput(value: DataValue, raw?: boolean): number {
    if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
      return 34;
    }

    if (!this.tempElement) {
      this.tempElement = this.createTempElement();
      document.body.appendChild(this.tempElement);
    } else {
      this.tempElement.classList.remove('d-none');
    }

    this.tempElement.innerHTML = raw ? String(value.value) : value.format();
    const textWidth = this.tempElement.getBoundingClientRect().width;

    this.tempElement.classList.add('d-none');

    if (this.constraint && this.constraint.type === ConstraintType.User) {
      return textWidth + (value.isValid() ? USER_AVATAR_SIZE : 0);
    }

    return textWidth;
  }

  private createTempElement(): HTMLElement {
    const tmp = document.createElement('span');
    tmp.classList.add('px-2', 'invisible', 'white-space-pre');
    tmp.id = generateCorrelationId();
    return tmp;
  }

  public ngOnDestroy() {
    if (this.tempElement) {
      document.body.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }

  public onSaveValue(dataValue: DataValue) {
    if (this.resizeToContent) {
      this.recalculateWidth(dataValue);
    }
    this.save.emit(dataValue.serialize());
  }

  public onValueChange(dataValue: DataValue) {
    if (this.resizeToContent) {
      this.recalculateWidth(dataValue, true);
    }
    this.valueChange.emit(String(dataValue.value));
  }

  public onCancel() {
    if (this.resizeToContent) {
      this.recalculateWidth(this.dataValue);
    }
    this.cancel.emit();
  }

  public emitFocus($event: any) {
    this.onFocus.emit($event);
  }

  public onDataBlur() {
    this.dataBlur.emit();
  }
}

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
import {Constraint, ConstraintData, ConstraintType} from '../../core/model/data/constraint';
import {checkValidUser, formatDataValue} from '../utils/data.utils';
import {generateCorrelationId} from '../utils/resource.utils';
import {USER_AVATAR_SIZE} from './user/user-data-input.component';

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
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Input()
  public skipValidation = false;

  @Input()
  public resizeToContent = false;

  @Output()
  public valueChange = new EventEmitter<any>();

  @Output()
  public save = new EventEmitter<any>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  private tempElement: HTMLElement;
  public readonly constraintType = ConstraintType;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value && this.resizeToContent) {
      this.recalculateWidth(this.value);
    }
  }

  private recalculateWidth(value: any) {
    const width = this.getWidthOfInput(value);
    this.renderer.setStyle(this.elementRef.nativeElement, 'width', `${width}px`);
  }

  private getWidthOfInput(value: any): number {
    if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
      return 34;
    }

    if (!this.tempElement) {
      this.tempElement = this.createTempElement();
      document.body.appendChild(this.tempElement);
    }

    this.tempElement.innerHTML = formatDataValue(value, this.constraint, this.constraintData);
    const textWidth = this.tempElement.getBoundingClientRect().width;

    if (this.constraint && this.constraint.type === ConstraintType.User) {
      return (
        textWidth + (checkValidUser(value, this.constraintData && this.constraintData.users) ? USER_AVATAR_SIZE : 0)
      );
    }

    return textWidth;
  }

  private createTempElement(): HTMLElement {
    const tmp = document.createElement('span');
    tmp.className = 'px-2 tmp-invisible';
    tmp.id = generateCorrelationId();
    return tmp;
  }

  public ngOnDestroy() {
    if (this.tempElement) {
      document.body.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }

  public onSaveValue(value: any) {
    if (this.resizeToContent) {
      this.recalculateWidth(value);
    }
    this.save.emit(value);
  }

  public onValueChange(value: any) {
    if (this.resizeToContent) {
      this.recalculateWidth(value);
    }
    this.valueChange.emit(value);
  }

  public onCancel() {
    if (this.resizeToContent) {
      this.recalculateWidth(this.value);
    }
    this.cancel.emit();
  }

  public emitFocus($event: any) {
    this.onFocus.emit($event);
  }
}

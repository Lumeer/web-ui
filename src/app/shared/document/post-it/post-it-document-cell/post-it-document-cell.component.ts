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
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {BehaviorSubject, Subscription} from 'rxjs';
import {DataCursor} from '../../../data-input/data-cursor';
import {SelectionHelper} from '../util/selection-helper';
import {KeyCode} from '../../../key-code';
import {Constraint, ConstraintType, DurationUnitsMap} from '../../../../core/model/data/constraint';
import {formatDataValue} from '../../../utils/data.utils';
import {TranslationService} from '../../../../core/service/translation.service';
import {select, Store} from '@ngrx/store';
import {selectAllUsers} from '../../../../core/store/users/users.state';
import {AppState} from '../../../../core/store/app.state';
import {first} from 'rxjs/operators';
import {User} from '../../../../core/store/users/user';

@Component({
  selector: 'post-it-document-cell',
  templateUrl: './post-it-document-cell.component.html',
  styleUrls: ['./post-it-document-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItDocumentCellComponent implements OnChanges, OnInit, OnDestroy {
  @Input() public perspectiveId: string;
  @Input() public suggestionListId: string;
  @Input() public additionalClasses: string;
  @Input() public model: any;
  @Input() public key: string;
  @Input() public index: number;
  @Input() public row: number;
  @Input() public column: number;
  @Input() public selectionHelper: SelectionHelper;
  @Input() public readonly: boolean;

  @Input()
  public constraint: Constraint;

  @Input()
  public dataCursor: DataCursor;

  @Output() public focus = new EventEmitter();
  @Output() public update = new EventEmitter<string>();
  @Output() public enter = new EventEmitter();
  @Output() public remove = new EventEmitter();

  public focusInput: boolean;

  @HostBinding('id') public id: string;
  @HostBinding('attr.tabindex') public tabindex: number;
  @HostBinding('title') public title: string;

  public constraintTypeBoolean = ConstraintType.Boolean;

  public editing$ = new BehaviorSubject(false);

  private readonly durationUnitsMap: DurationUnitsMap;
  private users: User[];
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private translationService: TranslationService) {
    this.durationUnitsMap = translationService.createDurationUnitsMap();
  }

  @HostListener('focus', ['$event'])
  public hostFocus(event: FocusEvent) {
    if (event) {
      this.focus.emit();
    }
  }

  @HostListener('keydown', ['$event'])
  public keydown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowRight:
        this.selectionHelper.moveRight();
        break;
      case KeyCode.ArrowLeft:
        this.selectionHelper.moveLeft();
        break;
      case KeyCode.ArrowDown:
        this.selectionHelper.moveDown();
        break;
      case KeyCode.ArrowUp:
        this.selectionHelper.moveUp();
        break;
      case KeyCode.Space:
        if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
          this.update.emit(String(!this.model));
          event.preventDefault();
        }
        break;
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        /* tslint:disable:no-switch-case-fall-through */
        if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
          this.update.emit(String(!this.model));
          break;
        }
      case KeyCode.F2:
        /* tslint:enable:no-switch-case-fall-through */
        if (!this.constraint || this.constraint.type !== ConstraintType.Boolean) {
          this.editing$.next(true);
          this.selectionHelper.focusToggle(true);
          this.focusInput = true;
        }
        break;
      case KeyCode.Backspace:
      case KeyCode.Delete:
        this.onRemove();
        break;
    }
  }

  public onDblClick() {
    if (!this.constraint || this.constraint.type !== ConstraintType.Boolean) {
      this.editing$.next(true);
      this.selectionHelper.focusToggle(true);
      this.focusInput = true;
    }
  }

  public ngOnInit(): void {
    this.subscriptions.add(this.store$.pipe(select(selectAllUsers)).subscribe(users => (this.users = users)));
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.id = `${this.perspectiveId}#${this.key}#${this.column}#${this.row}`;
    this.tabindex = this.index * 1000 + this.row * 2 + this.column;
    if (this.constraint) {
      this.title = formatDataValue(this.model, this.constraint, {
        users: this.users,
        durationUnitsMap: this.durationUnitsMap,
      });
    } else {
      this.title = this.model;
    }
  }

  public onRemove() {
    if (!this.readonly) {
      this.remove.emit();
    }
  }

  public onEnter() {
    this.editing$.next(true);
    this.enter.emit();
  }

  public onBlur() {
    this.editing$.next(false);

    if (!this.readonly) {
      if (typeof this.model === 'string') {
        this.model = this.model.trim();
      }
      this.update.emit(this.model);
    }
  }

  public onSave(value: any) {
    this.editing$.next(false);
    this.update.emit(value);
    this.focusInput = false;
  }

  public onCancel() {
    this.editing$.next(false);
    this.focusInput = false;
    this.selectionHelper.focusToggle(false);
  }
}

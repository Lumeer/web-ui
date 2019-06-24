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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {TypeaheadMatch} from 'ngx-bootstrap';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {UserConstraintConfig} from '../../../core/model/data/constraint-config';
import {User} from '../../../core/store/users/user';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {KeyCode} from '../../key-code';
import {formatUserDataValue} from '../../utils/data.utils';
import {HtmlModifier} from '../../utils/html-modifier';

export const USER_AVATAR_SIZE = 22;

@Component({
  selector: 'user-data-input',
  templateUrl: './user-data-input.component.html',
  styleUrls: ['./user-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDataInputComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  @Input()
  public constraintConfig: UserConstraintConfig;

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
  public onFocus = new EventEmitter<any>();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  public readonly avatarSize = USER_AVATAR_SIZE;

  public users$: Observable<User[]>;
  private email$ = new BehaviorSubject('');

  public name: string;

  private preventSave: boolean;
  private setFocus: boolean;
  private triggerInput: boolean;

  private subscriptions = new Subscription();

  constructor(private store$: Store<{}>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.setFocus = true;
    }
    if (changes.value) {
      this.email$.next(this.value);

      if (this.value && String(this.value).length === 1) {
        this.triggerInput = true; // show suggestions when typing the first letter in readonly mode
      }
    }
  }

  public ngOnInit() {
    this.users$ = this.bindUsers();
    this.subscriptions.add(this.subscribeToUserName());
  }

  private bindUsers(): Observable<User[]> {
    return this.store$.pipe(
      select(selectAllUsers),
      map(users => users.map(user => (user.name ? user : {...user, name: user.email})))
    );
  }

  private subscribeToUserName(): Subscription {
    return combineLatest(this.users$, this.email$).subscribe(
      ([users, email]) => (this.name = formatUserDataValue(email, this.constraintConfig, users))
    );
  }

  public ngAfterViewChecked(): void {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
    if (this.triggerInput) {
      this.dispatchInputEvent();
      this.triggerInput = false;
    }
  }

  private setFocusToInput() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
    }
  }

  private dispatchInputEvent() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      setTimeout(() => element.dispatchEvent(event));
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.saveValue();
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        this.preventSave = true;
        // needs to be executed after parent event handlers
        setTimeout(() => this.saveValue());
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.users$.pipe(take(1)).subscribe(users => {
          this.resetSearchInput(users);
          this.cancel.emit();
        });
        return;
    }
  }

  private saveValue() {
    this.users$.pipe(take(1)).subscribe(users => {
      const user = users.find(u => u.name === this.name);
      if (user || !this.name) {
        this.save.emit(user ? user.email : '');
      } else if (this.skipValidation) {
        this.save.emit(this.name);
      } else {
        this.resetSearchInput(users);
      }
    });
  }

  private resetSearchInput(users: User[]) {
    this.name = formatUserDataValue(this.value, this.constraintConfig, users);
  }

  public onSelect(event: TypeaheadMatch) {
    this.preventSave = true;
    this.save.emit(event.item.email);
  }

  public onInputChange() {
    this.valueChange.emit(this.name);
  }
}

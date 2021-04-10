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

import {Component, OnInit, ChangeDetectionStrategy, Input, HostListener} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup} from '@angular/forms';
import {BehaviorSubject, Observable} from 'rxjs';
import {DialogType} from '../../dialog-type';
import {View} from '../../../../core/store/views/view';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {KeyCode} from '../../../key-code';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {notEmptyValidator} from '../../../../core/validators/custom-validators';
import {selectAllViews, selectViewById} from '../../../../core/store/views/views.state';
import {map, take, tap} from 'rxjs/operators';

@Component({
  templateUrl: './view-settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSettingsModalComponent implements OnInit {
  @Input()
  public view: View;

  public performingAction$ = new BehaviorSubject(false);

  public view$: Observable<View>;
  public views$: Observable<View[]>;

  public readonly dialogType = DialogType;

  public form: FormGroup;

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {}

  public ngOnInit() {
    this.view$ = this.store$.pipe(
      select(selectViewById(this.view.id)),
      tap(view => (this.view = view))
    );
    this.views$ = this.store$.pipe(
      select(selectAllViews),
      map(views => views.filter(view => view.id !== this.view.id))
    );

    this.form = this.fb.group({
      name: [this.view.name, notEmptyValidator(), this.uniqueName()],
      folders: this.fb.array(this.view.folders || []),
    });
  }

  public uniqueName(): AsyncValidatorFn {
    return (control: AbstractControl) =>
      this.store$.pipe(
        select(selectAllViews),
        map(views => {
          const names = views.filter(view => view.id !== this.view.id).map(view => view.name);
          const value = control.value.trim();

          if (names.includes(value)) {
            return {notUnique: true};
          } else {
            return null;
          }
        }),
        take(1)
      );
  }

  public onDeleteView() {
    const message = $localize`:@@views.delete.message:Do you really want to permanently delete this view?`;
    const title = $localize`:@@views.delete.title:Delete view?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.deleteView());
  }

  public deleteView() {
    this.performingAction$.next(true);
    this.store$.dispatch(
      new ViewsAction.Delete({
        viewId: this.view.id,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public onSubmit() {
    this.update();
  }

  private update() {
    this.performingAction$.next(true);

    const updateView = {...this.view, ...this.form.value};
    this.store$.dispatch(
      new ViewsAction.Update({
        view: updateView,
        viewId: updateView.id,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}

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
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {BehaviorSubject, Observable} from 'rxjs';
import {DialogType} from '../../dialog-type';
import {View} from '../../../../core/store/views/view';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {keyboardEventCode, KeyCode} from '../../../key-code';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {integerValidator, notEmptyValidator} from '../../../../core/validators/custom-validators';
import {selectAllViewsSorted, selectViewById} from '../../../../core/store/views/views.state';
import {map, tap} from 'rxjs/operators';
import {Collection} from '../../../../core/store/collections/collection';
import {
  defaultViewColorFromQuery,
  defaultViewIcon,
  getViewColor,
  getViewIcon,
} from '../../../../core/store/views/view.utils';
import {objectsByIdMap} from '../../../utils/common.utils';

@Component({
  templateUrl: './view-settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSettingsModalComponent implements OnInit {
  @Input()
  public view: View;

  @Input()
  public collections: Collection[];

  public performingAction$ = new BehaviorSubject(false);

  public view$: Observable<View>;
  public views$: Observable<View[]>;

  public readonly dialogType = DialogType;

  public form: UntypedFormGroup;
  public defaultIcon: string;
  public defaultColor: string;

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private fb: UntypedFormBuilder
  ) {}

  public ngOnInit() {
    this.view$ = this.store$.pipe(
      select(selectViewById(this.view.id)),
      tap(view => (this.view = view))
    );
    this.views$ = this.store$.pipe(
      select(selectAllViewsSorted),
      map(views => views.filter(view => view.id !== this.view?.id))
    );

    const collectionsMap = objectsByIdMap(this.collections);
    this.form = this.fb.group({
      name: [this.view.name, notEmptyValidator()],
      icon: [getViewIcon(this.view)],
      color: [getViewColor(this.view, collectionsMap)],
      priority: [this.view.priority, integerValidator()],
      folders: this.fb.array(this.view.folders || []),
    });

    this.defaultColor = defaultViewColorFromQuery(this.view, collectionsMap);
    this.defaultIcon = defaultViewIcon(this.view);
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

    const updateView: View = {...this.view, ...this.form.value};
    if (updateView.icon === this.defaultIcon) {
      delete updateView.icon;
    }
    if (updateView.color === this.defaultColor) {
      delete updateView.color;
    }
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
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}

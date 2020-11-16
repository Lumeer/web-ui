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

import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {combineLatest, Observable, of, Subscription} from 'rxjs';
import {filter, first, map, pairwise, startWith, switchMap, take} from 'rxjs/operators';
import {NotificationService} from '../core/notifications/notification.service';
import {FileAttachmentsService} from '../core/service/file-attachments.service';
import {AppState} from '../core/store/app.state';
import {selectViewsByRead} from '../core/store/common/permissions.selectors';
import {
  NavigationState,
  selectNavigation,
  selectPerspective,
  selectQuery,
} from '../core/store/navigation/navigation.state';
import {View} from '../core/store/views/view';
import {createPerspectiveSaveConfig} from '../core/store/views/view.utils';
import {ViewsAction} from '../core/store/views/views.action';
import {selectCurrentView, selectPerspectiveConfig, selectViewByCode} from '../core/store/views/views.state';
import {ViewControlsComponent} from './view-controls/view-controls.component';
import {ViewSettingsService} from '../core/service/view-settings.service';
import {selectCurrentUser} from '../core/store/users/users.state';
import {ModalService} from '../shared/modal/modal.service';
import {VerifyEmailModalComponent} from '../shared/modal/verify-email/verify-email-modal.component';
import {selectSaveViewSettings} from '../core/store/view-settings/view-settings.state';

@Component({
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FileAttachmentsService, ViewSettingsService],
})
export class ViewComponent implements OnInit {
  @ViewChild(ViewControlsComponent)
  public viewControlsComponent: ViewControlsComponent;

  public view$: Observable<View>;
  public viewsExist$: Observable<boolean>;
  public user: Subscription;

  constructor(
    private fileAttachmentsService: FileAttachmentsService,
    private viewSettingsService: ViewSettingsService,
    private i18n: I18n,
    private notificationService: NotificationService,
    private store$: Store<AppState>,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    this.view$ = this.bindView();
    this.viewsExist$ = this.bindViewsExist();

    this.fileAttachmentsService.init();
    this.viewSettingsService.init();

    this.checkEmailVerified();
  }

  private checkEmailVerified() {
    this.store$
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user),
        first()
      )
      .subscribe(user => {
        if (!user?.emailVerified) {
          this.modalService.showStaticDialog({}, VerifyEmailModalComponent);
        }
      });
  }

  private bindView(): Observable<View> {
    return this.store$.pipe(
      select(selectNavigation),
      filter(({workspace, perspective}) =>
        Boolean(workspace?.organizationCode && workspace?.projectCode && perspective)
      ),
      startWith(null as NavigationState),
      pairwise(),
      filter(
        ([previousNavigation, {workspace}]) =>
          !previousNavigation || previousNavigation.workspace.viewCode !== workspace.viewCode
      ),
      switchMap(([, {workspace, query, viewName}]) => {
        if (workspace.viewCode) {
          return this.store$.pipe(
            select(selectViewByCode(workspace.viewCode)),
            filter(view => !!view)
          );
        } else {
          return of({name: viewName || '', query, perspective: null, config: {}});
        }
      })
    );
  }

  private bindViewsExist(): Observable<boolean> {
    return this.store$.pipe(
      select(selectViewsByRead),
      map(views => views && views.length > 0)
    );
  }

  public onSaveOrClone(name: string) {
    this.onSave(name, true);
  }

  public onSave(name: string, clone?: boolean) {
    combineLatest([
      this.store$.pipe(select(selectPerspectiveConfig)),
      this.store$.pipe(select(selectPerspective)),
      this.getViewByName(name),
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectCurrentView)),
      this.store$.pipe(select(selectSaveViewSettings)),
    ])
      .pipe(take(1))
      .subscribe(([config, perspective, viewByName, query, currentView, settings]) => {
        const view: View = {
          ...currentView,
          query,
          name,
          config: {[perspective]: createPerspectiveSaveConfig(perspective, config)},
          settings,
          perspective,
        };

        if (viewByName && (!view.code || view.code !== viewByName.code)) {
          this.informAboutSameNameView(view);
        } else if (view.code) {
          if (clone) {
            this.askToCloneView(view);
          } else {
            this.updateView(view);
          }
        } else {
          this.createView(view);
        }
      });
  }

  private getViewByName(viewName: string): Observable<View> {
    return this.store$.pipe(select(selectViewsByRead)).pipe(
      first(),
      map(views => views.find(view => view.name === viewName))
    );
  }

  private informAboutSameNameView(view: View) {
    const title = this.i18n({
      id: 'view.name.exists',
      value: 'View already exist',
    });
    const message = this.i18n(
      {
        id: 'view.name.exists.message',
        value: 'Do you really want to {create, select, 1 {create view with the same name} 0 {change view name}}?',
      },
      {create: !!view.code ? '0' : '1'}
    );
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.createOrUpdateView(view));
  }

  private createOrUpdateView(view: View) {
    if (view.code) {
      this.updateView(view);
    } else {
      this.createView(view);
    }
  }

  private askToCloneView(view: View) {
    const title = null;
    const message = this.i18n({
      id: 'view.dialog.clone.message',
      value: 'Do you want to make a copy of the view or rename the existing one?',
    });
    const cloneButtonText = this.i18n({id: 'view.dialog.clone.clone', value: 'Make a copy'});
    const renameButtonText = this.i18n({id: 'view.dialog.clone.update', value: 'Rename'});

    this.notificationService.confirm(
      message,
      title,
      [
        {text: cloneButtonText, action: () => this.createView({...view, code: null}, view.id), bold: false},
        {text: renameButtonText, action: () => this.updateView(view), bold: false},
      ],
      'info'
    );
  }

  private createView(view: View, resetViewConfigId?: string) {
    this.startSaveLoading();

    const nextActions: Action[] = [new ViewsAction.ResetDefaultConfigBySnapshot({perspective: view.perspective})];
    if (resetViewConfigId) {
      nextActions.push(new ViewsAction.ResetViewConfig({viewId: resetViewConfigId}));
    }

    this.store$.dispatch(
      new ViewsAction.Create({
        view,
        nextActions,
        onSuccess: () => this.endSaveLoading(),
        onFailure: () => this.endSaveLoading(),
      })
    );
  }

  private updateView(view: View) {
    this.startSaveLoading();

    this.store$.dispatch(
      new ViewsAction.Update({
        viewId: view.id,
        view,
        onSuccess: () => this.endSaveLoading(),
        onFailure: () => this.endSaveLoading(),
      })
    );
  }

  private startSaveLoading() {
    this.viewControlsComponent.startSaveLoading();
  }

  private endSaveLoading() {
    this.viewControlsComponent.endSaveLoading();
  }
}

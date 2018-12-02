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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {filter, first, map, take, tap} from 'rxjs/operators';
import {AppState} from '../core/store/app.state';
import {NavigationState, selectNavigation, selectPerspective} from '../core/store/navigation/navigation.state';
import {Workspace} from '../core/store/navigation/workspace.model';
import {RouterAction} from '../core/store/router/router.action';
import {ViewModel} from '../core/store/views/view.model';
import {ViewsAction} from '../core/store/views/views.action';
import {selectAllViews, selectPerspectiveConfig, selectViewByCode} from '../core/store/views/views.state';
import {DialogService} from '../dialog/dialog.service';
import {Query} from '../core/store/navigation/query';
import {NotificationService} from '../core/notifications/notification.service';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {convertQueryModelToString} from '../core/store/navigation/query.converter';

@Component({
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent implements OnInit, OnDestroy {
  public view$ = new BehaviorSubject<ViewModel>(null);
  public viewsExist$: Observable<boolean>;

  private workspace: Workspace;
  private query: Query;
  private subscriptions = new Subscription();

  constructor(
    private dialogService: DialogService,
    private i18n: I18n,
    private notificationService: NotificationService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToNavigation());
    this.bindToViews();
  }

  private subscribeToNavigation(): Subscription {
    return this.store$
      .pipe(
        select(selectNavigation),
        filter(this.validNavigation)
      )
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.query = navigation.query;

        if (navigation.workspace.viewCode) {
          this.loadView(navigation.workspace.viewCode);
        } else {
          this.loadQuery(navigation.query, navigation.viewName);
        }
      });
  }

  private loadView(code: string) {
    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectViewByCode(code)),
          filter(view => !!view)
        )
        .subscribe(view => this.setView(view))
    );
  }

  private setView(view: ViewModel) {
    this.view$.next({...view});
    this.store$.dispatch(new ViewsAction.ChangeConfig({config: view.config}));
  }

  private loadQuery(query: Query, name?: string) {
    const view = {name: name || '', query: query, perspective: null, config: {}};
    this.view$.next(view);
  }

  private bindToViews() {
    this.viewsExist$ = this.store$.pipe(
      select(selectAllViews),
      tap(views => {
        const viewCode = this.view$.getValue().code;
        if (viewCode && !views.find(v => v.code === viewCode)) {
          this.loadQuery({});
        }
      }),
      map(views => views && views.length > 0)
    );
  }

  private validNavigation(navigation: NavigationState): boolean {
    return (
      !!navigation.workspace &&
      navigation.workspace.projectCode &&
      navigation.workspace.organizationCode &&
      !!navigation.perspective
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSaveOrClone(name: string) {
    this.onSave(name, true);
  }

  public onSave(name: string, clone?: boolean) {
    combineLatest(
      this.store$.pipe(select(selectPerspectiveConfig)),
      this.store$.pipe(select(selectPerspective)),
      this.getViewByName(name)
    )
      .pipe(take(1))
      .subscribe(([config, perspective, viewByName]) => {
        const view: ViewModel = {
          ...this.view$.getValue(),
          query: this.query,
          name,
          config: {[perspective]: config},
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

  private getViewByName(viewName: string): Observable<ViewModel> {
    return this.store$.pipe(select(selectAllViews)).pipe(
      first(),
      map(views => views.find(view => view.name === viewName))
    );
  }

  private informAboutSameNameView(view: ViewModel) {
    const title = this.i18n({
      id: 'view.name.exists',
      value: 'View already exist',
    });
    const message = this.i18n(
      {
        id: 'view.name.exists.message',
        value: 'Do you really want to change view name?',
      },
      {name: view.name}
    );

    this.notificationService.confirm(message, title, [
      {text: 'No'},
      {text: 'Yes', action: () => this.updateView(view), bold: false},
    ]);
  }

  private askToCloneView(view: ViewModel) {
    const title = null;
    const message = this.i18n({
      id: 'view.dialog.clone.message',
      value: 'Do you want to create a copy of the view or just rename?',
    });
    const cloneButtonText = this.i18n({id: 'view.dialog.clone.clone', value: 'Create a copy'});
    const renameButtonText = this.i18n({id: 'view.dialog.clone.rename', value: 'Rename'});

    this.notificationService.confirm(message, title, [
      {text: cloneButtonText, action: () => this.createView({...view, code: null}), bold: false},
      {text: renameButtonText, action: () => this.updateView(view), bold: false},
    ]);
  }

  private createView(view: ViewModel) {
    this.store$.dispatch(new ViewsAction.Create({view}));
  }

  private updateView(view: ViewModel) {
    this.store$.dispatch(new ViewsAction.Update({viewCode: view.code, view}));
  }
}

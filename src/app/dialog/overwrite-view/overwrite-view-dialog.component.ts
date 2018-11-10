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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Store} from '@ngrx/store';
import {filter, map, mergeMap, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {ViewModel} from '../../core/store/views/view.model';
import {selectViewByCode} from '../../core/store/views/views.state';
import {DialogService} from '../dialog.service';

@Component({
  selector: 'overwrite-view-dialog',
  templateUrl: './overwrite-view-dialog.component.html',
})
export class OverwriteViewDialogComponent implements OnInit, OnDestroy {
  public view: ViewModel;
  public viewPath: any[] = [];

  private subscriptions = new Subscription();

  public constructor(
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private store: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToExistingView());
  }

  private subscribeToExistingView(): Subscription {
    return this.route.paramMap
      .pipe(
        map(params => params.get('existingViewCode')),
        filter(viewCode => !!viewCode),
        mergeMap(viewCode => this.store.select(selectViewByCode(viewCode))),
        withLatestFrom(this.store.select(selectWorkspace))
      )
      .subscribe(([view, workspace]) => {
        this.viewPath = [
          '/',
          'w',
          workspace.organizationCode,
          workspace.projectCode,
          'view',
          {vc: view.code},
          {outlets: {dialog: null}},
        ];
        this.view = view;
      });
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    if (this.dialogService.callback) {
      this.dialogService.callback();
    }
  }
}

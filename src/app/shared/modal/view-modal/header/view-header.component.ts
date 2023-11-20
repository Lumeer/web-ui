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
import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {AppState} from '../../../../core/store/app.state';
import {View} from '../../../../core/store/views/view';
import {getViewIcon} from '../../../../core/store/views/view.utils';
import {selectViewById} from '../../../../core/store/views/views.state';

@Component({
  selector: 'view-header',
  templateUrl: './view-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'p-3 text-center bg-success text-white w-100 rounded-top'},
})
export class ViewHeaderComponent implements OnInit {
  @Input()
  public viewId: string;

  @Input()
  public prefix: string;

  public view$: Observable<View>;
  public viewIcon$: Observable<string>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.view$ = this.store$.pipe(select(selectViewById(this.viewId)));

    this.viewIcon$ = this.view$.pipe(map(view => getViewIcon(view)));
  }
}

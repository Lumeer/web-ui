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
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {map, skipWhile, take} from 'rxjs/operators';
import {Query} from '../core/dto/query';
import {AppState} from '../core/store/app.state';
import {selectNavigation} from '../core/store/navigation/navigation.state';
import {ViewModel} from '../core/store/views/view.model';
import {ViewsAction} from '../core/store/views/views.action';
import {selectViewConfig, selectViewsDictionary} from '../core/store/views/views.state';
import {perspectivesMap} from './perspectives/perspective';

@Component({
  templateUrl: './view.component.html'
})
export class ViewComponent implements OnInit, OnDestroy {

  public view: ViewModel;

  private viewSubscription: Subscription;
  private configSubscription: Subscription;
  private navigationSubscription: Subscription;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.navigationSubscription = this.store.select(selectNavigation).subscribe(navigation => {
      if (!navigation.workspace) {
        return;
      }

      if (navigation.workspace.viewCode) {
        this.loadView(navigation.workspace.viewCode, navigation.perspective);
      } else {
        this.loadQuery(navigation.query, navigation.perspective);
      }
    });
  }

  public ngOnDestroy() {
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  private loadView(code: string, perspective?: string) {
    this.store.dispatch(new ViewsAction.GetByCode({viewCode: code}));

    this.viewSubscription = this.store.select(selectViewsDictionary).pipe(
      map(views => views[code]),
      skipWhile(view => !view)
    ).subscribe(view => {
      this.view = {...view};
      this.view.perspective = perspective ? perspectivesMap[perspective] : this.view.perspective;
    });
  }

  private loadQuery(query: Query, perspective?: string) {
    this.view = {
      name: '',
      query: query,
      perspective: perspectivesMap[perspective],
      config: {}
    };
  }

  public onSave(viewName: string) {
    this.configSubscription = this.store.select(selectViewConfig).pipe(take(1)).subscribe(config => {
      this.view.name = viewName;
      this.view.config = {...config};

      if (this.view.code) {
        this.updateView();
      } else {
        this.createView();
      }
    });
  }

  private createView() {
    this.store.dispatch(new ViewsAction.Create({view: this.view}));
  }

  private updateView() {
    this.store.dispatch(new ViewsAction.Update({viewCode: this.view.code, view: this.view}));
  }

}

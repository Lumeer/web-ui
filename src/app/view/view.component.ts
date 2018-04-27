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
import {Observable} from 'rxjs/Observable';
import {filter, first, map, skipWhile, take} from 'rxjs/operators';
import {Query} from '../core/dto';
import {AppState} from '../core/store/app.state';
import {NavigationState, selectNavigation, selectPerspective} from '../core/store/navigation/navigation.state';
import {Workspace} from '../core/store/navigation/workspace.model';
import {RouterAction} from '../core/store/router/router.action';
import {ViewModel} from '../core/store/views/view.model';
import {ViewsAction} from '../core/store/views/views.action';
import {selectAllViews, selectViewByCode, selectViewConfig, selectViewsDictionary} from '../core/store/views/views.state';

declare var $: any;

@Component({
  templateUrl: './view.component.html'
})
export class ViewComponent implements OnInit, OnDestroy {

  public view: ViewModel;

  public workspace: Workspace;

  public existingView: ViewModel;
  public newView: ViewModel;

  private viewSubscription: Subscription;
  private configSubscription: Subscription;
  private navigationSubscription: Subscription;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.navigationSubscription = this.store.select(selectNavigation).pipe(
      filter(this.validNavigation)
    ).subscribe(navigation => {
      this.workspace = navigation.workspace;
      if (!navigation.workspace) {
        return;
      }

      if (navigation.workspace.viewCode) {
        this.loadView(navigation.workspace.viewCode);
      } else {
        this.loadQuery(navigation.query);
      }
    });

    $('#overwriteViewDialogModal').on('hidden.bs.modal', () => {
      this.existingView = null;
      this.newView = null;
    });
  }

  private validNavigation(navigation: NavigationState): boolean {
    return Boolean(navigation && navigation.workspace && navigation.workspace.projectCode &&
      navigation.workspace.organizationCode &&
      navigation.perspective);
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

  private loadView(code: string) {
    this.viewSubscription = this.store.select(selectViewByCode(code)).pipe(
      filter(view => Boolean(view))
    ).subscribe(view => {
      this.view = {...view};
      this.store.dispatch(new ViewsAction.ChangeConfig({config: view.config}));
    });
  }

  private loadQuery(query: Query) {
    this.view = {
      name: '',
      query: query,
      perspective: null,
      config: {}
    };
  }

  public onSave(name: string) {
    this.configSubscription = Observable.combineLatest(
      this.store.select(selectViewConfig),
      this.store.select(selectPerspective)
    ).pipe(take(1)).subscribe(([config, perspective]) => {
      const view: ViewModel = {...this.view, name, config, perspective};

      if (view.code) {
        this.updateView(view);
      } else {
        this.saveView(view);
      }
    });
  }

  private saveView(view: ViewModel) {
    this.getViewByName(view.name).subscribe(existingView => {
      if (existingView) {
        this.openOverwriteDialog(existingView, view);
      } else {
        this.createView(view);
      }
    });
  }

  private getViewByName(viewName: string): Observable<ViewModel> {
    return this.store.select(selectAllViews).pipe(
      first(),
      map(views => views.find(view => view.name === viewName))
    );
  }

  private openOverwriteDialog(existingView: ViewModel, newView: ViewModel) {
    this.existingView = existingView;
    this.newView = newView;

    $('#overwriteViewDialogModal').modal('show');
  }

  public onConfirmOverwrite(view: ViewModel) {
    const path: any[] = ['w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: view.code}];

    this.store.dispatch(new ViewsAction.Update({
      viewCode: view.code,
      view,
      nextAction: new RouterAction.Go({path})
    }));
  }

  private createView(view: ViewModel) {
    this.store.dispatch(new ViewsAction.Create({view}));
  }

  private updateView(view: ViewModel) {
    this.store.dispatch(new ViewsAction.Update({viewCode: view.code, view}));
  }

}

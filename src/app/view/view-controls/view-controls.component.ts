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

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Router} from '@angular/router';

import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {RouterAction} from '../../core/store/router/router.action';
import {ViewModel} from '../../core/store/views/view.model';
import {selectViewConfig} from '../../core/store/views/views.state';
import {Perspective, perspectiveIconsMap} from '../perspectives/perspective';

@Component({
  selector: 'view-controls',
  templateUrl: './view-controls.component.html',
  styleUrls: ['./view-controls.component.scss']
})
export class ViewControlsComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public view: ViewModel;

  @Output()
  public save = new EventEmitter<string>();

  public viewName: string;

  private workspace: Workspace;

  private subscription: Subscription;

  constructor(private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscription = this.store.select(selectNavigation).subscribe(navigation => {
      console.log(navigation);
      this.workspace = navigation.workspace;
      if (navigation.viewName) {
        this.viewName =  `${navigation.viewName} - copy`;
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('view') && this.view) {
      if (this.view.name) {
        this.viewName = this.view.name;
      }
    }
  }

  public ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public onSelectPerspective(perspective: string) {
    const path: any[] = ['w', this.workspace.organizationCode, this.workspace.projectCode, 'view'];
    if (this.workspace.viewCode) {
      path.push({vc: this.workspace.viewCode});
    }
    path.push(perspective);

    this.store.dispatch(new RouterAction.Go({path, extras: {queryParamsHandling: 'merge'}}));
  }

  public onSave() {
    // TODO validation
    this.save.emit(this.viewName.trim());
  }

  public onCopy() {
    const path: any[] = ['w', this.workspace.organizationCode, this.workspace.projectCode, 'view', this.view.perspective];
    this.store.dispatch(new RouterAction.Go({
      path, query: {
        query: QueryConverter.toString(this.view.query),
        viewName: `${this.view.name}`
      }
    }));
  }

  public perspectives(): string[] {
    return Object.values(Perspective);
  }

  public getIconForPerspective(perspective: string): string {
    return perspectiveIconsMap[perspective] || '';
  }

  private isSingleCollectionInQuery(): boolean {
    const query = this.view.query;
    return query && query.collectionCodes && query.collectionCodes.length === 1;
  }

  public canShowPerspective(perspective: Perspective): boolean {
    switch (perspective) {
      case Perspective.Table:
      case Perspective.SmartDoc:
        return this.isSingleCollectionInQuery();
      default:
        return true;
    }
  }

  public isViewChanged(): Observable<boolean> {
    return this.store.select(selectViewConfig).pipe(
      map(config => {
        const sameConfig: boolean = JSON.stringify(config) === JSON.stringify(this.view.config);
        return this.view.name !== this.viewName || !sameConfig;
      })
    )
  }

}

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

import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Router} from '@angular/router';

import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {ViewModel} from '../../core/store/views/view.model';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {Perspective} from '../perspectives/perspective';
import {RouterAction} from '../../core/store/router/router.action';

@Component({
  selector: 'view-controls',
  templateUrl: './view-controls.component.html',
  styleUrls: ['./view-controls.component.scss']
})
export class ViewControlsComponent implements OnInit, OnDestroy {

  @Input()
  public view: ViewModel;

  @Output()
  public save = new EventEmitter<string>();

  @ViewChild('viewName')
  public viewNameInput: ElementRef;

  private workspace: Workspace;

  private subscription: Subscription;

  constructor(private router: Router,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscription = this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
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
    this.save.emit(this.viewNameInput.nativeElement.value.trim());
  }

  public onCopy() {
    const path: any[] = ['w', this.workspace.organizationCode, this.workspace.projectCode, 'view', this.view.perspective];
    this.store.dispatch(new RouterAction.Go({path, query: {query: QueryConverter.toString(this.view.query)}}));
  }

  public perspectives(): string[] {
    return Object.values(Perspective);
  }

  public getIconForPerspective(perspective: string): string {
    switch (perspective) {
      case Perspective.Table:
        return 'fa-table';
      case Perspective.PostIt:
        return 'fa-file';
      case Perspective.Search:
        return 'fa-list-ul';
    }
    return '';
  }

  public getTitleForPerspective(perspective: string): string {
    switch (perspective) {
      case Perspective.Table:
        return 'Table';
      case Perspective.PostIt:
        return 'Post-it';
      case Perspective.Search:
        return 'Search';
    }
    return '';
  }

}

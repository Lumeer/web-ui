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

import {Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {RouterAction} from '../../core/store/router/router.action';
import {ViewModel} from '../../core/store/views/view.model';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectViewConfig} from '../../core/store/views/views.state';
import {DialogService} from '../../dialog/dialog.service';
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

  @ViewChild('viewNameInput')
  public viewNameInput: ElementRef;

  public nameChanged: boolean;
  public configChanged: boolean;

  private workspace: Workspace;
  public perspective: Perspective;

  private configSubscription: Subscription;
  private navigationSubscription: Subscription;

  constructor(private dialogService: DialogService,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeNavigation();
    this.subscribeConfig();
  }

  private subscribeNavigation() {
    this.navigationSubscription = this.store.select(selectNavigation).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.perspective = navigation.perspective;

      if (navigation.viewName) {
        this.setViewNameInputValue(`${navigation.viewName} - copy`);
        this.nameChanged = true;
      }
    });
  }

  private subscribeConfig() {
    this.configSubscription = this.store.select(selectViewConfig).subscribe(config => {
      this.configChanged = JSON.stringify(config[this.perspective]) !== JSON.stringify(this.view.config[this.perspective]);
    });
  }

  public onNameInput(viewName: string) {
    this.nameChanged = this.view.name !== viewName;
  }

  public isViewChanged(): boolean {
    const perspectiveChanged = this.view.perspective !== this.perspective;
    return this.view.code ? (this.nameChanged || this.configChanged || perspectiveChanged) : this.nameChanged;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('view')) {
      if (this.view && this.view.name) {
        this.setViewNameInputValue(this.view.name);
        this.nameChanged = false;
      } else {
        this.setViewNameInputValue('');
      }
    }
  }

  private setViewNameInputValue(value: string) {
    this.viewNameInput.nativeElement.value = value;
  }

  public ngOnDestroy() {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  public onSelectPerspective(perspective: string) {
    const path: any[] = ['w', this.workspace.organizationCode, this.workspace.projectCode, 'view'];
    if (this.workspace.viewCode) {
      path.push({vc: this.workspace.viewCode});
    }
    path.push(perspective);

    this.dispatchActionsOnChangePerspective(perspective);

    this.store.dispatch(new RouterAction.Go({path, extras: {queryParamsHandling: 'merge'}}));
  }

  public onSave(viewName: string) {
    this.save.emit(viewName.trim());
  }

  public onCopy() {
    const path: any[] = ['w', this.workspace.organizationCode, this.workspace.projectCode, 'view', this.view.perspective];
    this.store.dispatch(new RouterAction.Go({
      path, queryParams: {
        query: QueryConverter.toString(this.view.query),
        viewName: `${this.view.name}`
      }
    }));
  }

  public onShareClick() {
    this.dialogService.openShareViewDialog();
  }

  public perspectives(): string[] {
    return Object.values(Perspective);
  }

  public getIconForPerspective(perspective: string): string {
    return perspectiveIconsMap[perspective] || '';
  }

  private isSingleCollectionInQuery(): boolean {
    const query = this.view.query;
    return query && query.collectionIds && query.collectionIds.length === 1;
  }

  public canShowPerspective(perspective: Perspective): boolean {
    switch (perspective) {
      case Perspective.Table2:
      case Perspective.SmartDoc:
      case Perspective.Chart:
        return this.isSingleCollectionInQuery();
      case Perspective.Table:
        return false;
      default:
        return true;
    }
  }

  private dispatchActionsOnChangePerspective(perspective: string) {
    if (perspective === Perspective.Search.valueOf()) {
      this.store.dispatch(new ViewsAction.ChangeSearchConfig({config: {expandedDocumentIds: []}}));
    }
  }

}

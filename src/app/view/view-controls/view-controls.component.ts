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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {selectPerspective, selectQuery, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {RouterAction} from '../../core/store/router/router.action';
import {ViewConfigModel, ViewModel} from '../../core/store/views/view.model';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectViewConfig} from '../../core/store/views/views.state';
import {DialogService} from '../../dialog/dialog.service';
import {Perspective} from '../perspectives/perspective';

export const PERSPECTIVE_CHOOSER_CLICK = 'perspectiveChooserClick';

@Component({
  selector: 'view-controls',
  templateUrl: './view-controls.component.html',
  styleUrls: ['./view-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewControlsComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public novice: boolean;

  @Input()
  public view: ViewModel;

  @Output()
  public save = new EventEmitter<string>();

  public name: string;

  public config$: Observable<ViewConfigModel>;
  public perspective$: Observable<Perspective>;
  public query$: Observable<QueryModel>;

  private workspace: Workspace;
  public readonly perspectives = Object.values(Perspective);

  private subscriptions = new Subscription();

  constructor(private dialogService: DialogService,
              private notificationService: NotificationService,
              private i18n: I18n,
              private route: ActivatedRoute,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToWorkspace());

    this.config$ = this.store.select(selectViewConfig);
    this.perspective$ = this.store.select(selectPerspective);
    this.query$ = this.store.select(selectQuery);
  }

  private subscribeToWorkspace(): Subscription {
    return this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public onNameInput(name: string) {
    this.name = name;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
      if (this.view && this.view.name) {
        this.name = this.view.name;
      } else {
        this.name = '';
      }
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
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

  public onSave() {
    this.save.emit(this.name.trim());
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
    const message = this.i18n(
      {
        id: 'view.share.notWorking',
        value: 'This feature is currently under construction. Your view can be currently accessed only by you.'
      });
    const title = this.i18n({id: 'view.share.underConstruction', value: 'Under Construction'});
    const okButtonText = this.i18n({id: 'button.ok', value: 'OK'});

    this.notificationService.confirm(message, title, [
      {text: okButtonText, bold: true},
    ]);
    // TODO this.dialogService.openShareViewDialog();
  }

  private dispatchActionsOnChangePerspective(perspective: string) {
    if (perspective === Perspective.Search.valueOf()) {
      this.store.dispatch(new ViewsAction.ChangeSearchConfig({config: {expandedDocumentIds: []}}));
    }
  }

  public onPerspectiveChooserClick(event: MouseEvent) {
    event[PERSPECTIVE_CHOOSER_CLICK] = true;
  }

}

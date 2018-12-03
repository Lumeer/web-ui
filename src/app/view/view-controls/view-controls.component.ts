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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {NavigationExtras} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {debounceTime, map, tap} from 'rxjs/operators';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectPerspective, selectSearchTab, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {RouterAction} from '../../core/store/router/router.action';
import {ViewConfigModel, ViewModel} from '../../core/store/views/view.model';
import {
  selectPerspectiveViewConfig,
  selectViewConfigChanged,
  selectViewPerspectiveChanged,
  selectViewQueryChanged,
} from '../../core/store/views/views.state';
import {DialogService} from '../../dialog/dialog.service';
import {Perspective} from '../perspectives/perspective';
import {Query} from '../../core/store/navigation/query';

export const PERSPECTIVE_CHOOSER_CLICK = 'perspectiveChooserClick';

@Component({
  selector: 'view-controls',
  templateUrl: './view-controls.component.html',
  styleUrls: ['./view-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewControlsComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public novice: boolean;

  @Input()
  public view: ViewModel;

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public saveOrClone = new EventEmitter<string>();

  public name: string;

  public config$: Observable<ViewConfigModel>;
  public perspective$: Observable<Perspective>;

  public nameChanged$ = new BehaviorSubject(false);
  public viewChanged$: Observable<boolean>;

  private configChanged: boolean;
  private queryChanged: boolean;
  private currentPerspective: Perspective;
  private searchTab?: string;
  private workspace: Workspace;

  public readonly perspectives = Object.values(Perspective);

  private subscriptions = new Subscription();

  constructor(
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private i18n: I18n,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToWorkspace());
    this.subscriptions.add(this.subscribeToSearchTab());

    this.config$ = this.store$.pipe(select(selectPerspectiveViewConfig));

    this.perspective$ = this.store$.pipe(
      select(selectPerspective),
      tap(perspective => (this.currentPerspective = perspective))
    );
  }

  private subscribeToWorkspace(): Subscription {
    return this.store$.pipe(select(selectWorkspace)).subscribe(workspace => (this.workspace = workspace));
  }

  private subscribeToSearchTab(): Subscription {
    return this.store$.pipe(select(selectSearchTab)).subscribe(tab => (this.searchTab = tab));
  }

  public onNameInput(name: string) {
    this.name = name;
    this.nameChanged$.next(this.view && name && this.view.name !== name);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
      const previousCode = changes.view.previousValue && changes.view.previousValue.code;
      const currentCode = changes.view.currentValue.code;

      if (previousCode && !currentCode) {
        this.navigateToUrlWithoutView();
      }

      if (this.view && this.view.name) {
        this.name = this.view.name;
      } else {
        this.name = '';
      }

      this.nameChanged$.next(false);
      this.bindViewChanged();
    }
  }

  private bindViewChanged() {
    this.viewChanged$ = combineLatest(
      this.nameChanged$,
      this.store$.pipe(select(selectViewConfigChanged)),
      this.store$.pipe(select(selectViewQueryChanged)),
      this.store$.pipe(select(selectViewPerspectiveChanged))
    ).pipe(
      debounceTime(100),
      tap(([nameChanged, configChanged, queryChanged]) => {
        this.configChanged = configChanged;
        this.queryChanged = queryChanged;
      }),
      map(
        ([nameChanged, configChanged, queryChanged, perspectiveChanged]) =>
          nameChanged || configChanged || queryChanged || perspectiveChanged
      )
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onInputBlur(canManage: boolean) {
    if (!this.view.code || !canManage || this.name) {
      return;
    }

    if (this.queryChanged || this.configChanged) {
      this.askToDiscardChanges();
    } else {
      this.navigateToUrlWithoutView({});
    }
  }

  private askToDiscardChanges() {
    const message = this.i18n({
      id: 'view.discard.changes.message',
      value: 'The view was changed. Do you want to save the changes?',
    });
    const title = this.i18n({id: 'view.discard.changes.message.title', value: 'Save view'});
    const discard = this.i18n({id: 'button.discard', value: 'Discard'});
    const save = this.i18n({id: 'button.save', value: 'Save'});

    this.notificationService.confirm(message, title, [
      {text: save, action: () => this.save.emit(this.view.name)},
      {text: discard, action: () => this.navigateToUrlWithoutView({}), bold: false},
    ]);
  }

  public navigateToUrlWithoutView(query?: Query) {
    this.store$.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: query}));
  }

  public onSelectPerspective(perspective: string, canManage: boolean) {
    if (perspective === this.currentPerspective) {
      return;
    }

    const path: any[] = [...this.workspacePaths(), 'view'];
    if (canManage && this.workspace.viewCode) {
      path.push({vc: this.workspace.viewCode});
    }
    let extras: NavigationExtras = null;
    if (canManage || !this.workspace.viewCode) {
      extras = {queryParamsHandling: 'merge'};
    }
    path.push(perspective);

    this.store$.dispatch(new RouterAction.Go({path, extras}));
  }

  private workspacePaths(): any[] {
    return ['w', this.workspace.organizationCode, this.workspace.projectCode];
  }

  public onSave(canClone: boolean) {
    const value = this.name.trim();
    if (canClone && this.onlyViewNameChanged()) {
      this.saveOrClone.emit(value);
    } else {
      this.save.emit(value);
    }
  }

  private onlyViewNameChanged(): boolean {
    return !this.configChanged && !this.queryChanged && this.nameChanged$.getValue();
  }

  public onShareClick() {
    this.dialogService.openShareViewDialog(this.view.code);
  }

  public onPerspectiveChooserClick(event: MouseEvent) {
    event[PERSPECTIVE_CHOOSER_CLICK] = true;
  }
}

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
  ViewChild,
} from '@angular/core';
import {NavigationExtras} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {debounceTime, map, take, tap} from 'rxjs/operators';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectPerspective, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {RouterAction} from '../../core/store/router/router.action';
import {View} from '../../core/store/views/view';
import {
  selectCurrentView,
  selectViewConfigChanged,
  selectViewPerspectiveChanged,
  selectViewQueryChanged,
} from '../../core/store/views/views.state';
import {Perspective} from '../perspectives/perspective';
import {Query} from '../../core/store/navigation/query/query';
import {OptionsDropdownComponent} from '../../shared/dropdown/options/options-dropdown.component';
import {ModalService} from '../../shared/modal/modal.service';
import {KeyCode} from '../../shared/key-code';
import {SearchesAction} from '../../core/store/searches/searches.action';
import {SearchTab} from '../../core/store/navigation/search-tab';
import {QueryParam} from '../../core/store/navigation/query-param';
import {convertQueryModelToString} from '../../core/store/navigation/query/query.converter';
import {TablesAction} from '../../core/store/tables/tables.action';
import {PivotsAction} from '../../core/store/pivots/pivots.action';
import {MapsAction} from '../../core/store/maps/maps.action';
import {GanttChartAction} from '../../core/store/gantt-charts/gantt-charts.action';

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
  public view: View;

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public saveOrClone = new EventEmitter<string>();

  @ViewChild(OptionsDropdownComponent, {static: false})
  public dropdown: OptionsDropdownComponent;

  public name: string;

  public perspective$: Observable<Perspective>;

  public saveLoading$ = new BehaviorSubject(false);
  public nameChanged$ = new BehaviorSubject(false);
  public viewChanged$: Observable<boolean>;

  private configChanged: boolean;
  private queryChanged: boolean;
  private currentPerspective: Perspective;
  private workspace: Workspace;

  public readonly perspectives = Object.values(Perspective);

  private subscriptions = new Subscription();

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private i18n: I18n,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToWorkspace());

    this.perspective$ = this.store$.pipe(
      select(selectPerspective),
      tap(perspective => (this.currentPerspective = perspective))
    );
  }

  private subscribeToWorkspace(): Subscription {
    return this.store$.pipe(select(selectWorkspace)).subscribe(workspace => (this.workspace = workspace));
  }

  public onNameInput(name: string) {
    this.name = name;
    this.nameChanged$.next(this.view && name && this.view.name !== name);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
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
    this.viewChanged$ = combineLatest([
      this.nameChanged$,
      this.store$.pipe(select(selectViewConfigChanged)),
      this.store$.pipe(select(selectViewQueryChanged)),
      this.store$.pipe(select(selectViewPerspectiveChanged)),
    ]).pipe(
      debounceTime(100),
      tap(([, configChanged, queryChanged]) => {
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

    this.notificationService.confirm(
      message,
      title,
      [
        {text: save, action: () => this.save.emit(this.view.name)},
        {text: discard, action: () => this.navigateToUrlWithoutView({}), bold: false},
      ],
      'danger'
    );
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
    if (canClone && this.nameChanged$.getValue()) {
      this.saveOrClone.emit(value);
    } else {
      this.save.emit(value);
    }
  }

  public onShareClick() {
    this.modalService.showShareView(this.view);
  }

  public onPerspectiveChooserClick(event: MouseEvent) {
    event[PERSPECTIVE_CHOOSER_CLICK] = true;
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public startSaveLoading() {
    this.setSaveLoading(true);
  }

  public endSaveLoading() {
    this.setSaveLoading(false);
  }

  private setSaveLoading(loading: boolean) {
    this.saveLoading$.next(loading);
  }

  public onViewNameKeyPress(
    canSave: boolean,
    $event: KeyboardEvent,
    canClone: boolean,
    viewNameInput: HTMLInputElement
  ) {
    if (canSave && ($event.code === KeyCode.Enter || $event.code === KeyCode.NumpadEnter)) {
      this.onSave(canClone);
      viewNameInput.blur();
    }
  }

  public revertChanges() {
    this.store$.pipe(select(selectCurrentView), take(1)).subscribe(view => {
      if (!view || !this.workspace) {
        return;
      }
      const workspacePath = [...this.workspacePaths(), 'view', {vc: view.code}, view.perspective];
      this.revertChangesForView(view, workspacePath);
    });
  }

  private revertChangesForView(view: View, workspacePath: any[]) {
    switch (view.perspective) {
      case Perspective.Search:
        const searchConfig = view.config && view.config.search;
        const searchPath = [...workspacePath, (searchConfig && searchConfig.searchTab) || SearchTab.All];
        this.revertQueryWithUrl(searchPath, view.query);
        this.store$.dispatch(new SearchesAction.SetConfig({searchId: view.code, config: searchConfig}));
        return;
      case Perspective.Table:
        const tableConfig = view.config && view.config.table;
        this.revertQueryWithUrl(workspacePath, view.query);
        this.store$.dispatch(new TablesAction.SetConfig({tableId: view.code, config: tableConfig}));
        return;
      case Perspective.Pivot:
        const pivotConfig = view.config && view.config.pivot;
        this.revertQueryWithUrl(workspacePath, view.query);
        this.store$.dispatch(new PivotsAction.SetConfig({pivotId: view.code, config: pivotConfig}));
        return;
      case Perspective.GanttChart:
        const ganttConfig = view.config && view.config.ganttChart;
        this.revertQueryWithUrl(workspacePath, view.query);
        this.store$.dispatch(new GanttChartAction.SetConfig({ganttChartId: view.code, config: ganttConfig}));
        return;
      case Perspective.Map:
        const mapConfig = view.config && view.config.map;
        this.revertQueryWithUrl(workspacePath, view.query);
        this.store$.dispatch(new MapsAction.CreateMap({mapId: view.code, config: mapConfig}));
        return;
    }
  }

  private revertQueryWithUrl(path: any[], query: Query) {
    this.store$.dispatch(
      new RouterAction.Go({
        path,
        queryParams: {[QueryParam.Query]: convertQueryModelToString(query)},
      })
    );
  }
}

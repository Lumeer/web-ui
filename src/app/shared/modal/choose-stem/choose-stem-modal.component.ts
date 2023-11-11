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

import {Component, ChangeDetectionStrategy, Input, OnInit} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {QueryStem} from '../../../core/store/navigation/query/query';
import {map} from 'rxjs/operators';
import {
  selectAllCollectionsWithoutHiddenAttributes,
  selectAllLinkTypesWithoutHiddenAttributes,
} from '../../../core/store/common/permissions.selectors';
import {QueryItemsConverter} from '../../top-panel/search-box/query-item/query-items.converter';
import {QueryItem} from '../../top-panel/search-box/query-item/model/query-item';

@Component({
  templateUrl: './choose-stem-modal.component.html',
  styleUrls: ['./choose-stem-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseStemModalComponent implements OnInit {
  @Input()
  public stems: QueryStem[];

  @Input()
  public title: string;

  @Input()
  public callback: (index: number) => void;

  @Input()
  public cancel: () => void;

  public defaultTitle: string;

  public selectedIndex$ = new BehaviorSubject<number>(null);
  public queryItemsArray$: Observable<QueryItem[][]>;

  public readonly dialogType = DialogType;

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    const queryData$ = combineLatest([
      this.store$.pipe(select(selectAllCollectionsWithoutHiddenAttributes)),
      this.store$.pipe(select(selectAllLinkTypesWithoutHiddenAttributes)),
    ]).pipe(map(([collections, linkTypes]) => ({collections, linkTypes})));

    this.queryItemsArray$ = queryData$.pipe(
      map(data => {
        const converter = new QueryItemsConverter(data);
        return (this.stems || []).map(stem => converter.fromQuery({stems: [stem]}));
      })
    );
  }

  public onSelectIndex(index: number) {
    this.selectedIndex$.next(index);
  }

  public onClose() {
    this.cancel?.();
    this.hideDialog();
  }

  public onSubmit() {
    this.callback?.(this.selectedIndex$.value);
    this.hideDialog();
  }

  public onDoubleClick(index: number) {
    this.callback?.(index);
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }
}

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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../core/store/app.state';
import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {selectLinkTypeWithCollections} from '../../../../../core/store/link-types/link-types.state';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel, TablePart} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-header-link',
  templateUrl: './table-header-link.component.html',
  styleUrls: ['./table-header-link.component.scss']
})
export class TableHeaderLinkComponent implements OnInit, OnDestroy {

  @Input()
  public table: TableModel;

  @Input()
  public part: TablePart;

  public linkType: LinkTypeModel;

  public subscriptions = new Subscription();

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscriptions.add(
      this.store.select(selectLinkTypeWithCollections(this.part.linkTypeId))
        .subscribe(linkType => this.linkType = linkType)
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public switchingEnabled(): boolean {
    return this.hasSingleLinkedPart() && !this.isSameCollectionLinked();
  }

  private hasSingleLinkedPart(): boolean {
    return this.table.parts.length <= 3;
  }

  private isSameCollectionLinked(): boolean {
    return new Set(this.linkType.collectionIds).size === 1;
  }

  public onSwitchParts() {
    this.store.dispatch(new TablesAction.SwitchParts({cursor: this.getCursor()}));
  }

  public onRemovePart() {
    this.store.dispatch(new TablesAction.RemovePart({cursor: this.getCursor()}));
  }

  public getCursor(): TableHeaderCursor {
    return {
      tableId: this.table.id,
      partIndex: this.part.index,
      columnPath: []
    };
  }

}

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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {AppState} from '../../../../../../../core/store/app.state';
import {selectCollectionAttributeConstraint} from '../../../../../../../core/store/collections/collections.state';
import {DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {LinkInstance} from '../../../../../../../core/store/link-instances/link.instance';
import {selectLinkTypeAttributeById} from '../../../../../../../core/store/link-types/link-types.state';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableConfigColumn} from '../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';
import {selectEditedAttribute} from '../../../../../../../core/store/tables/tables.selector';
import {TableCollapsedCellMenuComponent} from './menu/table-collapsed-cell-menu.component';
import {
  ActionDataInputConfiguration,
  UserDataInputConfiguration,
} from '../../../../../../../shared/data-input/data-input-configuration';
import {computeElementPositionInParent, preventEvent} from '../../../../../../../shared/utils/common.utils';
import {Constraint, ConstraintData, ConstraintType, UnknownConstraint} from '@lumeer/data-filters';

@Component({
  selector: 'table-collapsed-cell',
  templateUrl: './table-collapsed-cell.component.html',
  styleUrls: ['./table-collapsed-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCollapsedCellComponent implements OnInit, OnChanges {
  @Input()
  public column: TableConfigColumn;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public selected: boolean;

  @Input()
  public viewId: string;

  @ViewChild(TableCollapsedCellMenuComponent, {static: true})
  public menuComponent: TableCollapsedCellMenuComponent;

  public affected$: Observable<boolean>;
  public constraint$: Observable<Constraint>;

  public values: any[];
  public stringValues$: Observable<string[]>;
  public titleValue$: Observable<string>;

  public readonly userConfiguration: UserDataInputConfiguration = {allowCenterOnlyIcon: true};
  public readonly actionConfiguration: ActionDataInputConfiguration = {center: true};
  public readonly constraintType = ConstraintType;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.bindAffected();
  }

  private bindAffected() {
    this.affected$ = this.store$.select(selectEditedAttribute).pipe(
      map(
        edited =>
          edited &&
          edited.attributeId === this.column.attributeIds[0] &&
          (!!(this.documents && this.documents.find(doc => doc.id === edited.documentId)) ||
            !!(this.linkInstances && this.linkInstances.find(link => link.id === edited.linkInstanceId)))
      ),
      distinctUntilChanged()
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.column || changes.documents || changes.linkInstances) {
      this.constraint$ = this.bindConstraint();
      this.values = this.getValues();
      this.stringValues$ = this.bindStringValue$(this.values, this.constraint$);
      this.titleValue$ = this.bindTitleValue$(this.values, this.constraint$);
    }
  }

  private bindConstraint(): Observable<Constraint> {
    if (this.documents) {
      return this.bindCollectionAttributeConstraint();
    }
    if (this.linkInstances) {
      return this.bindLinkTypeAttributeConstraint();
    }
  }

  private bindCollectionAttributeConstraint(): Observable<Constraint> {
    return this.store$.pipe(
      select(
        selectCollectionAttributeConstraint(
          this.documents && this.documents.length > 0 && this.documents[0].collectionId,
          this.column.attributeIds[0]
        )
      )
    );
  }

  private bindLinkTypeAttributeConstraint(): Observable<Constraint> {
    return this.store$.pipe(
      select(
        selectLinkTypeAttributeById(
          this.linkInstances && this.linkInstances.length > 0 && this.linkInstances[0].linkTypeId,
          this.column.attributeIds[0]
        )
      ),
      map(attribute => attribute && attribute.constraint)
    );
  }

  private bindStringValue$(values: any[], constraintObservable$: Observable<Constraint>): Observable<string[]> {
    return constraintObservable$.pipe(
      map(constraint =>
        values
          .map(value => (constraint || new UnknownConstraint()).createDataValue(value, this.constraintData).format())
          .filter(value => !!value)
      )
    );
  }

  private bindTitleValue$(values: any[], constraintObservable$: Observable<Constraint>): Observable<string> {
    return constraintObservable$.pipe(
      map(constraint =>
        values
          .map(value => (constraint || new UnknownConstraint()).createDataValue(value, this.constraintData).title())
          .filter(value => !!value)
          .join(', ')
      )
    );
  }

  private getValues(): any[] {
    return this.getData().map(data => data[this.column.attributeIds[0]]);
  }

  private getData(): any[] {
    if (this.documents) {
      return this.documents.map(document => document.data);
    }
    if (this.linkInstances) {
      return this.linkInstances.map(linkInstance => linkInstance.data);
    }
    return [];
  }

  public onExpand() {
    const cursor = {...this.cursor, rowPath: this.cursor.rowPath.slice(0, -1)};
    this.store$.dispatch(new TablesAction.ToggleLinkedRows({cursor}));
  }

  public onMouseDown() {
    if (!this.selected) {
      this.store$.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  public onContextMenu(event: MouseEvent) {
    const {x, y} = computeElementPositionInParent(event, 'table-collapsed-cell');
    this.menuComponent?.open(x, y);

    preventEvent(event);
  }
}

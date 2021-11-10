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

import {Component, ChangeDetectionStrategy, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import {FormConfig, FormSection} from '../../../../../core/store/form/form-model';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {ConstraintData, DataValue} from '@lumeer/data-filters';
import {AppState} from '../../../../../core/store/app.state';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../../../core/store/constraint-data/constraint-data.state';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {DataResourceData} from '../../../../../core/model/resource';
import {objectChanged} from '../../../../../shared/utils/common.utils';
import {map, take} from 'rxjs/operators';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';

@Component({
  selector: 'form-view',
  templateUrl: './form-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormViewComponent implements OnInit, OnChanges {
  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  public constraintData$: Observable<ConstraintData>;
  public document$: Observable<DocumentModel>;

  public selectedDocument$ = new BehaviorSubject<DocumentModel>(null);
  public data$ = new BehaviorSubject<DataResourceData>({});

  public performingAction$ = new BehaviorSubject(false);

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.collection)) {
      this.observeDocument();
    }
  }

  private observeDocument() {
    this.document$ = combineLatest([this.selectedDocument$, this.data$]).pipe(
      map(([document, data]) => {
        if (document) {
          return {...document, data};
        }

        return {id: null, data, collectionId: this.collection.id};
      })
    );
  }

  public onAttributeValueChange(data: {attributeId: string; dataValue: DataValue}) {
    const newData = {...this.data$.value, [data.attributeId]: data.dataValue.serialize()};

    this.data$.next(newData);
  }

  public trackBySection(index: number, section: FormSection): string {
    return section.id;
  }

  public onSubmit() {
    this.document$.pipe(take(1)).subscribe(document => this.submit(document));
  }

  private submit(document: DocumentModel) {
    this.performingAction$.next(true);

    if (document.id) {
      this.updateDocument(document);
    } else {
      this.createDocument(document);
    }
  }

  private createDocument(document: DocumentModel) {
    this.store$.dispatch(
      new DocumentsAction.Create({
        document,
        onSuccess: () => {
          this.data$.next({});
          this.performingAction$.next(false);
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private updateDocument(document: DocumentModel) {
    this.store$.dispatch(
      new DocumentsAction.UpdateData({
        document,
        onSuccess: () => {
          this.data$.next({});
          this.performingAction$.next(false);
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }
}

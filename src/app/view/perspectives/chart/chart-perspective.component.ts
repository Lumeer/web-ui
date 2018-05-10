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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppState} from '../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {selectDocumentsByQuery} from '../../../core/store/documents/documents.state';
import {Subscription} from 'rxjs/Subscription';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {AxisSelectModel} from './model/axis-select-model';
import {animate, style, transition, trigger} from '@angular/animations';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {selectCollectionsByQuery} from '../../../core/store/collections/collections.state';
import {CollectionModel} from '../../../core/store/collections/collection.model';

@Component({
  selector: 'chart-perspective',
  templateUrl: './chart-perspective.component.html',
  styleUrls: ['./chart-perspective.component.scss'],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({width: 0}),
        animate(200, style({width: '*'}))
      ]),
      transition(':leave', [
        animate(200, style({width: 0}))
      ])
    ])
  ]
})
export class ChartPerspectiveComponent implements OnInit, OnDestroy {

  private documents: DocumentModel[];

  private collections: CollectionModel[];

  public axisSelectModel: AxisSelectModel[];

  private subscriptions: Subscription;

  public attributeX: string;

  public attributeY: string;

  public chartHovered: boolean;

  public pickerHovered: boolean;

  private query: QueryModel;

  constructor(private store: Store<AppState>,
              private i18n: I18n) {
  }

  public ngOnInit() {
    this.subscribeOnData();
  }

  private subscribeOnData() {
    const navigationSubscription = this.navigationSubscription();
    const dataSubscription = this.dataSubscription();

    this.subscriptions = navigationSubscription;
    this.subscriptions.add(dataSubscription);
  }

  private navigationSubscription() {
    return this.store.select(selectNavigation).subscribe(navigation => {
      if (this.validWorkspace(navigation.workspace)) {
        this.getData(navigation.query);
        this.query = navigation.query;
      }
    });
  }

  private validWorkspace(workspace: Workspace): boolean {
    return Boolean(workspace && workspace.organizationCode && workspace.projectCode);
  }

  private getData(query: QueryModel) {
    this.store.dispatch(new DocumentsAction.Get({query}));
  }

  private dataSubscription() {
    return Observable.combineLatest(this.store.select(selectDocumentsByQuery),
      this.store.select(selectCollectionsByQuery)
    ).subscribe(([documents, collections]) => {
      this.documents = documents;
      this.collections = collections;
      this.axisSelectModel = collections.reduce((acc, collection) => {
        return acc.concat(collection.attributes.map(attr => ({attributeId: attr.id, attributeName: attr.name, collectionIcon: collection.icon})));
      }, []);
    });
  }

  public xAxisTitle(): string {
    return this.i18n({id: 'chart.axis.x.name', value: 'X Axis'});
  }

  public yAxisTitle(): string {
    return this.i18n({id: 'chart.axis.y.name', value: 'Y Axis'});
  }

  public isDisplayable(): boolean {
    return this.query && this.query.collectionIds && this.query.collectionIds.length === 1;
  }

  public ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

}

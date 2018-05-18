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

import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';

import {Store} from '@ngrx/store';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../../../core/store/app.state';
import {KeyCode} from '../../../../shared/key-code';
import {Role} from '../../../../core/model/role';
import {PostItLayout} from '../../../../shared/utils/layout/post-it-layout';
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import {NavigationHelper} from '../util/navigation-helper';
import {SelectionHelper} from '../util/selection-helper';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {PostItRow} from './post-it-row';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {debounceTime, filter} from 'rxjs/operators';
import {CorrelationIdGenerator} from '../../../../core/store/correlation-id.generator';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() public postItModel: PostItDocumentModel;
  @Input() public collection: CollectionModel;
  @Input() public collectionRoles: string[];
  @Input() public perspectiveId: string;
  @Input() public layoutManager: PostItLayout;
  @Input() public navigationHelper: NavigationHelper;
  @Input() public selectionHelper: SelectionHelper;

  @Output() public remove = new EventEmitter();
  @Output() public changes = new EventEmitter<DocumentModel>();
  @Output() public favoriteChange = new EventEmitter<{ favorite: boolean, onlyStore: boolean }>();

  @ViewChild('content') public content: ElementRef;

  private postItRows: PostItRow[] = [];
  private postItNewRow: PostItRow = {attributeName: '', value: ''};
  private postItChange$ = new Subject<any>();
  private postItChangeSubscription: Subscription;

  private lastSyncedFavorite: boolean;
  private favoriteChange$ = new Subject<boolean>();
  private favoriteChangeSubscription: Subscription;

  constructor(private store: Store<AppState>,
              private element: ElementRef) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.pairAttributes()
    }
    if (changes.postItModel) {
      this.constructRows();
    }
    this.postItModel.numRows = this.postItRows.length;
  }

  public ngOnInit(): void {
    this.disableScrollOnNavigation();
    this.initFavoriteSubscription();
  }

  public ngOnDestroy(): void {
    if (this.postItChangeSubscription) {
      this.postItChangeSubscription.unsubscribe();
    }
    this.layoutManager.remove(this.element.nativeElement);
  }

  public ngAfterViewInit(): void {
    this.layoutManager.add(this.element.nativeElement);
  }

  private disableScrollOnNavigation(): void {
    const capture = false;
    const scrollKeys = [KeyCode.UpArrow, KeyCode.DownArrow];

    this.content.nativeElement.addEventListener('keydown', (key: KeyboardEvent) => {
      if (scrollKeys.includes(key.keyCode)) {
        key.preventDefault();
      }
    }, capture);
  }

  public clickOnAttributePair(column: number, row: number): void {
    this.selectionHelper.setEditMode(false);
    this.selectionHelper.select(column, row, this.postItModel);
  }

  public onEnterKeyPressedInEditMode(): void {
    this.selectionHelper.selectNext(this.postItModel);
  }

  public createAttributePair(): void {
    const selectedAttribute = this.findAttributeByName(this.postItNewRow.attributeName);

    if (selectedAttribute) {
      if (this.isAttributeUsed(selectedAttribute.id)) {
        return;
      }

      this.postItRows.push({...this.postItNewRow, attributeId: selectedAttribute.id});
    } else {
      this.postItRows.push({...this.postItNewRow, correlationId: CorrelationIdGenerator.generate()});
    }

    this.postItModel.numRows = this.postItRows.length;

    this.postItNewRow = {attributeName: '', value: ''};
    this.onChange();

    setTimeout(() => {
      this.selectionHelper.select(1, this.postItRows.length, this.postItModel);
    });
  }

  public onUpdateAttribute(selectedRow: number): void {
    const data = this.postItRows[selectedRow];
    if (!data) {
      return;
    }

    this.onChange();

    data.attributeName = data.attributeName.trim();
    if (!data.attributeName) {
      this.removeRow(selectedRow);
      return;
    }

    const selectedAttribute = this.findAttributeByName(data.attributeName);
    if (data.attributeId && selectedAttribute && selectedAttribute.id !== data.attributeId && this.isAttributeUsed(selectedAttribute.id)) {
      const previousAttribute = this.findAttributeById(data.attributeId);
      data.attributeName = previousAttribute.name;
    } else {
      data.attributeId = selectedAttribute && selectedAttribute.id || null;
      if (isNullOrUndefined(data.attributeId) && isNullOrUndefined(data.correlationId)) {
        data.correlationId = CorrelationIdGenerator.generate();
      }
    }
  }

  public updateValue(selectedRow: number): void {
    const data = this.postItRows[selectedRow];
    if (!data) {
      return;
    }

    data.value = data.value.trim();
    this.onChange();
  }

  public toggleFavorite() {
    if (isNullOrUndefined(this.lastSyncedFavorite)) {
      this.lastSyncedFavorite = this.postItModel.document.favorite;
    }

    const value = !this.postItModel.document.favorite;
    this.favoriteChange$.next(value);
    this.favoriteChange.emit({favorite: value, onlyStore: true});
  }

  public onRemove(): void {
    if (this.postItChangeSubscription) {
      this.postItChangeSubscription.unsubscribe();
      this.postItChangeSubscription = null;
    }

    this.remove.emit();
  }

  public removeRow(selectedRow: number) {
    this.postItRows.splice(selectedRow, 1);

    this.postItModel.numRows = this.postItRows.length;

    setTimeout(() => {
      this.selectionHelper.select(
        this.selectionHelper.selection.column,
        this.selectionHelper.selection.row - 1,
        this.postItModel
      );
    });

    if (this.postItRows.length === 0) {
      this.onRemove();
    }
  }

  public removeValue(selectedRow: number) {
    this.postItRows[selectedRow].value = '';
  }

  public unusedAttributes(): AttributeModel[] {
    return this.collection.attributes.filter(attribute => {
      return isNullOrUndefined(this.postItRows.find(d => d.attributeId === attribute.id));
    });
  }

  public findAttributeByName(name: string): AttributeModel {
    return this.collection.attributes.find(attr => attr.name === name);
  }

  public findAttributeById(id: string): AttributeModel {
    return this.collection.attributes.find(attr => attr.id === id);
  }

  public isAttributeUsed(id: string) {
    return this.postItRows.findIndex(d => d.attributeId === id) !== -1;
  }

  public suggestionListId(): string {
    return `${ this.perspectiveId }${ this.postItModel.document.id || 'uninitialized' }`;
  }

  public isDefaultAttribute(attributeId: string): boolean {
    return attributeId && attributeId === this.collection.defaultAttributeId;
  }

  public hasWriteRole(): boolean {
    return this.collectionRoles && this.collectionRoles.includes(Role.Write)
  }

  private pairAttributes() {
    if (isNullOrUndefined(this.collection)) {
      return;
    }

    this.collection.attributes.forEach(attribute => {
      const row = this.postItRows.find(row => row.correlationId && row.correlationId === attribute.correlationId);
      if (row) {
        row.attributeId = attribute.id;
        row.correlationId = null;
      }
    });
  }

  private constructRows() {
    if (isNullOrUndefined(this.postItModel)) {
      return;
    }

    Object.keys(this.postItModel.document.data).forEach(attributeId => {
      const row = this.postItRows.find(row => row.attributeId === attributeId);
      if (!row) {
        const attribute = this.findAttributeById(attributeId);
        const attributeName = attribute && attribute.name || '';
        this.postItRows.push({attributeId, attributeName, value: this.postItModel.document.data[attributeId]});
      }
    });
  }

  private onChange() {
    if (isNullOrUndefined(this.postItChangeSubscription)) {
      this.initSubscription();
    }
    this.postItChange$.next();
  }

  private initSubscription() {
    this.postItChangeSubscription = this.postItChange$.pipe(
      debounceTime(3000),
    ).subscribe(() => {
      this.changes.emit(this.createUpdateDocument());
    });
  }

  private createUpdateDocument(): DocumentModel {
    const data: { [attributeId: string]: any } = this.postItRows.filter(row => row.attributeId).reduce((acc, row) => {
      acc[row.attributeId] = row.value;
      return acc;
    }, {});


    const newData: { [attributeName: string]: any } = this.postItRows.filter(row => isNullOrUndefined(row.attributeId))
      .reduce((acc: { [attributeName: string]: any }, row) => {
        acc[row.attributeName] = {value: row.value, correlationId: row.correlationId};
        return acc;
      }, {});

    return {...this.postItModel.document, data, newData: Object.keys(newData).length > 0 ? newData : null};
  }

  private initFavoriteSubscription() {
    this.favoriteChangeSubscription = this.favoriteChange$.pipe(
      debounceTime(1000),
      filter(favorite => favorite !== this.lastSyncedFavorite)
    ).subscribe(favorite => {
      this.lastSyncedFavorite = null;
      this.favoriteChange.emit({favorite, onlyStore: false})
    });
  }
}

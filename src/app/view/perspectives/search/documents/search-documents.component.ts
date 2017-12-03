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

import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';

import {SizeType} from '../../../../shared/slider/size-type';
import {SearchService} from '../../../../core/rest/search.service';
import {Document} from '../../../../core/dto/document';
import {SearchDocument} from './search-document';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {map, switchMap} from 'rxjs/operators';
import {isArray, isObject} from 'util';
import {Subscription} from 'rxjs/Subscription';
import {UserSettingsService} from '../../../../core/user-settings.service';
import {AppState} from '../../../../core/store/app.state';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {DeprecatedQueryConverter} from '../../../../shared/utils/query-converter';

@Component({
  templateUrl: './search-documents.component.html'
})
export class SearchDocumentsComponent implements OnInit, OnDestroy {

  @ViewChild('sTemplate') sTempl: TemplateRef<any>;
  @ViewChild('mTemplate') mTempl: TemplateRef<any>;
  @ViewChild('lTemplate') lTempl: TemplateRef<any>;
  @ViewChild('xlTemplate') xlTempl: TemplateRef<any>;

  public size: SizeType;
  public documents: SearchDocument[];
  private routerSubscription: Subscription;

  constructor(private searchService: SearchService,
              private store: Store<AppState>,
              private collectionService: CollectionService,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    let userSettings = this.userSettingsService.getUserSettings();
    this.size = userSettings.searchSize ? userSettings.searchSize : SizeType.M;
    this.routerSubscription = this.store.select(selectNavigation).pipe(
      map(navigation => navigation.query),
      map(query => DeprecatedQueryConverter.removeLinksFromQuery(query)),
      switchMap(query => this.searchService.searchDocuments(query)),
    ).subscribe(documents => this.initDocuments(documents));
  }

  public ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  public onSizeChange(newSize: SizeType) {
    this.size = newSize;
    let userSettings = this.userSettingsService.getUserSettings();
    userSettings.searchSize = newSize;
    this.userSettingsService.updateUserSettings(userSettings);
  }

  public getTemplate(document: SearchDocument): TemplateRef<any> {
    if (document.opened) {
      return this.xlTempl;
    }
    switch (this.size) {
      case SizeType.S:
        return this.sTempl;
      case SizeType.M:
        return this.mTempl;
      case SizeType.L:
        return this.lTempl;
      case SizeType.XL:
        return this.xlTempl;
      default:
        return this.mTempl;
    }
  }

  public isXlTemplatePresented(): boolean {
    return this.size === SizeType.XL;
  }

  private initDocuments(documents: Document[]) {
    const codes = new Set<string>();
    this.documents = [];
    for (let document of documents) {
      delete document.data['_id'];
      this.documents.push({document: document, opened: false});
      codes.add(document.collectionCode);
    }
    codes.forEach(code => this.fetchCollection(code));
  }

  private fetchCollection(code: string) {
    this.collectionService.getCollection(code)
      .subscribe(collection => this.initCollectionsInDocuments(collection));
  }

  private initCollectionsInDocuments(collection: Collection) {
    for (let document of this.documents) {
      if (document.document.collectionCode === collection.code) {
        document.collectionName = collection.name;
        document.collectionIcon = collection.icon;
        document.collectionColor = collection.color;
      }
    }
  }

  public createDefaultAttributeHtml(document: SearchDocument): string {
    const data = document.document.data;
    return this.valueHtml(Object.values(data)[0]);
  }

  public toggleDocument(document: SearchDocument) {
    document.opened = !document.opened;
  }

  public onLinkClick(document: SearchDocument) {
    // TODO
  }

  public onCommentClick(document: SearchDocument) {
    // TODO
  }

  public onDetailClick(document: SearchDocument) {
    // TODO
  }

  public createValuesHtml(document: SearchDocument): string {
    const values: string[] = this.getValues(document);
    let html = '';
    for (let i = 0; i < values.length; i++) {
      html += `<b>${values[i]}</b>`;
      if (i != values.length - 1) {
        html += ', ';
      }
    }
    return html;
  }

  private getValues(document: SearchDocument): string[] {
    return this.getValuesFromArray(Object.values(document.document.data));
  }

  private getValuesFromAny(value: any): string[] | string {
    if (isArray(value)) {
      return this.getValuesFromArray(value as any[]);
    } else if (isObject(value)) {
      return this.getValuesFromObject(value as Object);
    } else {
      return value as string;
    }
  }

  private getValuesFromArray(array: any[]): string[] {
    let values: string[] = [];
    for (let value of array) {
      values = values.concat(this.getValuesFromAny(value));
    }
    return values;
  }

  private getValuesFromObject(object: Object): string[] {
    return this.getValuesFromArray(Object.values(object));
  }

  public createEntriesHtml(document: SearchDocument) {
    return this.entriesHtml(this.getEntriesForObject(document.document.data));
  }

  private getEntriesForObject(object: any): { key: string, value: any }[] {
    return Object.keys(object).map(key => {
      return {key: key, value: object[key]};
    });
  }

  private entriesHtml(entries: { key: string, value: any }[]): string {
    let html = '';
    for (let i = 0; i < entries.length; i++) {
      html += `<i>${entries[i].key}</i>: `;
      html += this.valueHtml(entries[i].value);
      if (i != entries.length - 1) {
        html += ', ';
      }
    }
    return html;
  }

  private valueHtml(value: any): string {
    if (isArray(value)) {
      return `[${this.arrayHtml(value as any[])}]`;
    } else if (isObject(value)) {
      return `{${this.entriesHtml(this.getEntriesForObject(value))}}`;
    } else {
      return `<b>${value.toString()}</b>`;
    }
  }

  private arrayHtml(array: any[]): string {
    let html = '';
    for (let i = 0; i < array.length; i++) {
      html += this.valueHtml(array[i]);
      if (i != array.length - 1) {
        html += ', ';
      }
    }
    return html;
  }

}

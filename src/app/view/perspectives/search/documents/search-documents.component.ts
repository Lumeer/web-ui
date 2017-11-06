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

import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {SizeType} from '../../../../shared/slider/size-type';
import {SearchService} from '../../../../core/rest/search.service';
import {Document} from '../../../../core/dto/document';
import {SearchDocument} from './search-document';
import {CollectionService} from '../../../../core/rest/collection.service';
import {Collection} from '../../../../core/dto/collection';
import {map, switchMap} from 'rxjs/operators';

@Component({
  templateUrl: './search-documents.component.html',
  styleUrls: ['./search-documents.component.scss']
})
export class SearchDocumentsComponent implements OnInit {

  @ViewChild('xsTemplate') xsTempl: TemplateRef<any>;
  @ViewChild('sTemplate') sTempl: TemplateRef<any>;
  @ViewChild('mTemplate') mTempl: TemplateRef<any>;
  @ViewChild('lTemplate') lTempl: TemplateRef<any>;
  @ViewChild('xlTemplate') xlTempl: TemplateRef<any>;

  public size: SizeType = SizeType.M;
  public documents: SearchDocument[] = [];

  constructor(private route: ActivatedRoute,
              private searchService: SearchService,
              private collectionService: CollectionService) {
  }

  public ngOnInit() {
    this.route.queryParamMap.pipe(
      map(paramMap => JSON.parse(paramMap.get('query'))),
      switchMap(query => this.searchService.searchDocuments(query)),
    ).subscribe(documents => this.initDocuments(documents));
  }

  public onSizeChange(newSize: SizeType) {
    this.size = newSize;
  }

  public getTemplate(document: SearchDocument): TemplateRef<any> {
    if (document.opened) {
      return this.xlTempl;
    }
    switch (this.size) {
      case SizeType.XS:
        return this.xsTempl;
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

  private initDocuments(documents: Document[]) {
    const codes = new Set<string>();
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

  public getDefaultAttribute(document: SearchDocument) {
    const data = document.document.data;
    return Object.values(data)[0];
  }

  public toggleDocument(document: SearchDocument) {
    document.opened = !document.opened;
  }

  public onLinkClicked(document: SearchDocument) {
    // TODO
  }

  public onCommentClicked(document: SearchDocument) {
    // TODO
  }

  public onDetailClicked(document: SearchDocument) {
    // TODO
  }

  public getValues(document: SearchDocument): string[]{
    return Object.values(document.document.data);
  }

}

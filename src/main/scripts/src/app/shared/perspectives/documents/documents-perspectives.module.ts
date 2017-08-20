/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';

import {Ng2CompleterModule} from 'ng2-completer';

import {PostItDocumentsPerspectiveComponent} from './post-it/post-it-documents-perspective.component';
import {PostItAddDocumentComponent} from './post-it/document-layout/add-document/add-document.component';
import {PostItDocumentComponent} from './post-it/document-layout/document/post-it-document.component';
import {AttributeListComponent} from './post-it/document-layout/document/attribute-list/attribute-list.component';
import {TableDocumentsPerspectiveComponent} from './table/table-documents-perspective.component';
import {PostItDocumentLayoutComponent} from './post-it/document-layout/post-it-document-layout.component';
import {LayoutItemDirective} from './post-it/document-layout/layout-item.directive';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    Ng2CompleterModule
  ],
  declarations: [
    PostItDocumentsPerspectiveComponent,
    PostItDocumentLayoutComponent,
    LayoutItemDirective,
    PostItAddDocumentComponent,
    PostItDocumentComponent,
    AttributeListComponent,
    TableDocumentsPerspectiveComponent
  ],
  entryComponents: [
    PostItDocumentsPerspectiveComponent,
    TableDocumentsPerspectiveComponent
  ]
})
export class DocumentsPerspectivesModule {

}

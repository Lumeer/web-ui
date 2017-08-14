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

import {PostItDocumentsPerspectiveComponent} from './post-it/post-it-documents-perspective.component';
import {PostItAddDocumentComponent} from './post-it/add-document/add-document.component';
import {PostItDocumentComponent} from './post-it/document/post-it-document.component';
import {AttributeTreeComponent} from './post-it/attribute-tree/attribute-tree.component';
import {TableDocumentsPerspectiveComponent} from './table/table-documents-perspective.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule
  ],
  declarations: [
    PostItDocumentsPerspectiveComponent,
    PostItAddDocumentComponent,
    PostItDocumentComponent,
    AttributeTreeComponent,
    TableDocumentsPerspectiveComponent
  ],
  entryComponents: [
    PostItDocumentsPerspectiveComponent,
    TableDocumentsPerspectiveComponent
  ]
})
export class DocumentsPerspectivesModule {

}

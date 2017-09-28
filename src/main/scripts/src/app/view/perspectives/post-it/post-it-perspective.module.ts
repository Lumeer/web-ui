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
import {SharedModule} from '../../../shared/shared.module';
import {PostItPerspectiveComponent} from './post-it-perspective.component';
import {PostItAddDocumentComponent} from './add-document/add-document.component';
import {PostItDocumentComponent} from './document/post-it-document.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    PostItAddDocumentComponent,
    PostItDocumentComponent,
    PostItPerspectiveComponent
  ],
  entryComponents: [
    PostItPerspectiveComponent
  ],
  exports: [
    PostItPerspectiveComponent
  ]
})
export class PostItPerspectiveModule {

}

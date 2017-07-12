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

import {Type} from '@angular/core';
import {isNullOrUndefined} from 'util';

import {TableDocumentsPerspectiveComponent} from './table/table-documents-perspective.component';
import {PostItDocumentsPerspectiveComponent} from './post-it/post-it-documents-perspective.component';

export class DocumentsPerspective {

  public static PostIt = new DocumentsPerspective('Post-it', PostItDocumentsPerspectiveComponent);
  public static Table = new DocumentsPerspective('Table', TableDocumentsPerspectiveComponent);

  public static perspectives = {
    ['postit']: DocumentsPerspective.PostIt,
    ['table']: DocumentsPerspective.Table
  };

  public static defaultPerspective = DocumentsPerspective.PostIt;

  public static getPerspective(perspectiveId: string): DocumentsPerspective {
    if (isNullOrUndefined(perspectiveId)) {
      return DocumentsPerspective.defaultPerspective;
    }
    let perspective = DocumentsPerspective.perspectives[perspectiveId.toLowerCase()];
    return !isNullOrUndefined(perspective) ? perspective : DocumentsPerspective.defaultPerspective;
  }

  private constructor(public name: string, public component: Type<any>) {
  }

}

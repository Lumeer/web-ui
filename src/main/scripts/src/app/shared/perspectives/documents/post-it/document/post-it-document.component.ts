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

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Collection} from '../../../../../core/dto/collection';
import {Document} from '../../../../../core/dto/document';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent {

  @Input()
  public collection: Collection;

  @Input()
  public document: Document;

  @Input()
  public editable: boolean;

  @Output()
  public onDelete: EventEmitter<any> = new EventEmitter();

  @Output()
  public newAttributePreview: EventEmitter<object> = new EventEmitter();

  public onRemoveDocumentClick(): void {
    if (confirm('Deleting a document is irreversable. Delete anyway?')) {
      this.onDelete.emit();
    }
  }

}

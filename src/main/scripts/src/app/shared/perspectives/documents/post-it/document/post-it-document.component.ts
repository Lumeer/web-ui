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
import {Attribute} from '../../../../../core/dto/attribute';
import {AttributePair} from '../document-attribute';
import {AttributePropertyInput} from '../attribute-list/attribute-property-input';

@Component({
  selector: 'post-it-document',
  templateUrl: './post-it-document.component.html',
  styleUrls: ['./post-it-document.component.scss']
})
export class PostItDocumentComponent {

  @Input()
  public index: number;

  @Input()
  public attributes: Attribute[];

  @Input()
  public collection: Collection;

  @Input()
  public document: Document;

  @Input()
  public editable: boolean;

  @Input()
  public selectedInput: AttributePropertyInput;

  @Output()
  public removed = new EventEmitter();

  @Output()
  public attributePairChange = new EventEmitter<AttributePair>();

  public onRemoveDocumentClick(): void {
    let BootstrapDialog = window['BootstrapDialog'];

    BootstrapDialog.show({
      type: 'type-success',
      title: 'Delete Document?',
      message: 'Deleting a document will permamently remove it from this collection.',
      buttons: [
        {
          label: 'No, Keep Document',
          action: dialog => dialog.close()
        },
        {
          label: 'Yes, Delete Document',
          cssClass: 'btn-success',
          hotkey: 13, // Enter
          action: dialog => {
            this.removed.emit();
            dialog.close();
          }
        }
      ]
    });
  }

}

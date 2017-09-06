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

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {Document} from '../../../../../core/dto/document';

@Component({
  selector: 'add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss']
})
export class PostItAddDocumentComponent implements OnInit {

  @Output()
  public newDocument = new EventEmitter<Document>();

  private collectionCode: string;

  constructor(private route: ActivatedRoute) {
  }

  public ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => this.collectionCode = paramMap.get('collectionCode'));
  }

  public onClick(): void {
    const newDocument = new Document;
    newDocument.collectionCode = this.collectionCode;

    this.newDocument.emit(newDocument);
  }

}

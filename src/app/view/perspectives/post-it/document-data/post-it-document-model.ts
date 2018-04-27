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

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {isNullOrUndefined} from "util";
import {ATTRIBUTE_COLUMN, VALUE_COLUMN} from "../util/selection-helper";
import {HashCodeGenerator} from "../../../../shared/utils/hash-code-generator";

export class PostItDocumentModel {

  public index: number;
  public document: DocumentModel;

  public updating = false;
  public initialized: boolean;

  public preferredColumn(): number {
    const attributes = Object.keys(this.document.data);
    if (attributes.length === 0) {
      return ATTRIBUTE_COLUMN;
    }

    return VALUE_COLUMN;
  }

  public inInitialState(): boolean {
    const isUninitialized = !this.initialized;
    const hasInitialAttributes = Object.keys(this.document.data).length === this.document.collection.attributes.length;
    const hasInitialValues = Object.values(this.document.data).every(value => value === '');

    return isUninitialized && hasInitialAttributes && hasInitialValues;
  }

  public hasDocument(document: DocumentModel): boolean {
    return this.document.id === document.id
  }

  public withIndex(index: number): PostItDocumentModel {
    this.index = index;
    return this;
  }

  public hash(): number {
    return HashCodeGenerator.hashString(this.document.correlationId || this.document.id);
  }

}

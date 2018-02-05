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

import {DeltaOperation} from 'quill';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {SmartDocModel, SmartDocPartModel, SmartDocPartType} from '../../../core/store/smartdoc/smartdoc.model';

export class SmartDocUtils {

  public static findInnerSmartDoc(root: SmartDocModel, path: number[]): SmartDocModel {
    if (!root || path.length === 0) {
      return root;
    }

    const smartDoc = root.parts[path[0]].smartDoc;
    return SmartDocUtils.findInnerSmartDoc(smartDoc, path.slice(1));
  }

  public static pathToString(path: number[]): string {
    return path.join('-');
  }

  public static isValidEmbeddedPart(part: SmartDocPartModel) {
    return part && part.linkTypeId && part.perspective;
  }

  public static createInitialTextPart(collection: CollectionModel): SmartDocPartModel {
    return {
      type: SmartDocPartType.Text,
      textData: SmartDocUtils.createInitialTextData(collection)
    };
  }

  private static createInitialTextData(collection: CollectionModel): any {
    const ops: DeltaOperation[] = collection.attributes.reduce<DeltaOperation[]>((ops, attribute) => {
      return ops.concat({insert: attribute.name + ': '}, {insert: {attribute: {id: attribute.id}}}, {insert: '\n'});
    }, []);
    return {ops};
  }

  public static createEmptyTextPart(): SmartDocPartModel {
    const delta = {
      ops: [
        {insert: 'Insert your text here...'} // TODO translate somehow
      ]
    };

    return {
      type: SmartDocPartType.Text,
      textData: delta
    };
  }

}

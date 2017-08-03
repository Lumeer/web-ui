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

export class Document {

  public _id: string;
  public creation_date: string;
  public created_by: string;
  public version: number;
  public data: object = {};

  public edited?: boolean;
  public underCursor?: boolean;

  constructor(documentJson?: object) {
    if (documentJson) {

      Object.keys(documentJson)
        .forEach(attribute => {
          switch (attribute) {
            case '_id':
              this._id = documentJson['_id'];
              break;
            case '_meta-create-date':
              this.creation_date = documentJson['_meta-create-date'];
              break;
            case '_meta-create-user':
              this.created_by = documentJson['_meta-create-user'];
              break;
            case '_meta-version':
              this.version = documentJson['_meta-version'];
              break;
            default:
              this.data[attribute] = documentJson[attribute];
          }
        });
    }
  }

  public toDto(): object {
    let result = {};

    result['_id'] = this._id;
    result['_meta-create-date'] = this.creation_date;
    result['_meta-create-user'] = this.created_by;
    result['_meta-version'] = this.version;

    Object.keys(this.data)
      .forEach(attribute => result[attribute] = this.data[attribute]);

    return result;
  }

}

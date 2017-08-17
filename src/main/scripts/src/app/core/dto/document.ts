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

  public id: string;
  public creationDate: string;
  public updateDate: string;
  public createdBy: string;
  public updatedBy: string;
  public version: number;
  public data: object = {};

  constructor(documentJson?: object) {
    if (documentJson) {

      Object.keys(documentJson)
        .forEach(attribute => {
          switch (attribute) {
            case '_id':
              this.id = documentJson['_id'];
              break;
            case '_meta-create-date':
              this.creationDate = documentJson['_meta-create-date'];
              break;
            case '_meta-create-user':
              this.createdBy = documentJson['_meta-create-user'];
              break;
            case '_meta-version':
              this.version = documentJson['_meta-version'];
              break;
            case '_meta-update-date':
              this.updateDate = documentJson['_meta-update-date'];
              break;
            case '_meta-update-user':
              this.updatedBy = documentJson['_meta-update-user'];
              break;
            default:
              this.data[attribute] = documentJson[attribute];
          }
        });
    }
  }

  public toDto(): object {
    let result = {};

    this.id && (result['_id'] = this.id);
    this.creationDate && (result['_meta-create-date'] = this.creationDate);
    this.createdBy && (result['_meta-create-user'] = this.createdBy);
    this.version && (result['_meta-version'] = this.version);
    this.updateDate && (result['_meta-update-date'] = this.updateDate);
    this.updatedBy && (result['_meta-update-user'] = this.updatedBy);

    Object.keys(this.data)
      .forEach(attribute => result[attribute] = this.data[attribute]);

    return result;
  }

}

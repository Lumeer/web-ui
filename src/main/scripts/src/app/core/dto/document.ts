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
  public createdBy: string;
  public version: number;
  public attributes: object[] = [];
  public edited: boolean = false;
  public underCursor: boolean;

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
            default:
              this.put(attribute, documentJson[attribute]);
          }
        });
    }
  }

  public put(key: any, value: any) {
    let newAttributeObject = {};
    newAttributeObject[key] = value;

    this.attributes.push(newAttributeObject);
  }

  public toDto(): object {
    let result = {};

    result['_id'] = this.id;
    result['_meta-create-date'] = this.creationDate;
    result['_meta-create-user'] = this.createdBy;
    result['_meta-version'] = this.version;

    this.attributes.forEach(attributeObject => {
      Object.keys(attributeObject)
        .forEach(key => result[key] = attributeObject[key]);
    });

    return result;
  }

}

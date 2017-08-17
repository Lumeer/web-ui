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

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {WorkspaceService} from '../workspace.service';
import {Document} from '../dto/document';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class DocumentService {

  constructor(private http: HttpClient, private workspaceService: WorkspaceService) {
  }

  public getDocuments(collectionCode: string): Observable<Document[]> {
    return this.http.get(this.apiPrefix(collectionCode))
      .map((jsonDocuments: object[]) => jsonDocuments.map(json => new Document(json)));
  }

  public getDocument(collectionCode: string, documentId: string): Observable<Document> {
    return this.http.get(`${this.apiPrefix(collectionCode)}/${documentId}`)
      .map((json: object) => new Document(json));
  }

  public createDocument(collectionCode: string, document: Document): void {
    this.http.post(this.apiPrefix(collectionCode), document.toDto())
      .subscribe((json: object) => document.id = json['_id']);
  }

  public updateDocument(collectionCode: string, document: Document): void {
    this.http.put(`${this.apiPrefix(collectionCode)}`, document.toDto())
      .subscribe();
  }

  public removeDocument(collectionCode: string, document: Document): void {
    this.http.delete(`${this.apiPrefix(collectionCode)}/${document.id}`)
      .subscribe();
  }

  private apiPrefix(collection: string): string {
    let organization = this.workspaceService.organizationCode;
    let project = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organization}/projects/${project}/collections/${collection}/documents`;
  }

}

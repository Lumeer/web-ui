import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import {WorkspaceService} from '../workspace.service';
import {Suggestions} from '../dto/suggestions';
import {Query} from '../dto/query';
import {Collection} from '../dto/collection';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {Document} from '../dto/document';
import {View} from '../dto/view';
import {SuggestionType} from '../dto/suggestion-type';

@Injectable()
export class SearchService {

  constructor(private http: HttpClient, private workspaceService: WorkspaceService) {
  }

  public suggest(text: string, type: SuggestionType): Observable<Suggestions> {
    return this.http.get<Suggestions>(`${this.searchPath()}/suggestions`,
      {params: new HttpParams().set('text', text).set('type', type)});
  }

  public searchCollections(query: Query): Observable<Collection[]> {
    return this.http.post<Collection[]>(`${this.searchPath()}/collections`, query)
      .catch(SearchService.handleError);
  }

  public searchDocuments(query: Query): Observable<Document[]> {
    return this.http.post<Document[]>(`${this.searchPath()}/documents`, query)
      .catch(SearchService.handleError);
  }

  public searchViews(query: Query): Observable<View[]> {
    return this.http.post<View[]>(`${this.searchPath()}/views`, query)
      .catch(SearchService.handleError);
  }

  private searchPath(): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/search`;
  }

  private static handleError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}

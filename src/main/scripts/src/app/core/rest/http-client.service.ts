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
import {Http, Headers, RequestOptions, Response, Request, RequestOptionsArgs} from '@angular/http';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class HttpClient {

  constructor(private http: Http) {
  }

  public get(url: string, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.get(url, requestOptions)
      .catch(HttpClient.handleError);
  }

  public post(url: string, body: any, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.post(url, body, requestOptions ? HttpClient.appendContentType(requestOptions) : HttpClient.emptyOptions())
      .catch(HttpClient.handleError);
  }

  public put(url: string, body: any, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.put(url, body, requestOptions ? HttpClient.appendContentType(requestOptions) : HttpClient.emptyOptions())
      .catch(HttpClient.handleError);
  }

  public delete(url: string, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.delete(url, requestOptions)
      .catch(HttpClient.handleError);
  }

  public head(url: string, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.head(url, requestOptions)
      .catch(HttpClient.handleError);
  }

  public patch(url: string, body: any, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.patch(url, body, requestOptions ? HttpClient.appendContentType(requestOptions) : HttpClient.emptyOptions())
      .catch(HttpClient.handleError);
  }

  public request(url: string | Request, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.request(url, requestOptions)
      .catch(HttpClient.handleError);
  }

  private static emptyOptions() {
    let headers = new Headers({'Content-Type': 'application/json'});
    return new RequestOptions({headers: headers});
  }

  private static appendContentType(requestOptions: RequestOptionsArgs) {
    if (requestOptions.headers) {
      if (!requestOptions.headers.has('Content-Type')) {
        requestOptions.headers.append('Content-Type', 'application/json');
      }
    } else {
      requestOptions.headers = new Headers({'Content-Type': 'application/json'});
    }
    return requestOptions;
  }

  private static handleError(error: Response | any) {
    // In a real world app, you might use a remote logging infrastructure
    let errMsg: string;
    if (error instanceof Response) {
      errMsg = `${error.statusText || 'Error!'}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

}

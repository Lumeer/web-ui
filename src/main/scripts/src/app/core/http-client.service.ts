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

@Injectable()
export class HttpClient {

  constructor(private http: Http) {
  }

  public get(url: string, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.get(url, requestOptions);
  }

  public post(url: string, body: any, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.post(url, body, requestOptions ? requestOptions : HttpClient.options());
  }

  public put(url: string, body: any, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.put(url, body, requestOptions ? requestOptions : HttpClient.options());
  }

  public delete(url: string, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.delete(url, requestOptions);
  }

  public head(url: string, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.head(url, requestOptions);
  }

  public patch(url: string, body: any, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.patch(url, body, requestOptions ? requestOptions : HttpClient.options());
  }

  public request(url: string | Request, requestOptions?: RequestOptionsArgs): Observable<Response> {
    return this.http.request(url, requestOptions);
  }

  private static options() {
    let headers = new Headers({'Content-Type': 'application/json'});
    return new RequestOptions({headers: headers});
  }

}

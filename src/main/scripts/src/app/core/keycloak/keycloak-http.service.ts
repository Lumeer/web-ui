import {Injectable} from '@angular/core';

import {KeycloakService} from './keycloak.service';
import {Observable} from 'rxjs';
import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';

@Injectable()
export class KeycloakInterceptor implements HttpInterceptor {
  constructor(private _keycloakService: KeycloakService) {
  }
  public intercept (req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const tokenPromise: Promise<string> = this._keycloakService.getToken();
    const tokenObservable: Observable<string> = Observable.fromPromise(tokenPromise);

    return tokenObservable.map(token => {
      return req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }).concatMap(request => next.handle(request));
  }
}

export const KEYCLOAK_HTTP_PROVIDER = {
  provide: HTTP_INTERCEPTORS,
  useClass: KeycloakInterceptor,
  multi: true
};

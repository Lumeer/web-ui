import {Injectable} from '@angular/core';

declare var Keycloak: any;

@Injectable()
export class KeycloakService {
  public static auth: any = {};

  public static init(): Promise<any> {
    let keycloakAuth: any = new Keycloak('keycloak.json');
    KeycloakService.auth.loggedIn = false;

    return new Promise((resolve, reject) => {
      keycloakAuth.init({ onLoad: 'login-required' })
        .success(() => {
          KeycloakService.auth.loggedIn = true;
          KeycloakService.auth.authz = keycloakAuth;
          KeycloakService.auth.logoutUrl = keycloakAuth.authServerUrl +
            '/realms/demo/protocol/openid-connect/logout?redirect_uri=/';
          resolve();
        })
        .error(() => {
          reject();
        });
    });
  }

  public logout() {
    KeycloakService.auth.loggedIn = false;
    KeycloakService.auth.authz = null;

    window.location.href = KeycloakService.auth.logoutUrl;
  }

  public getToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (KeycloakService.auth.authz.token) {
        KeycloakService.auth.authz.updateToken(5)
          .success(() => {
            resolve(<string>KeycloakService.auth.authz.token);
          })
          .error(() => {
            reject('Failed to refresh token');
          });
      }
    });
  }
}

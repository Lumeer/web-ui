import {Injectable} from '@angular/core';

declare var Keycloak: any;

export const KEYCLOAK_CONFIG = {
  realm: 'demo',
  clientId: 'lumeer',
  url: 'http://localhost:8080/auth'
};

@Injectable()
export class KeycloakService {
  public static auth: any = {};

  public static init(): Promise<any> {
    let kcSetting = require('../../../webapp/WEB-INF/keycloak.json');
    kcSetting.url = kcSetting['auth-server-url'];
    kcSetting.clientId = kcSetting.resource;
    let keycloakAuth: any = new Keycloak(kcSetting);
    KeycloakService.auth.loggedIn = false;

    return new Promise((resolve, reject) => {
      keycloakAuth.init({ onLoad: 'login-required' })
        .success(() => {
          KeycloakService.auth.loggedIn = true;
          KeycloakService.auth.authz = keycloakAuth;
          KeycloakService.auth.logoutUrl = keycloakAuth.authServerUrl +
            `/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout?redirect_uri=/`;
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

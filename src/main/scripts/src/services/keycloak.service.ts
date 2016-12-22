import {Injectable} from '@angular/core';

declare let Keycloak: any;

@Injectable()
export class KeycloakService {
  public static auth: any = {};

  public static init(): Promise<any> {
    let kcSetting = require('../../../webapp/WEB-INF/keycloak.json');
    kcSetting.url = kcSetting['auth-server-url'];
    kcSetting.clientId = kcSetting.resource;
    let keycloakAuth: any = new Keycloak(kcSetting);
    KeycloakService.auth.loggedIn = false;
    KeycloakService.auth.isDisabled = kcSetting.disabled;

    return new Promise((resolve, reject) => {
      if (kcSetting.disabled) {
        reject();
      } else {
        keycloakAuth.init({ onLoad: 'login-required' })
          .success(() => {
            KeycloakService.auth.loggedIn = true;
            KeycloakService.auth.authz = keycloakAuth;
            KeycloakService.auth.logoutUrl = keycloakAuth.authServerUrl +
              `/realms/${kcSetting.realm}/protocol/openid-connect/logout?redirect_uri=/`;
            resolve();
          })
          .catch(() => {
            reject();
          });
      }
    });
  }

  public logout() {
    KeycloakService.auth.loggedIn = false;
    KeycloakService.auth.authz = null;

    window.location.href = KeycloakService.auth.logoutUrl;
  }

  public getToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (KeycloakService.auth.authz && KeycloakService.auth.authz.token) {
        KeycloakService.auth.authz.updateToken(5)
          .success(() => {
            resolve(<string>KeycloakService.auth.authz.token);
          })
          .error(() => {
            reject('Failed to refresh token');
          });
      } else if (KeycloakService.auth.isDisabled) {
        resolve();
      } else {
        reject('Failed to refresh token');
      }
    });
  }
}

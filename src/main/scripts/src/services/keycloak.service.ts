import {Injectable} from '@angular/core';

declare let Keycloak: any;

@Injectable()
export class KeycloakService {
  public static auth: any = {};

  public static init(): Promise<any> {
    let kcSetting = require('../../../webapp/WEB-INF/keycloak.json');
    const keycloakAuth: any = Keycloak({
      url: kcSetting['auth-server-url'],
      realm: kcSetting.realm,
      clientId: kcSetting.resource,
    });

    KeycloakService.auth.loggedIn = false;
    KeycloakService.auth.isDisabled = kcSetting.disabled || LUMEER_ENV === 'development';
    kcSetting.disabled = kcSetting.disabled || LUMEER_ENV === 'development';
    return new Promise((resolve, reject) => {
      if (kcSetting.disabled) {
        resolve();
      } else {
        keycloakAuth.init({ onLoad: 'login-required', checkLoginIframe: false})
          .success(() => {
            KeycloakService.auth.loggedIn = true;
            KeycloakService.auth.authz = keycloakAuth;
            KeycloakService.auth.logoutUrl = keycloakAuth.authServerUrl
              + `/realms/${kcSetting.realm}/protocol/openid-connect/logout?redirect_uri=`
              + document.baseURI;
            resolve();
          })
          .error(() => {
            reject();
          });
      }
    });
  }

  public  logout() {
    console.log('*** LOGOUT');
    KeycloakService.auth.loggedIn = false;
    KeycloakService.auth.authz = null;

    window.location.href = KeycloakService.auth.logoutUrl;
  }

  public getToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (KeycloakService.auth.authz && KeycloakService.auth.authz.token) {
        KeycloakService.auth.authz
          .updateToken(5)
          .success(() => {
            resolve(<string>KeycloakService.auth.authz.token);
          })
          .error(() => {
            reject('Failed to refresh token');
          });
      } else if (KeycloakService.auth.isDisabled) {
        resolve();
      } else {
        reject('Not loggen in');
      }
    });
  }
}

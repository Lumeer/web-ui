/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {NotificationService} from '../notifications/notification.service';
import {Perspective} from '../../view/perspectives/perspective';

@Injectable()
export class PageNotFoundGuard implements CanActivate {
  constructor(private notificationService: NotificationService, private router: Router) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const [, w, organizationCode, projectCode] = state.url.split('/');

    if (w === 'w' && organizationCode && projectCode) {
      this.router.navigate(['/', 'w', organizationCode, projectCode, 'view', Perspective.Search]);
    } else {
      this.router.navigate(['/']);
    }

    const message = $localize`:@@page.not.found:Page not found`;
    this.notificationService.error(message);

    console.error(state.url);

    return false;
  }
}

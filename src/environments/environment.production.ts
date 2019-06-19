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

import {Environment} from './environment-type';
import {environmentVariables} from './environment-variables';

export const environment: Environment = {
  analytics: true,
  auth: true,
  authPersistence: true,
  mapboxKey: 'pk.eyJ1IjoibGl2dGhvbWFzIiwiYSI6ImNqeDM5bjF0MjAxdXU0YXRhaXc5NGFlcHMifQ.OhBTMH5jl9X3Hw1m6hHHrQ',
  mapQuestKey: '04hLAMDKaudroElnGIzKTltIxTaGOjTR',
  production: true,
  pusherLogDisabled: true,
  storeDevtools: false,
  name: 'production',
  paymentGw: 'https://gate.gopay.com/gp-gw/js/embed.js',
  ...environmentVariables,
};

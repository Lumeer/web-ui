/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

/* tslint:disable */
import {environment} from '../../../../environments/environment';

export class VideosData {
  private static readonly VIDEO_HR = {en: 'etoqX2slVEw', cs: ''};
  private static readonly VIDEO_GOV = {en: '_msiz33O9Tg', cs: ''};

  private static readonly allVideos = {
    // 'etoqX2slVEw': 20, // HR
    // '_msiz33O9Tg': 40, // local government
  };

  private static readonly allVideosCs = {
    // 'etoqX2slVEw': 20, // HR
    // '_msiz33O9Tg': 40, // local government
  };

  public static getAllVideos() {
    switch (environment.locale) {
      case 'cs':
        return this.allVideosCs;
      default:
        return this.allVideos;
    }
  }

  public static getVideosByUrl(url: string): string[] {
    let videos = [];
    // const locale = environment.locale === 'cs' ? 'cs' : 'en';
    //
    // if (/^\/organization\/.*/.test(url)) {
    //   videos.push(VideosData.VIDEO_HR[locale]);
    // }
    //
    // if (/^\/w\/.*/.test(url)) {
    //   videos.push(VideosData.VIDEO_GOV[locale]);
    // }

    return videos;
  }
}

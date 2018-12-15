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

import {environment} from '../../../../environments/environment';

const VIDEO_FIRST_TIME = {en: 'yDGLyzwcaxA', cs: 'yDGLyzwcaxA'}; // First time in Lumeer
const VIDEO_SEARCH_DATA = {en: 'cLpEfln1-z8', cs: 'cLpEfln1-z8'}; // How to search for data
const VIDEO_PERSPECTIVES = {en: 'Oj1TF6NgmaY', cs: 'Oj1TF6NgmaY'}; // Visual perspectives explained
const VIDEO_VIEWS = {en: '_1X1buZJ4dY', cs: '_1X1buZJ4dY'}; // Storing screen as views
const VIDEO_PERSPECTIVE_SEARCH_BASIC = {en: '7lSFgc-2DDU', cs: '7lSFgc-2DDU'}; // Search perspective basics
//const VIDEO_ = {en: '', cs: ''}; //

const ALL_VIDEOS_EN = {
  [VIDEO_FIRST_TIME.en]: 150,
  [VIDEO_SEARCH_DATA.en]: 1060,
  [VIDEO_PERSPECTIVES.en]: 1070,
  [VIDEO_VIEWS.en]: 1080,
  [VIDEO_PERSPECTIVE_SEARCH_BASIC.en]: 1090,
};

const ALL_VIDEOS_CS = {
  [VIDEO_FIRST_TIME.cs]: 150,
  [VIDEO_SEARCH_DATA.cs]: 1060,
  [VIDEO_PERSPECTIVES.cs]: 1070,
  [VIDEO_VIEWS.cs]: 1080,
  [VIDEO_PERSPECTIVE_SEARCH_BASIC.cs]: 1090,
};

export function getAllVideos() {
  switch (environment.locale) {
    case 'cs':
      return ALL_VIDEOS_CS;
    default:
      return ALL_VIDEOS_EN;
  }
}

export function getVideosByUrl(url: string): string[] {
  const videos = [];
  const locale = environment.locale === 'cs' ? 'cs' : 'en';

  if (!/^\/organization\/.*/.test(url)) {
    videos.push(VIDEO_SEARCH_DATA[locale]);
    videos.push(VIDEO_PERSPECTIVES[locale]);
    videos.push(VIDEO_VIEWS[locale]);
  }

  if (/^\/w\/.*\/view\/search\/.*/.test(url)) {
    videos.push(VIDEO_FIRST_TIME[locale]);
    videos.push(VIDEO_PERSPECTIVE_SEARCH_BASIC[locale]);
  }

  return videos;
}

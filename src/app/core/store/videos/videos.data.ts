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
const VIDEO_FEEDBACK = {en: 'nsr4TV6FiRw', cs: 'nsr4TV6FiRw'}; // Sending feedback
const VIDEO_IMPORT = {en: 'ZOWpZ2RPTD4', cs: 'ZOWpZ2RPTD4'}; // Importing data to Lumeer
const VIDEO_COLLECTION_CONFIG = {en: 'TbnAK5dSuaY', cs: 'TbnAK5dSuaY'}; // Collection configuration
const VIDEO_ORGANIZATION_SETTINGS = {en: '9vbQW8xS09Y', cs: '9vbQW8xS09Y'}; // Organization settings
const VIDEO_UPGRADE = {en: 'K6LjTTuIP_4', cs: 'K6LjTTuIP_4'}; // Upgrade to overcome data limits
const VIDEO_PROJECT_SETTINGS = {en: 'f631rZpP26w', cs: 'f631rZpP26w'}; // Project settings
const VIDEO_USER_MANAGEMENT = {en: '5zYT9PAaAc0', cs: '5zYT9PAaAc0'}; // User management
//const VIDEO_ = {en: '', cs: ''}; //

const ALL_VIDEOS_EN = {
  [VIDEO_FIRST_TIME.en]: 150,
  [VIDEO_IMPORT.en]: 160,
  [VIDEO_COLLECTION_CONFIG.en]: 170,
  [VIDEO_ORGANIZATION_SETTINGS.en]: 180,
  [VIDEO_UPGRADE.en]: 190,
  [VIDEO_PROJECT_SETTINGS.en]: 200,
  [VIDEO_USER_MANAGEMENT.en]: 210,
  [VIDEO_FEEDBACK.en]: 1000,
  [VIDEO_SEARCH_DATA.en]: 1060,
  [VIDEO_PERSPECTIVES.en]: 1070,
  [VIDEO_VIEWS.en]: 1080,
  [VIDEO_PERSPECTIVE_SEARCH_BASIC.en]: 1090,
};

const ALL_VIDEOS_CS = {
  [VIDEO_FIRST_TIME.cs]: 150,
  [VIDEO_IMPORT.cs]: 160,
  [VIDEO_COLLECTION_CONFIG.cs]: 170,
  [VIDEO_ORGANIZATION_SETTINGS.cs]: 180,
  [VIDEO_UPGRADE.cs]: 190,
  [VIDEO_PROJECT_SETTINGS.cs]: 200,
  [VIDEO_USER_MANAGEMENT.cs]: 210,
  [VIDEO_FEEDBACK.cs]: 1000,
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

  videos.push(VIDEO_FEEDBACK[locale]);

  if (!/^\/organization\/.*/.test(url)) {
    videos.push(VIDEO_SEARCH_DATA[locale]);
    videos.push(VIDEO_PERSPECTIVES[locale]);
    videos.push(VIDEO_VIEWS[locale]);
  }

  if (/^\/organization\/.*\/project\/.*/.test(url)) {
    // just project
    videos.push(VIDEO_PROJECT_SETTINGS[locale]);
  } else if (/^\/organization\/.*/.test(url)) {
    // just org
    videos.push(VIDEO_ORGANIZATION_SETTINGS[locale]);
    videos.push(VIDEO_USER_MANAGEMENT[locale]);
  }

  if (/^\/w\/.*\/view\/search\/.*/.test(url)) {
    videos.push(VIDEO_IMPORT[locale]);
    videos.push(VIDEO_FIRST_TIME[locale]);
    videos.push(VIDEO_PERSPECTIVE_SEARCH_BASIC[locale]);
    videos.push(VIDEO_COLLECTION_CONFIG[locale]);
    videos.push(VIDEO_ORGANIZATION_SETTINGS[locale]);
    videos.push(VIDEO_PROJECT_SETTINGS[locale]);
    videos.push(VIDEO_USER_MANAGEMENT[locale]);
  }

  videos.push(VIDEO_UPGRADE[locale]);

  return videos;
}

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

export interface VideoModel {
  id?: string;
  summary: string;
  description: string;
  priority: number;
  thumbnail: string;
}

export interface VideoMetaData {
  items: VideoItem[];
}

export interface VideoItem {
  id: string;
  snippet: VideoSnippet;
}

export interface VideoSnippet {
  title: string;
  description: string;
  thumbnails: VideoThumbnails;
}

export interface VideoThumbnails {
  default: VideoThumbnail;
  medium: VideoThumbnail;
  standard: VideoThumbnail;
  high: VideoThumbnail;
  maxres: VideoThumbnail;
}

export interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
}

/*{
  "kind": "youtube#videoListResponse",
  "etag": "\"XI7nbFXulYBIpL0ayR_gDh3eu1k/Yd9FlWUnthPFNE0K9NNDsNjHSeg\"",
  "pageInfo": {
  "totalResults": 1,
    "resultsPerPage": 1
},
  "items": [
  {
    "kind": "youtube#video",
    "etag": "\"XI7nbFXulYBIpL0ayR_gDh3eu1k/d6YBzqYKRihOXug5-sq8yrbxH9E\"",
    "id": "etoqX2slVEw",
    "snippet": {
      "publishedAt": "2017-10-26T17:11:54.000Z",
      "channelId": "UCVOh8jQ9cPWCcswbgjT5zyg",
      "title": "Lumeer: Use cases in HR",
      "description": "Showcast of Lumeer features suitable for Human Resources team. Multiple perspectives such as table, contingency table, map or calendar are used to easily store, view and manage job postings and candidates. \n\nCheck out detailed description in a series of posts on our blog: http://blog.lumeer.io/search/label/HR",
      "thumbnails": {
        "default": {
          "url": "https://i.ytimg.com/vi/etoqX2slVEw/default.jpg",
          "width": 120,
          "height": 90
        },
        "medium": {
          "url": "https://i.ytimg.com/vi/etoqX2slVEw/mqdefault.jpg",
          "width": 320,
          "height": 180
        },
        "high": {
          "url": "https://i.ytimg.com/vi/etoqX2slVEw/hqdefault.jpg",
          "width": 480,
          "height": 360
        },
        "standard": {
          "url": "https://i.ytimg.com/vi/etoqX2slVEw/sddefault.jpg",
          "width": 640,
          "height": 480
        },
        "maxres": {
          "url": "https://i.ytimg.com/vi/etoqX2slVEw/maxresdefault.jpg",
          "width": 1280,
          "height": 720
        }
      },
      "channelTitle": "Lumeer",
      "tags": [
        "lumeer",
        "demo",
        "use case",
        "hr",
        "poc",
        "mvp"
      ],
      "categoryId": "28",
      "liveBroadcastContent": "none",
      "defaultLanguage": "en",
      "localized": {
        "title": "Lumeer: Use cases in HR",
        "description": "Showcast of Lumeer features suitable for Human Resources team. Multiple perspectives such as table, contingency table, map or calendar are used to easily store, view and manage job postings and candidates. \n\nCheck out detailed description in a series of posts on our blog: http://blog.lumeer.io/search/label/HR"
      },
      "defaultAudioLanguage": "en"
    },
    "contentDetails": {
      "duration": "PT8M56S",
      "dimension": "2d",
      "definition": "hd",
      "caption": "false",
      "licensedContent": false,
      "projection": "rectangular"
    }
  }
]
}*/

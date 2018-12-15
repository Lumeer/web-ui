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

import {VideoItem, VideoMetaData, VideoModel} from './video.model';

export class VideoConverter {
  private static fromItem(dto: VideoItem, priority?: number): VideoModel {
    return {
      id: dto.id,
      summary: dto.snippet.title,
      description: dto.snippet.description,
      priority: priority ? priority : 100,
      thumbnail: dto.snippet.thumbnails.medium.url,
    };
  }

  public static fromDto(videosMeta: VideoMetaData, priorities: {[id: string]: number}): VideoModel[] {
    const videos: VideoModel[] = [];

    videosMeta.items.forEach(videoItem => {
      let priority = priorities[videoItem.id];
      if (!priority) {
        priority = 100;
      }
      videos.push(VideoConverter.fromItem(videoItem, priority));
    });

    return videos;
  }
}

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

import {uniqueArrays} from '../../../../../../../shared/utils/array.utils';

export interface ObjectFolders<T extends ObjectFoldersType> {
  objects: T[];
  folders: ObjectFolders<T>[];
  name?: string;
}

export type ObjectFoldersType = {folders: string[]};

export function calculateObjectFoldersOverallCount<T extends ObjectFoldersType>(folders: ObjectFolders<T>): number {
  return (folders?.objects.length || 0) + calculateObjectFoldersCount(folders?.folders);
}

export function calculateObjectFoldersCount<T extends ObjectFoldersType>(folders: ObjectFolders<T>[]): number {
  return (folders || []).reduce(
    (sum, folder) => sum + folder.objects.length + calculateObjectFoldersCount(folder.folders),
    0
  );
}

export function createObjectFolders<T extends ObjectFoldersType>(objects: T[]): ObjectFolders<T> {
  return (objects || []).reduce((folders, object) => addObjectToObjectFolders(object, folders), {
    objects: [],
    folders: [],
  });
}

function addObjectToObjectFolders<T extends ObjectFoldersType>(
  object: T,
  objectFolders: ObjectFolders<T>
): ObjectFolders<T> {
  const foldersArray = uniqueArrays(
    (object.folders || []).map(rawFolder => parseObjectFolder(rawFolder)).filter(folders => folders.length)
  );
  if (foldersArray.length) {
    for (const folders of foldersArray) {
      let currentObjectFolders = objectFolders;
      for (const folder of folders) {
        const existingFolders = currentObjectFolders.folders.find(f => f.name === folder);
        if (existingFolders) {
          currentObjectFolders = existingFolders;
        } else {
          const newObjectFolders: ObjectFolders<T> = {name: folder, folders: [], objects: []};
          currentObjectFolders.folders.push(newObjectFolders);
          currentObjectFolders = newObjectFolders;
        }
      }
      currentObjectFolders.objects.push(object);
    }
  } else {
    objectFolders.objects.push(object);
  }

  return sortObjectFolders(objectFolders);
}

function sortObjectFolders<T extends ObjectFoldersType>(objectFolders: ObjectFolders<T>): ObjectFolders<T> {
  return {
    ...objectFolders,
    folders: objectFolders.folders
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(folders => sortObjectFolders(folders)),
  };
}

export function cleanObjectFolders<T extends ObjectFoldersType>(object: T): string[] {
  return (object.folders || []).map(folder => parseObjectFolder(folder).join('/')).filter(folder => !!folder);
}

export function createObjectFolder(path: string[]): string {
  return (path || []).join('/');
}

export function parseObjectFolder(rawFolder: string): string[] {
  return (rawFolder?.toString() || '')
    .split('/')
    .map(folder => folder.trim())
    .filter(folder => !!folder);
}

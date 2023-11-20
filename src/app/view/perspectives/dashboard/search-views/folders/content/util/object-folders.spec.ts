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
import {createObjectFolders} from './object-folders';

interface ObjectWithFolders {
  folders: string[];
}

describe('Create object folders', () => {
  it('should create empty folders', () => {
    expect(createObjectFolders([]).objects).toEqual([]);
    expect(createObjectFolders([]).folders).toEqual([]);

    let objects: ObjectWithFolders[] = [{folders: []}, {folders: []}, {folders: []}];
    expect(createObjectFolders(objects).folders).toEqual([]);
    expect(createObjectFolders(objects).objects).toHaveSize(3);

    objects = [{folders: ['']}, {folders: ['///']}, {folders: ['//////']}];
    expect(createObjectFolders(objects).folders).toEqual([]);
    expect(createObjectFolders(objects).objects).toHaveSize(3);

    objects = [{folders: ['', '', '', '   ', ' / / ']}, {folders: ['  / ', '   / ', '////']}];
    expect(createObjectFolders(objects).folders).toEqual([]);
    expect(createObjectFolders(objects).objects).toHaveSize(2);
  });

  it('create simple folders', () => {
    const objects: ObjectWithFolders[] = [
      {folders: ['a ', 'b']},
      {folders: ['a ', ' a', ' a']},
      {folders: ['b', ' a']},
    ];
    const objectFolders = createObjectFolders(objects);
    expect(objectFolders.folders).toHaveSize(2);
    expect(objectFolders.objects).toHaveSize(0);
    expect(objectFolders.folders[0].name).toEqual('a');
    expect(objectFolders.folders[0].folders).toEqual([]);
    expect(objectFolders.folders[0].objects).toHaveSize(3);
    expect(objectFolders.folders[1].name).toEqual('b');
    expect(objectFolders.folders[1].folders).toEqual([]);
    expect(objectFolders.folders[1].objects).toHaveSize(2);
  });

  it('create nested folders', () => {
    const objects: ObjectWithFolders[] = [
      {folders: ['a/b/c ', 'b/c', 'b']},
      {folders: ['a///b/c ', ' a/ /b/c', 'a', 'a/c']},
      {folders: ['b', ' a', 'a/b/c/d']},
      {folders: []},
    ];
    const objectFolders = createObjectFolders(objects);
    expect(objectFolders.folders).toHaveSize(2);
    expect(objectFolders.objects).toHaveSize(1);

    const firstFolder = objectFolders.folders[0];
    expect(firstFolder.name).toEqual('a');
    expect(firstFolder.folders).toHaveSize(2);
    expect(firstFolder.objects).toHaveSize(2);

    expect(firstFolder.folders[0].name).toEqual('b');
    expect(firstFolder.folders[0].folders).toHaveSize(1);
    expect(firstFolder.folders[0].objects).toHaveSize(0);

    expect(firstFolder.folders[1].name).toEqual('c');
    expect(firstFolder.folders[1].folders).toHaveSize(0);
    expect(firstFolder.folders[1].objects).toHaveSize(1);

    expect(firstFolder.folders[0].folders[0].name).toEqual('c');
    expect(firstFolder.folders[0].folders[0].folders).toHaveSize(1);
    expect(firstFolder.folders[0].folders[0].objects).toHaveSize(2);
    expect(firstFolder.folders[0].folders[0].folders[0].name).toEqual('d');
    expect(firstFolder.folders[0].folders[0].folders[0].objects).toHaveSize(1);

    const secondFolder = objectFolders.folders[1];
    expect(secondFolder.name).toEqual('b');
    expect(secondFolder.folders).toHaveSize(1);
    expect(secondFolder.objects).toHaveSize(2);

    expect(secondFolder.folders[0].name).toEqual('c');
    expect(secondFolder.folders[0].folders).toHaveSize(0);
    expect(secondFolder.folders[0].objects).toHaveSize(1);
  });
});

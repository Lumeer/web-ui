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

export const defaultTextEditorOptions = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    ['blockquote', 'code-block'],

    [{header: 1}, {header: 2}], // custom button values
    [{list: 'ordered'}, {list: 'bullet'}, {list: 'check'}],
    [{script: 'sub'}, {script: 'super'}], // superscript/subscript
    [{indent: '-1'}, {indent: '+1'}], // outdent/indent
    [{direction: 'rtl'}], // text direction

    [{size: ['small', false, 'large', 'huge']}], // custom dropdown
    [{header: [1, 2, 3, 4, 5, 6, false]}],

    [{color: []}, {background: []}], // dropdown with defaults from theme
    [{font: []}],
    [{align: []}],

    ['clean'], // remove formatting button

    ['link'], // link and image, video
  ],
};

export const defaultTextEditorBubbleOptions = {
  toolbar: [['bold', 'italic', 'underline', 'strike', {script: 'sub'}, {script: 'super'}, 'clean']],
};

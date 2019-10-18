export interface DataRowComponent {
  startKeyEditing(value?: any);

  startValueEditing(value?: any);

  endValueEditing();

  endKeyEditing();

  focusKey(focus: boolean);

  focusValue(focus: boolean)
}

export interface DataRowHiddenComponent {
  focus();

  blur();
}

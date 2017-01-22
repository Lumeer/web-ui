import * as _ from 'lodash';

const AUTO_COMPLETE_ACTION = {
  40: onSelectNext,
  38: onSelectPrevious,
  13: onChoose,
  27: stopAction
};

export function  getActionToKey(keyCode) {
  return AUTO_COMPLETE_ACTION.hasOwnProperty(keyCode) ? AUTO_COMPLETE_ACTION[keyCode] : basicAction;
}

export function filterItems(oneItem) {
  if (this.modelData) {
    let currentData = this.modelData.trim().toLowerCase();
    if (this.modelData !== '') {
      return oneItem[this.options.displayKey].toLowerCase().indexOf(currentData) !== -1;
    }
    return true;
  }
}

export function inactive() {
  let activeObject: any = _.find(this.filteredSource, {active: true});
  if (activeObject) {
    activeObject.active = false;
  }
}

function onSelectNext($event) {
  let activeIndex = _.findIndex(this.filteredSource, {active: true});
  inactive.call(this);
  if (this.filteredSource) {
    let nextActive = activeIndex !== this.filteredSource.length - 1 ? activeIndex + 1 : 0;
    if (nextActive !== -1 && this.filteredSource[nextActive]) {
      this.filteredSource[nextActive].active = true;
    }
  }
  $event && $event.preventDefault();
}

function onSelectPrevious($event) {
  let activeIndex: number = _.findIndex(this.filteredSource, {active: true});
  inactive.call(this);
  if (this.filteredSource) {
    let nextActive = activeIndex !== 0 && activeIndex !== -1 ? activeIndex - 1 : this.filteredSource.length - 1;
    if (nextActive !== -1 && this.filteredSource[nextActive]) {
      this.filteredSource[nextActive].active = true;
    }
  }
  $event && $event.preventDefault();
}

function onChoose($event) {
  let activeObject: any = _.find(this.filteredSource, {active: true});
  if (activeObject) {
    this.updateData(activeObject);
  }
  $event && $event.preventDefault();
}

function stopAction() {
  this.onHidePicker();
}

function basicAction() {
  this.onShowPicker();
}

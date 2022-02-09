import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IISContentArrayItem, ISContentArray } from '../../models/intelligent-search';
import { ISaveASearchState, ISaveISearchState } from '../../models/save-search-state';

@Injectable({
  providedIn: 'root'
})
export class ISService {

  constructor() { }

  // SEARCH STATE
  userQuery = '';
  dataFilter: IISContentArrayItem = ISContentArray[0];
  loadPreviousState = true;

  // tracks search triggers
  triggerSearch$ = new Subject<string>();

  // Best Matches
  saveISearchState(state: ISaveISearchState) {
    localStorage.setItem('searchStateI', JSON.stringify(state));
  }
  loadISearchState(): ISaveISearchState|null {
    const state= localStorage.getItem('searchStateI');
    if (state) {
      return JSON.parse(state) as ISaveISearchState;
    }
    return null;
  }

  // Search
  saveASearchState(state: ISaveASearchState) {
    localStorage.setItem('searchStateA', JSON.stringify(state));
  }
  loadASearchState(): ISaveASearchState|null {
    const state= localStorage.getItem('searchStateA');
    if (state) {
      return JSON.parse(state) as ISaveASearchState;
    }
    return null;
  }
}

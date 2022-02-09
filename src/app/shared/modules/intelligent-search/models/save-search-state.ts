import { IISContentArrayItem } from './intelligent-search';

// Intelligent search state
export interface ISaveISearchState {
  userQuery: string,
  showTabularData: boolean,
}

// Advanced search state
export interface ISaveASearchState {
  pageNo: number,
  dataFilter: IISContentArrayItem,
  searchQuery: string
}
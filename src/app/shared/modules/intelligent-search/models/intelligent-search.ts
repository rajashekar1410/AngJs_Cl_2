export enum ISContentTypes {
  TYPE_ALL = 0,
  TYPE_IETM = 1,
  TYPE_DRAWINGS = 2,
  TYPE_MANUALS = 3,
  TYPE_ANNOTATION = 4,
  TYPE_INVENTORY = 5,
}

export interface IISContentArrayItem {
  id: ISContentTypes,
  text: string
}

export const ISContentArray: IISContentArrayItem[] = [
  {
    id: ISContentTypes.TYPE_ALL,
    text: 'All'
  },
  {
    id: ISContentTypes.TYPE_IETM,
    text: 'IETM Core'
  },
  {
    id: ISContentTypes.TYPE_DRAWINGS,
    text: 'Drawings'
  },
  {
    id: ISContentTypes.TYPE_MANUALS,
    text: 'Manuals'
  },
  {
    id: ISContentTypes.TYPE_ANNOTATION,
    text: 'Annotations'
  },
  {
    id: ISContentTypes.TYPE_INVENTORY,
    text: 'Inventory'
  },
]
export interface ISIETMCoreChildItem {
  page_id: number,
  title?: string,
  pc?: number,
  pc_title?: string,
  pm?: number,
  pm_title?: string
}

export interface IISAnnotationChildItem {
  id: number,
  title?: string,
  description?: string
}


export interface ISTypeaheadGroupItem {
  id: ISTypeaheadGroup,
  text: string
}

export enum ISTypeaheadGroup {
  TYPE_SEARCH_RECENT = 1,
  TYPE_SEARCH_RESULT = 2,
  TYPE_SEARCH_SUGGESSION = 3
}

export const ISTypeaheadGroupArray: ISTypeaheadGroupItem[] = [
  {
    id: ISTypeaheadGroup.TYPE_SEARCH_RECENT,
    text: 'Recent Searches'
  },
  {
    id: ISTypeaheadGroup.TYPE_SEARCH_RESULT,
    text: 'Results'
  },
  {
    id: ISTypeaheadGroup.TYPE_SEARCH_SUGGESSION,
    text: 'Related Searches'
  }
]
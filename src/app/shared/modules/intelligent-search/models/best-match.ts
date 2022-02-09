import { ISContentTypes } from './intelligent-search';

export interface IBestMatchItem {
  contentType: ISContentTypes,
  childItems: IIETMCoreChildItem | IAnnotationChildItem
}

export interface IIETMCoreChildItem {
  page_id: number,
  title?: string,
  pc?: number,
  pc_title?: string,
  pm?: number,
  pm_title?: string
}

export interface IAnnotationChildItem {
  id: number,
  title?: string,
  description?: string
}

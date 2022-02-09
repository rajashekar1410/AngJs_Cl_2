export enum HyperlinkActionTypes {
  TYPE_EDIT = 2,
  TYPE_DELETE = 3,
  TYPE_VIEW = 4,

  TYPE_POST_ADD = 5,
  TYPE_POST_EDIT = 5,
  TYPE_POST_DEL = 6,
}

export interface IHyperlinkAddActionData {
  to_page?: number,
  mode?: boolean,
  node_id: number
}

export interface IHyperlinkTransmitData {
  action: HyperlinkActionTypes,
  status?: number,
  data?: IHyperlinkAddActionData
}

export interface IHyperlinkItem {
  id: string,
  content: string,
  from_page: number,
  to_page: number
}
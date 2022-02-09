export interface ITrackingData {
  id?: string,
  uid: string,
  type: TrackingTypes,
  page_id?: number,
  gs_query?: string,
  data?: string,
  date?: Date
}

export enum TrackingTypes {
  TYPE_ALL = 5,
  TYPE_PAGE_ACCESS = 0,
  TYPE_PRINT_PDF = 1,
  TYPE_GLOBAL_SEARCH = 2,
  TYPE_PWD_CHANGE = 3,
  TYPE_SECURITY_QUE_CHANGE = 4,
  TYPE_BOOKMARKS = 6,
  TYPE_ANNOTATIONS = 7,
  TYPE_USER = 8,
  TYPE_GLOSSARY = 9,
  TYPE_INVENTORY = 10,
  TYPE_LOGS = 11,
}

export interface ITrackingTypeArrayItem {
  id: TrackingTypes,
  text: string,
  actionText: string,
  dataTitle: string,
  dataText: string,
  minUserType: number
}

export const TrackingTypeArray: ITrackingTypeArrayItem[] = [
  {
    id: TrackingTypes.TYPE_ALL,
    text: 'All',
    actionText: '',
    dataTitle: '',
    dataText: ``,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_PAGE_ACCESS,
    text: 'Document Access History',
    actionText: 'Document was accessed',
    dataTitle: 'Page Title:',
    dataText: `data['page_title']`,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_PRINT_PDF,
    text: 'Print History',
    actionText: 'Page was printed',
    dataTitle: 'Page Title:',
    dataText: `data['page_title']`,
    minUserType: 1
  },
  {
    id: TrackingTypes.TYPE_GLOBAL_SEARCH,
    text: 'Search History',
    actionText: 'Search was used',
    dataTitle: 'Search Term:',
    dataText: `data['gs_query']`,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_PWD_CHANGE,
    text: 'Accout Password changes',
    actionText: 'Account password was updated',
    dataTitle: '',
    dataText: ``,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_SECURITY_QUE_CHANGE,
    text: 'Account Security Questions',
    actionText: 'Account security questions were updated',
    dataTitle: '',
    dataText: ``,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_BOOKMARKS,
    text: 'Bookmark History',
    actionText: '--',
    dataTitle: 'Bookmark Term:',
    dataText: `--`,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_ANNOTATIONS,
    text: 'Annotations History',
    actionText: '',
    dataTitle: 'Annotation Term:',
    dataText: ``,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_USER,
    text: 'User Accounts',
    actionText: '--',
    dataTitle: '',
    dataText: ``,
    minUserType: 1 // min. admin level access needed
  },
  {
    id: TrackingTypes.TYPE_GLOSSARY,
    text: 'Glossary history',
    actionText: '--',
    dataTitle: '',
    dataText: ``,
    minUserType: 0
  },
  {
    id: TrackingTypes.TYPE_INVENTORY,
    text: 'Inventory history',
    actionText: '--',
    dataTitle: '',
    dataText: ``,
    minUserType: 3
  },
  {
    id: TrackingTypes.TYPE_LOGS,
    text: 'Logs history',
    actionText: '--',
    dataTitle: '',
    dataText: ``,
    minUserType: 1
  },

]
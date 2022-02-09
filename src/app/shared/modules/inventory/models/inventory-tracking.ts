export interface IInventoryTrackData {
  action?: InventoryActionTypes
}

export interface IInventoryActionArrayItem {
  id: InventoryActionTypes,
  actionText: string,
  dataTitle: string,
  dataText: string
}


export enum InventoryActionTypes {
  TYPE_I_ADD = 1,
  TYPE_I_EDIT = 2,
  TYPE_I_DEL = 3,
  TYPE_I_CONSUMED = 4,
  TYPE_I_DEMANDED = 5,
  TYPE_I_RECEIVED = 6,
  TYPE_I_CANCELLED = 7,
}

export const InventoryActionArray: IInventoryActionArrayItem[] = [
  {
    id: InventoryActionTypes.TYPE_I_ADD,
    actionText: 'Item was Added',
    dataTitle: '',
    dataText: '',
  },
  {
    id: InventoryActionTypes.TYPE_I_EDIT,
    actionText: 'Item was updated',
    dataTitle: '',
    dataText: ''
  },
  {
    id: InventoryActionTypes.TYPE_I_DEL,
    actionText: 'Item was deleted',
    dataTitle: '',
    dataText: '',
  },
  {
    id: InventoryActionTypes.TYPE_I_CONSUMED,
    actionText: 'Item was consumed',
    dataTitle: '',
    dataText: '',
  },
  {
    id: InventoryActionTypes.TYPE_I_DEMANDED,
    actionText: 'Item quantity increase was requested',
    dataTitle: '',
    dataText: '',
  },
  {
    id: InventoryActionTypes.TYPE_I_RECEIVED,
    actionText: 'Item quantity increase received',
    dataTitle: '',
    dataText: '',
  },
  {
    id: InventoryActionTypes.TYPE_I_CANCELLED,
    actionText: 'Item quantity increase was cancelled',
    dataTitle: '',
    dataText: '',
  },
]

export enum InventoryReportTypes {
  TYPE_ITEM_HISTORY = 1,
  TYPE_OVERALL_HISTORY = 2,
  TYPE_CONSUMPTION_REPORT = 3,
  TYPE_CURRENT_ORDERS = 4,
  TYPE_RECEIVED_ORDERS = 5,
  TYPE_CANCELLED_ORDERS = 6,
}
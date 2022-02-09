export enum IETMTableEventTypes {
    TYPE_PRINT = 0,
    TYPE_FILTER = 1,
    TYPE_SELECT_CHECKBOX = 2,
    TYPE_ITEM_DELETE = 3,
    TYPE_ITEM_ADD = 4
}

export enum IETMTableEventSubTypes {
    TYPE_TASK_INIT= 0,
    TYPE_TASK_SUCCESS = 1,
    TYPE_TASK_FAILED = 2
}

export interface IIETMTableEvent {
    type: IETMTableEventTypes,
    data?: any
}
import { InventoryActionTypes } from "../../inventory/models/inventory-tracking";

export interface ITrackInventoryEvent {
  event: InventoryActionTypes,
  data: ITrackInvAddUpdEvent|ITrackInvConsumedEvent|ITrackInvDemandedEvent|ITrackInvDelEvent
}

interface IBaseTrackInvActionEvent {
  id?: number,
  invDesc?: string,
  invPartNo?: string
}

export interface ITrackInvAddUpdEvent extends IBaseTrackInvActionEvent {}

export interface ITrackInvDelEvent extends IBaseTrackInvActionEvent {}

export interface ITrackInvConsumedEvent extends IBaseTrackInvActionEvent {
  consumed: number,
  total: number,
  available: number,
  remarks: string
}

export interface ITrackInvDemandedEvent extends IBaseTrackInvActionEvent {
  demanded: number,
  isReceived: boolean,
  remarks: string
}

export interface ITrackInvRecvCancelEvent extends IBaseTrackInvActionEvent {
  received: number,
  inv_id: number,
  remarks: string
}
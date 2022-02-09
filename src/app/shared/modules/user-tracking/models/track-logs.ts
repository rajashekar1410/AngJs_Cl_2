import { LogTypes } from "../../logs/models/log-types";

export interface ITrackLogsEvent {
  event: LogActionTypes,
  data: ITrackLogAddUpdEvent|ITrackLogDelEvent
}

export enum LogActionTypes {
  TYPE_LOG_ADDED = 1,
  TYPE_LOG_EDITED = 2,
  TYPE_LOG_DELETED = 3
}

interface IBaseTrackLogActionEvent {
  id?: number,
  logType: LogTypes,
  logDate?: string,
  logRemarks?: string
}

export interface ITrackLogAddUpdEvent extends IBaseTrackLogActionEvent {
  swOffDateTime?: string,
  swOnDateTime?: string,
  descAct?: string,
}

export interface ITrackLogDelEvent extends IBaseTrackLogActionEvent {}
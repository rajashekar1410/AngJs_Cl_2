export interface ITrackUserEvent {
  userName: string,
  employeeId: string,
  event: TrackUserEvent,
}

export enum TrackUserEvent {
  TYPE_USER_ADDED = 0,
  TYPE_USER_EDITED = 1,
  TYPE_USER_DELETED = 2,

}
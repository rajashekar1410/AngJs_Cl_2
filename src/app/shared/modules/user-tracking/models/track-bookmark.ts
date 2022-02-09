export interface ITrackBookmarkEvent {
  bookmarkName: string,
  event: TrackBookmarkEvent
}

export enum TrackBookmarkEvent {
  TYPE_BKM_ADDED = 0,
  TYPE_BKM_EDITED = 1,
  TYPE_BKM_DELETED = 2,

}
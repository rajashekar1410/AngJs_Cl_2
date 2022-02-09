export interface ITrackAnnotationEvent {
  annotationName: string,
  event: TrackAnnotationEvent,
  privacy: TrackAnnotationEventPrivacy
}

export enum TrackAnnotationEventPrivacy {
  TYPE_NOTES = 1,
  TYPE_FEEDBACK = 2
}

export enum TrackAnnotationEvent {
  TYPE_ANT_ADDED = 0,
  TYPE_ANT_EDITED = 1,
  TYPE_ANT_DELETED = 2,
  TYPE_ANT_PRINTED = 3,

}
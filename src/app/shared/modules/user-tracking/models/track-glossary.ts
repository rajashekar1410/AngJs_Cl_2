export interface ITrackGlossaryEvent {
  event: TrackGlossaryEvent,
  glTitle?: string,
  glType?: number,
  glData?: string
}

export enum TrackGlossaryType {
  TYPE_ABBR = 1,
  TYPE_DEFN = 2
}

export enum TrackGlossaryEvent {
  TYPE_GL_ADDED = 0,
  TYPE_GL_EDITED = 1,
  TYPE_GL_DELETED = 2,
  TYPE_GL_PRINTED = 3
}
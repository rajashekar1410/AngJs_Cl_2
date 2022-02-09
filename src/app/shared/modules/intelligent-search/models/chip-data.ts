export interface IChipItem {
  id: ChipDataTypes,
  text: string
}

export enum ChipDataTypes {
  TYPE_RECENT_SEARCHES = 1,
  TYPE_SUGGESTIONS = 2
}
/**
 * This interface represents the state stored to browser when navigating to/from global search
 */
export interface IGlobalSearchState {
  /**
   * The search query in DataTable "search" input field
   */
  query: string,
  /**
   * The current page number visible to user.
   * Note: This index starts with 0!
   */
  currentPageIndex: number
}

import { AfterViewInit, ApplicationRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, of, Subscription } from 'rxjs';
import { switchMap, map, tap, debounceTime, shareReplay } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { IBestMatchItem, IIETMCoreChildItem } from '../../models/best-match';
import { ChipDataTypes, IChipItem } from '../../models/chip-data';
import { IISAnnotationChildItem, IISContentArrayItem, ISContentArray, ISContentTypes } from '../../models/intelligent-search';
import { ISService } from '../../services/i-s/i-s.service';

@Component({
  selector: 'app-search-ietm',
  templateUrl: './search-ietm.component.html',
  styleUrls: ['./search-ietm.component.scss']
})
export class SearchIETMComponent implements OnInit, AfterViewInit, OnDestroy {

  // search input
  searchContentSub$: Subscription = null;
  searchInputListenerSub$: Subscription = null;
  DEBOUNCE_TIME = 800;

  @ViewChild('inputQuery') inputField: ElementRef<HTMLInputElement>;
  
  // chips
  MAX_CHIP_ITEMS = 25;

  // content filters
  filterTypeArray = ISContentArray;
  filterTypeIds = ISContentTypes;

  // makes sure we don't record duplicate "recent search" events (to an extent)
  isTrackable = true;

  // UI elements
  bestMatchItems = new Array<IBestMatchItem>();
  chipDataItems = new Array<IChipItem>();
  isProcessing = false;

  // UI States
  // chips data changes acc. to user input query
  isInSearchMode = false;
  // toggles between search modes
  showTabularData = true;

  fetchData1Sub$: Subscription = null;
  fetchData2Sub$: Subscription = null;

  constructor(
    public cs: CommonService,
    private trackingService: UserTrackingService,
    private router: Router,
    private appRef: ApplicationRef,
    public isS: ISService
  ) {
    // search state init
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;
    if (state) {
      console.log(state);
      const { loadPreviousState } = state;
      if (loadPreviousState != undefined) {
        this.isS.loadPreviousState = loadPreviousState;
      }
    }
  }

  ngOnInit() {
    // UI
    this.cs.emitChange('1');
    this.cs.page_header = 'Search IETM';
    // Fix content filter
    this.filterTypeArray = ISContentArray.filter(e => {
      switch(e.id) {
        case ISContentTypes.TYPE_INVENTORY:
          return this.cs.isPageCategoryAccessible(this.cs.page_categories.find(e => e['id'] == 6));
        default:
           return true;
      }
    });
    // Load recent search data
    this.searchContent();
  }

  listenToInputEvents() {
    // Init search input listener
    const input = this.inputField?.nativeElement;
    if (input) {
      this.searchInputListenerSub$ = fromEvent(input, 'keyup')
        .pipe(
          map(x => x.currentTarget['value'] as string),
          debounceTime(this.DEBOUNCE_TIME),
          shareReplay(1)
        )
        .subscribe(
          _ => { this.updateSearchQuery(_) },
          console.error
        )
    }
  }

  ngAfterViewInit() {
    this.listenToInputEvents();

    // Search state stuff
    if (this.isS.loadPreviousState) {
      const state = this.isS.loadISearchState();
      if (state) {
        const { showTabularData, userQuery } = state;
        // Fix: ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.showTabularData = showTabularData;
          this.updateSearchQuery(userQuery);
        }, 300);
      }
    }
  }

  clearInput() {
    // table data relies on this var for search feature
    this.isS.loadPreviousState = false;
    // reset current component
    this.isS.userQuery = '';
    this.searchContent();
    // shows chip data
    this.isInSearchMode = false;
  }

  changeFilterType(n: IISContentArrayItem) {
    this.isS.dataFilter = n;
    this.searchContent();
  }

  /**
   * Used to search database with appr. UI event triggers
   * @param query query string to search database
   */
  updateSearchQuery(query?: string) {
    if (query) this.isS.userQuery = query;
    this.isInSearchMode = this.isS.userQuery?.trim().length > 0;
    this.isTrackable = this.isInSearchMode;
    this.isProcessing = true;
    this.searchContent();
  }

  searchContent() {
    // console.log('search called');
    // cancel previous requests before starting new
    if (this.searchContentSub$) {
      this.searchContentSub$.unsubscribe();
    }
    // inform table if needed
    if (this.showTabularData) {
      this.isS.triggerSearch$.next();
    }
    // console.log("dataFilter: " + this.isS.dataFilter.text);
    // process request
    this.searchContentSub$ = this.cs.postData({
      sourceid: 'calldbproc', info: {
        procname: 'is_data_proc',
        vals: [this.isS.userQuery, this.cs.user_session.id, this.isS.dataFilter.id]
      }
    })
      .pipe(
        tap(
          (resp: any) => {
            // console.log(resp);
            const { response } = resp;
            const bestMatches: any[] = response[0];
            const recentSearches: any[] = response[1];

            // console.log(`this.isInSearchMode: ${this.isInSearchMode}`);
            // console.log(`this.userQuery: ${this.userQuery}`);

            this.chipDataItems = [];
            this.bestMatchItems = [];

            if (recentSearches && !this.isInSearchMode) {
              this.chipDataItems = recentSearches.slice(0, this.MAX_CHIP_ITEMS).map(el => {
                const chipItem: IChipItem = {
                  id: ChipDataTypes.TYPE_RECENT_SEARCHES,
                  text: el.gs_query
                };
                return chipItem;
              });
            } else if (bestMatches && this.isInSearchMode) {
              // show keyword suggestions
              bestMatches.slice(0, this.MAX_CHIP_ITEMS).forEach(el => {
                el.suggestions?.split(',')?.map(e => {
                  // chip item
                  const chipItem: IChipItem = {
                    id: ChipDataTypes.TYPE_SUGGESTIONS,
                    text: e
                  };
                  this.chipDataItems.push(chipItem);
                });

                // child_items
                // console.log(el);
                el.data = el.data.replace(/[\x00-\x1f]*/g, '');
                const childItems = JSON.parse(el.data);
                this.bestMatchItems.push({
                  contentType: el.content_type,
                  childItems: childItems
                });
              });
            }
            // if no "Best Matches" were found, move to tabular search
            if (this.bestMatchItems.length == 0 && !this.showTabularData) {
              // Set mode to tabular search
              this.showTabularData = true;
            }
          }),
        switchMap(contentList => {
          if (this.isTrackable) {
            return this.trackingService.trackGlobalSearch({
              type: TrackingTypes.TYPE_GLOBAL_SEARCH,
              gs_query: this.isS.userQuery,
              uid: this.cs.user_session.id
            }).pipe(map(_ => contentList))
          } else {
            return of(contentList)
              .pipe(tap(_ => {
                // reset tracking status
                this.isTrackable = true;
              }));
          }
        })
      )
      .subscribe(
        _ => {
          this.appRef.tick();
          this.isProcessing = false;
        },
        err => {
          console.error(err);
          this.appRef.tick();
          this.isProcessing = false;
        }
      );
  }

  handleChipClick(chip: IChipItem) {
    // console.log('item clicked: ' + chip.text);
    this.updateSearchQuery(chip.text);
  }

  handleIETMContentClick(item: IIETMCoreChildItem) {
    // console.log('item: ');
    // console.log(item);
    // Highlight local search item for 'IETM Core' content
    // console.log(item);
    if (item.pc == 1) {
      this.cs.searchTermTemp = this.isS.userQuery;
    }
    // Navigate
    this.cs.navigateToPage(item.page_id);
  }

  handleIETMAnnotationClick(item: IISAnnotationChildItem) {
    this.fetchData1Sub$ = this.cs.postData({
      sourceid: 'listingdetails', info: {
        query: 'annotations', pdata: { id: 'id', value: item.id },
        selcolumns: ['id', 'page_id']
      }
    })
      .subscribe((data: any) => {
        if (data.status == 1) {
          if (data?.response) {
            const { page_id } = data.response;
            this.fetchData2Sub$ = this.cs.postData({
              sourceid: 'listingdetails', info: {
                query: 'pages', pdata: { id: 'id', value: page_id },
                selcolumns: ['id', 'page_category', 'page_module']
              }
            })
              .subscribe(
                (res: any) => {
                  if (res.status == 1) {
                    if (res?.response) {
                      const { id, page_module, page_category } = res.response;
                      this.router.navigate([`/home/pages/pagecmp/${page_module}/${page_category}/page/${id}`]);
                    }
                  }
                }, err => console.error(err))
            // this.myData = data.response;
          }
          this.cs.popdragabale();
        }
      }, err => alert(err))
  }

  ngOnDestroy() {
    // Save search state
    this.isS.saveISearchState({
      showTabularData: this.showTabularData,
      userQuery: this.isS.userQuery
    });
    this.bestMatchItems = [];
    this.chipDataItems = [];
    this.searchContentSub$?.unsubscribe();
    this.searchInputListenerSub$?.unsubscribe();
    this.fetchData1Sub$?.unsubscribe();
    this.fetchData2Sub$?.unsubscribe();
  }
}

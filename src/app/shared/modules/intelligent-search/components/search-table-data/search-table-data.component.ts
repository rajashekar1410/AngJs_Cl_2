import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ApplicationRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableDirective } from 'angular-datatables';
import { from, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { IPageModule } from 'src/app/core/models/page-module';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IISAnnotationChildItem, ISContentTypes } from '../../models/intelligent-search';
import { ISService } from '../../services/i-s/i-s.service';

@Component({
  selector: 'is-search-table-data',
  templateUrl: './search-table-data.component.html',
  styleUrls: ['./search-table-data.component.scss']
})
export class SearchTableDataComponent implements OnInit, AfterViewInit, OnDestroy {

  public searchdtOptions: DataTables.Settings = {};
  public searchlistid = 0;

  @ViewChild(DataTableDirective, { static: false })
  private datatableElement: DataTableDirective;

  private dtInstanceSub: Subscription = null;

  contentList = [];

  fetchData1Sub$: Subscription = null;
  fetchData2Sub$: Subscription = null;
  loadStateSub$: Subscription = null;
  listenForSearchEventSub$: Subscription = null;

  // data filter stuff
  dataFilterTypes = ISContentTypes;

  // toggled using DT processing event
  isProcessing = false;

  // tracks module name filter
  selectedModule: IPageModule = null;

  constructor(
    public cs: CommonService,
    private http: HttpClient,
    public router: Router,
    private appRef: ApplicationRef,
    public isS: ISService
  ) { }

  ngOnInit() {
    // Init data tables
    this.initDTOptions();
  }

  ngAfterViewInit() {
    const self = this;
    // Load global search state
    const state = self.isS.loadASearchState();
    if (!state) {
      this.isS.loadPreviousState = false;
    }
    this.loadStateSub$ = from(this.datatableElement.dtInstance)
      .pipe(
        filter(_ => this.isS.loadPreviousState),
        tap(i => {
          // console.log('loading state');
          const processingEventName = 'processing.dt';
          i.on(processingEventName, (_, __, isProcessing) => { self.isProcessing = isProcessing });
          // Set vars
          this.isS.userQuery = state.searchQuery;
          this.isS.dataFilter = state.dataFilter;
          // request search
          this.triggerSearch();
          /**
           * page no can only be set AFTER search has finished
           * and we don't have 'reliable' callback for it.
           * `search.dt` fires on every search request, not when search finished
           */
          const poll = setInterval(() => {
            // data changed?
            if (!this.isProcessing) {
              try {
                if (self.contentList.length > 0) {
                  /**
                   * update page no
                   * Note: this will throw error when `state.pageNo` > total pagination length
                   * it is silently caught and search is reloaded to reset state.
                   * DO NOT use `i.page(0).draw(false)` here
                   */
                  i.page(state.pageNo).draw(false);
                }
                // console.log('page draw requested');
              } catch (_) {
                // reset search
                console.warn('unable to load pagination state');
                self.triggerSearch();
              }
              // cleanup
              clearInterval(poll);
              // reset state to enable two-way binding for `dataFilter`, `searchQuery`
              this.isS.loadPreviousState = false;
              i.off(processingEventName);
            }
          }, 3000) // every 3 secs
        })
      )
      .subscribe(
        _ => {
          this.loadStateSub$.unsubscribe();
        },
        err => {
          console.error(err);
          this.loadStateSub$.unsubscribe();
        }
      );

    // Listen for search event
    this.listenForSearchEventSub$ = this.isS.triggerSearch$.subscribe(_ => {
      this.triggerSearch();
    });
  }

  initDTOptions() {
    const self = this;
    this.searchdtOptions = {
      language: {
        emptyTable: 'No results found'
      },
      dom: 'rtp',
      pageLength: 15, serverSide: true, processing: true, searching: true,
      searchDelay: 1000,
      destroy: true,
      lengthChange: true, order: [[3, "asc"]], scrollY: "calc(100vh - 420px)", scrollX: true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        // search stuff
        dataTablesParameters['search']['value'] = self.isS.userQuery;
        dataTablesParameters['searchquery'] = dataTablesParameters['search']['value'];
        dataTablesParameters['contentType'] = self.isS.dataFilter.id;
        dataTablesParameters['moduleId'] = self.selectedModule?.id || -1;

        this.searchlistid = dataTablesParameters['start'];
        dataTablesParameters['user_type'] = this.cs.user_session.user_type;
        // cancel previous searches before starting new
        if (this.dtInstanceSub) {
          this.dtInstanceSub.unsubscribe();
        }
        // don't hit server when search query is empty
        if (self.isS.userQuery.length == 0) {
          callback({
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
          });
          return;
        }
        // console.log("dataFilter: "+this.isS.dataFilter.text);
        this.dtInstanceSub = this.http.post(`${this.cs.apiUrl}search`, dataTablesParameters)
          .pipe(
            filter(_ => self.isS.userQuery.length > 0)
          )
          .subscribe((resp: any) => {
            // console.log("table searching for: "+self.isS.userQuery);
            //alert(JSON.stringify(resp));
            this.contentList = [...resp.data];
            setTimeout(() => {
              $('#tablelistid').DataTable().columns.adjust();
            }, 300);
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: []
            });
          },
            error => {
              console.error(error);
              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: []
              });
            });
      },
      columns: [
        { data: 'title' },
        { data: 'page_category' },
        { data: 'module_name' },
        { data: 'id' }
      ],
      columnDefs: [
        { orderable: false, targets: [0] },
        { targets: [0, 1, 2], visible: true },
        { targets: '_all', visible: false }
      ],
      drawCallback: () => {
        // refresh
        self.appRef.tick();
        // adjust column width on pagination
        $('#searchlist_table').DataTable().columns.adjust();
      }
    };
  }

  triggerSearch() {
    this.loadStateSub$?.unsubscribe();
    // process request
    this.datatableElement?.dtInstance.then(i => {
      this.contentList = [];
      // reset module filter
      if (this.isS.userQuery.length == 0) {
        this.selectedModule = null;
      }
      i.search(this.isS.userQuery).draw();
    });
  }

  opensearch(item) {
    this.datatableElement.dtInstance.then(instance => {
      const { id, page_category } = item;
      // save search info
      const pageNo = instance?.page();
      if (pageNo >= 0) {
        this.isS.saveASearchState({
          pageNo,
          dataFilter: this.isS.dataFilter,
          searchQuery: this.isS.userQuery
        });
      }

      // Highlight local search item for 'IETM Core' content
      if (page_category == 1) {
        // fix: search highlight doesn't work 2nd time as `instance.search()` is empty string :/
        this.cs.searchTermTemp = this.isS.userQuery;
        this.cs.searchTerm = '';
      }
      // Navigate
      this.cs.navigateToPage(id);

    })
      .catch(err => {
        console.error(err);
        this.cs.openGrowl('', 'Status', 'Internal error.')
      });
  }

  handleIETMAnnotationClick(item: IISAnnotationChildItem) {
    this.datatableElement.dtInstance.then(instance => {
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
                        // save search info
                        const pageNo = instance?.page();
                        // console.log(pageNo);
                        if (pageNo >= 0) {
                          this.isS.saveASearchState({
                            pageNo,
                            dataFilter: this.isS.dataFilter,
                            searchQuery: this.isS.userQuery
                          });
                        }
                        this.router.navigate([`/home/pages/pagecmp/${page_module}/${page_category}/page/${id}`]);
                      }
                    }
                  }, err => console.error(err))
              // this.myData = data.response;
            }
          }
        }, err => alert(err))
    });
  }


  ngOnDestroy() {
    this.dtInstanceSub?.unsubscribe();
    this.fetchData1Sub$?.unsubscribe();
    this.fetchData2Sub$?.unsubscribe();
    this.loadStateSub$?.unsubscribe();
    this.listenForSearchEventSub$?.unsubscribe();
  }

}

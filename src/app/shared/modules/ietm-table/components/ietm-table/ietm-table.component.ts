
import { Component, ViewChild, OnInit, OnDestroy, Input, Output } from '@angular/core';

import { PrintDataTypes } from 'src/app/shared/modules/print-data/models/print-data-type';
import { Subject, Subscription } from 'rxjs';
import { DataTableDirective } from 'angular-datatables';
import { IETMTableEventSubTypes, IETMTableEventTypes, IIETMTableEvent } from '../../models/emit-event-type';
import { PrintDataService } from '../../../print-data/services/print-data.service';
import { IIETMTableContentFilter } from '../../models/content-filter';
import { IetmTableService } from '../../services/ietm-table/ietm-table.service';

declare var $: JQueryStatic;

@Component({
  selector: 'app-ietm-table',
  templateUrl: './ietm-table.component.html',
  styleUrls: ['./ietm-table.component.scss']
})
export class IetmTableComponent implements OnInit, OnDestroy {

  @ViewChild(DataTableDirective) dtElement: DataTableDirective;
  @Output() tableInstance = new Subject<DataTables.Api>();
  @Input() dtOptions: DataTables.Settings = {};
  @Input() dtTrigger = new Subject();
  @Input() dtFilters = {};

  // print stuff
  @Input() printEnabled = false;
  @Input() printContentType = PrintDataTypes.TYPE_TABLE;
  @Input() printTableSelector = '.table';
  private printDataSub$: Subscription = null;
  /** Set to `false` to use custom Print listener. 
   * 
   * Listen for `IETMTableEventTypes.TYPE_PRINT` event type in `eventEmitter` */
  @Input() useInternalPrint = true;

  @Input() contentFilterEnabled = true;
  @Input() contentFilterData = new Array<IIETMTableContentFilter>();
  @Input() contentFilterFunction: Function = null;
  selectedContentFilter: IIETMTableContentFilter = null;

  eventEmitterTypes = IETMTableEventTypes;
  @Output() eventEmitter = new Subject<IIETMTableEvent>();

  // select/deselect buttons
  @Input()
  enableSelectDeselect = false;
  // tracks `Select All`, `Deselect` button states
  isRowUnSelected = true;
  
  // time to trigger setInterval to setup post init events (in millis)
  postInitIntervalTime = 600;
  isTableInitialised = false;

  @Input() deleteTableName: string = null;

  tableEventSub$: Subscription = null;

  @Input()
  enableAddButton = false;

  @Input()
  enableDelButton = false;

  constructor(
    private printDataService: PrintDataService,
    private tableS: IetmTableService
  ) { }

  ngOnInit(): void {
    this.validateContentFilter();

    // do-while until table instance is available
    const initInterval = setInterval.call(this, () => {
      if (this.isTableInitialised) {
        clearInterval(initInterval);
        return;
      }
      this.postInit();
    }, this.postInitIntervalTime);
  }

  async postInit() {
    // early exit if table instance unavailable
    if (!this.dtElement) return;
    if (!this.dtElement.dtInstance) return;

    const tableInstance = await this.dtElement.dtInstance;
    // init select checkbox stuff when needed
    if (this.dtOptions.select) {
      this.initSelectCheckboxListener();
    }


    // listen for parent component events
    this.tableEventSub$ = this.tableS.eventEmitter.subscribe(
      event => {
        switch (event.type) {
          case IETMTableEventTypes.TYPE_ITEM_DELETE:
            this.deleteHandler(true);
            break;
        }
      });

    // emit tableInstance value
    this.tableInstance.next(tableInstance);

    // job done
    this.isTableInitialised = true;
  }

  initSelectCheckboxListener() {
    const self = this;
    this.dtElement.dtInstance.then(i => {
      i.on('page', function () {
        _initSelectEmit();
      });

      function _initSelectEmit() {
        i.on('select deselect', function (e, dt) {
          const type = e.type;
          const rowData: any[] = dt.rows({ selected: true }).data().toArray();
          self.onEmitEvent(IETMTableEventTypes.TYPE_SELECT_CHECKBOX, { type, data: rowData });
          self.isRowUnSelected = type != 'select' && rowData.length == 0;
        });
      }
      _initSelectEmit();
    });
  }

  validateContentFilter() {
    if (!this.contentFilterEnabled) return;

    if (this.contentFilterData.length == 0) {
      console.warn('Content filter data not specified, aborting.');
      this.contentFilterEnabled = false;
    } else if (!this.contentFilterFunction) {
      console.warn('Content filter function not specified, aborting.');
      this.contentFilterEnabled = false;
    } else if (!this.deleteTableName) {
      console.warn('Content delete table name not specified, aborting.');
      this.contentFilterEnabled = false;
    } else {
      // default response
      this.selectedContentFilter = this.contentFilterData[0];
    }
  }

  printContentHandler() {
    if (this.useInternalPrint) {
      this.printData();
    } else {
      this.onEmitEvent(IETMTableEventTypes.TYPE_PRINT, IETMTableEventSubTypes.TYPE_TASK_INIT);
    }
  }

  filterContentHandler(newType: IIETMTableContentFilter) {
    this.selectedContentFilter = newType;

    // apply content filter
    this.contentFilterFunction(newType.data);
    this.reloadTable();
    // inform user
    this.onEmitEvent(IETMTableEventTypes.TYPE_FILTER, newType);
  }

  addHandler() {
    // inform user
    this.onEmitEvent(IETMTableEventTypes.TYPE_ITEM_ADD);
  }

  deleteHandler(isDeleteConfirmed = false) {
    this.dtElement.dtInstance.then(i => {
      const rows = i.rows({ selected: true }).data().toArray().map(el => el.id);
      if (rows.length == 0) return;
      // inform user of INIT if delete not confirmed
      if (!isDeleteConfirmed) {
        this.onEmitEvent(IETMTableEventTypes.TYPE_ITEM_DELETE, IETMTableEventSubTypes.TYPE_TASK_INIT);
        return;
      }
      // process request
      const sub$ = this.tableS.recordsDeleteMultiple(rows, this.deleteTableName)
        .subscribe(
          _ => {
            // reload table
            i.ajax.reload();
            // inform user
            this.onEmitEvent(IETMTableEventTypes.TYPE_ITEM_DELETE, IETMTableEventSubTypes.TYPE_TASK_SUCCESS);
            // reset UI
            this.rowSelectionHandler(false);
            sub$.unsubscribe();
          },
          err => {
            console.error(err);
            // inform user
            this.onEmitEvent(IETMTableEventTypes.TYPE_ITEM_DELETE, IETMTableEventSubTypes.TYPE_TASK_FAILED);
            sub$.unsubscribe();
          }
        );
    });
  }

  rowSelectionHandler(selected: boolean) {
    this.isRowUnSelected = !selected;
    this.dtElement.dtInstance.then(i => {
      if (selected) {
        i.rows().select();
      } else {
        i.rows().deselect();
      }
    });
  }

  reloadTable() {
    this.dtElement?.dtInstance?.then(i => i.ajax.reload());
  }

  printData() {
    const self = this;
    // hide last column + rows of table
    const thSelector = `${this.printTableSelector} thead th:last-child`;
    const tbSelector = `${this.printTableSelector} tbody td:last-child`;
    // TODO: improve selection accuracy
    const checkboxSelector = 'input:checkbox';
    $(thSelector).hide();
    $(tbSelector).hide();
    $(checkboxSelector).hide()
    // print request
    const headers = $(`${this.printTableSelector} thead`).html();
    const tbody = $(`${this.printTableSelector} tbody`).html();
    // process request
    this.printDataSub$ = this.printDataService.printContent({
      data: {
        thead: headers,
        tbody
      },
      type: self.printContentType
    })
      /*.pipe(
        concatMap(res => {
          const annotationEvent: ITrackAnnotationEvent = {
            annotationName: '',
            event: TrackAnnotationEvent.TYPE_ANT_PRINTED,
            privacy: -1
          }
          return this.trackingService.trackAnnotationEvent({
            uid: this.cs.user_session.id,
            type: TrackingTypes.TYPE_ANNOTATIONS,
            data: JSON.stringify(annotationEvent),
          }).pipe(map(_ => res))
        })
      )*/
      .subscribe(
        _ => {
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
          $(checkboxSelector).show();
          // inform user
          this.onEmitEvent(IETMTableEventTypes.TYPE_PRINT, IETMTableEventSubTypes.TYPE_TASK_SUCCESS);
        },
        err => {
          console.error(err);
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
          $(checkboxSelector).show();
          // inform user
          this.onEmitEvent(IETMTableEventTypes.TYPE_PRINT, IETMTableEventSubTypes.TYPE_TASK_FAILED);
        }
      )
  }

  onEmitEvent(type: IETMTableEventTypes, data?: any) {
    this.eventEmitter.next({
      type,
      data
    });
  }

  ngOnDestroy(): void {
    this.printDataSub$?.unsubscribe();
    this.dtTrigger?.unsubscribe();
    this.eventEmitter?.unsubscribe();
    this.tableEventSub$?.unsubscribe();
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { LRMService } from '../../long-running-modal/services/l-r-m.service';
import { IPrintData, IPrintDataSSR, IPrintDataTableItem, PrintDataTypes } from '../models/print-data-type';

@Injectable({
  providedIn: 'root'
})
export class PrintDataService {

  constructor(
    private cs: CommonService,
    private lrmS: LRMService,
    private http: HttpClient
  ) { }

  printTrigger$ = new Subject<any>();

  printContent(printData: IPrintData) {
    let { data, type, title } = printData;
    // process data
    if (!title) {
      title = this.cs.page_header;
    }
    if (type == PrintDataTypes.TYPE_TABLE) {
      data = <IPrintDataTableItem>data;
      data = `<table class="container display main-content table table-bordered dataTable no-footer"><thead>${data.thead}</thead><tbody>${data.tbody}</tbody></table>`;
    }
    // console.log('printContent requested.');
    this.lrmS.showBackdrop();
    return this.cs.postData({ sourceid: 'printhtmlcontent', info: { sevurl: this.cs.apiUrl, inpageid: this.cs.selpage_id, data, title, user_name: this.cs.user_session.user_name, employee_id: this.cs.user_session.employee_id } })
      .pipe(
        map(data => {
          if (data['status'] == '1') {
            // console.log("//////=============" + data['response']['filename']);
            fetch(data['response']['filename']).then(_ => {
              this.downloadFile(data['response']['filename']).subscribe(
                res => {
                  this.printTrigger$.next({
                    data: res
                  });
                });
            })
          } else {
            this.cs.openGrowl('', "Status", "Some error ocured");
          }
        }),
        tap(_ => {
          this.lrmS.hideBackdrop()
        }),
        catchError(e => {
          this.lrmS.hideBackdrop();
          return throwError(e);
        })
      );
  }

  printContentSSR(printData: IPrintDataSSR) {
    // set default title
    if (!printData.title) {
      printData.title = this.cs.page_header;
    }
    // LRM backdrop
    this.lrmS.showBackdrop();
    // process request
    return this.cs.postData({
      sourceid: 'listings-print', info: {
        ...printData,
        sevurl: this.cs.apiUrl
      }
    })
      // TODO: merge below code with `printData` function
      .pipe(
        map(data => {
          console.log(data);
          if (data['status'] == '1') {
            // console.log("//////=============" + data['response']['filename']);
            fetch(data['response']['filename']).then(_ => {
              this.downloadFile(data['response']['filename']).subscribe(
                res => {
                  this.printTrigger$.next({
                    data: res
                  });
                });
            })
          } else {
            this.cs.openGrowl('', "Status", "Some error ocured");
          }
        }),
        tap(_ => {
          this.lrmS.hideBackdrop()
        }),
        catchError(e => {
          this.lrmS.hideBackdrop();
          return throwError(e);
        })
      );
  }

  private downloadFile(url: string) {
    return this.http.get(url, {
      headers: new HttpHeaders({
        'Content-Type': 'application/octet-stream',
      }), responseType: 'blob'
    }).pipe(
      tap(
        // Log the result or error
        data => {
          return new Blob([data], { type: "application/pdf" });
        },
        error => console.log(error)
      )
    );
  }
}

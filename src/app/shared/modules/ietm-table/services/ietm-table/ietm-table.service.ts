import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IIETMTableEvent } from '../../models/emit-event-type';

@Injectable({
  providedIn: 'root'
})
export class IetmTableService {

  constructor(
    private cs: CommonService
  ) { }

  eventEmitter = new Subject<IIETMTableEvent>();

  recordsDeleteMultiple(rows: number[], tableName: string) {
    return this.cs.postData({ sourceid: 'list_rowdel', info: { query: tableName, column: 'id', selids: rows } });
  }
}

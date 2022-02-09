import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogsListingComponent } from './components/logs-listing/logs-listing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { LogsRadarOpsComponent } from './components/logs-radar-ops/logs-radar-ops.component';
import { LogsSensorActComponent } from './components/logs-sensor-act/logs-sensor-act.component';
import { LogsRadarOpsListingComponent } from './components/logs-radar-ops-listing/logs-radar-ops-listing.component';
import { MomentModule } from 'ngx-moment';
import { LogsDelComponent } from './components/logs-del/logs-del.component';
import { LogsSensorActListingComponent } from './components/logs-sensor-act-listing/logs-sensor-act-listing.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { DpDatePickerModule } from 'ng2-date-picker';



@NgModule({
  declarations: [
    LogsListingComponent,
    LogsRadarOpsComponent,
    LogsSensorActComponent,
    LogsRadarOpsListingComponent,
    LogsDelComponent,
    LogsSensorActListingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTablesModule,
    MomentModule,
    BsDatepickerModule.forRoot(),
    DpDatePickerModule
  ]
})
export class LogsModule { }

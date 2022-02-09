import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { concat, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { LogTypes } from '../../models/log-types';

@Component({
  selector: 'app-logs-listing',
  templateUrl: './logs-listing.component.html',
  styleUrls: ['./logs-listing.component.scss']
})
export class LogsListingComponent implements OnInit, OnDestroy {

  constructor(
    public cs: CommonService,
    private route: ActivatedRoute,
  ) { }

  routeParamsSub$: Subscription = null;

  logTypes = LogTypes;

  ngOnInit(): void {
    // listen to route params
    this.routeParamsSub$ = concat(
      this.cs.triggerLogsEmittedCNP$,
      this.route.params 
    )
    .subscribe(params => {
      const { pageid } = params;
      this.cs.selectedLogId = pageid;
    });
  }

  ngOnDestroy() {
    this.routeParamsSub$?.unsubscribe();
  }

}

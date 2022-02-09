import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common/common.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private cs: CommonService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const sessionToken = this.cs.getSessionToken() || 'ZW5hMjBwamgxNToyNmJhZjBjZjQ5Y2Q4ZmM4NGE5NGYxMmVhNGJiM2NmZA==';

    if (!request.url.includes('glossary_upload')) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
          'Authorization': "Bearer " + sessionToken
        }
      });
    } else {
      // file upload request
      request = request.clone({
        setHeaders: {
          'Authorization': "Bearer " + sessionToken
        }
      });
      
    }
    return next.handle(request).pipe(catchError(err => {
      if (err instanceof HttpErrorResponse) {
        // unauthorized access
        if (err.status == 401) {
          this.cs.openGrowl('', "Error", "Unauthorized access detected, please login again.");
          this.cs.userLogout(false);
        } else {
          this.cs.openGrowl('error', err.status, err.statusText);
        }
      }
      console.error(err);
      return throwError(err);
    }));
  }
}

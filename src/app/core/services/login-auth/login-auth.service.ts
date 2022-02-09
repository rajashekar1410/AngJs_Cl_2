import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../common/common.service';

@Injectable({
  providedIn: 'root'
})
export class LoginAuthService {

  constructor(
    private router: Router,
    private cs: CommonService
  ) { }

  async canActivate() {
    const { user_session: us, getMachineId } = this.cs;
    const machineId = await getMachineId();
    const res = us && us.id != '' && us.machine_id === machineId;
    if (!res) {
      // perform logout
      this.cs.userLogout(false);
      return false;
    }
    return true;
  }
}

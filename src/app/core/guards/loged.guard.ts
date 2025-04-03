import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const logedGuard: CanActivateFn = (route, state) => {
  const _router = inject(Router)
  const _authService = inject(AuthService)

  if (localStorage.getItem("retailToken") !== null) {
    _router.navigate(["main/home"])
    return false;
    
  }else {
    return true;
  }
};

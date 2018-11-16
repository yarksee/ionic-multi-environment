import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Environment as ENV } from '@app/env'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {
    let e = ENV;
    console.log(ENV.mode);
    debugger;
  }

}

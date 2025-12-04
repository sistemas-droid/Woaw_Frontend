import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-soporte',
  templateUrl: './soporte.page.html',
  styleUrls: ['./soporte.page.scss'],
  standalone: false
})
export class SoportePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  sendMail() {
    window.location.href = "mailto:comercial@wo-aw.com";
  }

}

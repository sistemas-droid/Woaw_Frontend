import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-welcome-lote',
  templateUrl: './welcome-lote.page.html',
  styleUrls: ['./welcome-lote.page.scss'],
  standalone: false,
})
export class WelcomeLotePage implements OnInit {

  canAccess = false;
  private yaCelebre = false;

  nombreLote: string = '';
  idLote: string = '';

  private readonly guiaUrl =
    'https://storage.googleapis.com/wo-aw/docs/Guia-Loteros.pdf';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {

    // 📌 Obtener parámetros dinámicos desde la URL
    this.route.paramMap.subscribe(params => {
      this.nombreLote = params.get('nombre') ?? '';
      this.idLote = params.get('id') ?? '';
    });

    const flag = localStorage.getItem('canAccessWelcomeLote');

    if (flag === 'true') {
      this.canAccess = true;
      await this.celebrar();   // 🎉 confeti al entrar
    } else {
      this.router.navigateByUrl('/lotes');
    }
  }

  ionViewDidLeave() {
    this.clearAccessFlag();
  }

  private clearAccessFlag() {
    localStorage.setItem('canAccessWelcomeLote', 'false');
  }

  // 🚀 Enviar a SUBIR DOCUMENTOS con nombre + id
  irASubirDocumentos() {
    this.clearAccessFlag();
    this.router.navigateByUrl(
      `/lote/documentos/${this.nombreLote}/${this.idLote}`
    );
  }

  irASubirCarro() {
    this.clearAccessFlag();
    this.router.navigateByUrl('/new-car');
  }

  omitir() {
    this.clearAccessFlag();
    this.router.navigateByUrl('/lotes');
  }

  // 🎉 Confeti
  private async celebrar() {
    if (this.yaCelebre) return;
    this.yaCelebre = true;

    const module = await import('canvas-confetti');
    const confetti = module.default || module;

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // 📘 Abrir Guía según plataforma
  async abrirGuia() {
    const plataforma = Capacitor.getPlatform();

    if (plataforma === 'web') {
      window.open(this.guiaUrl, '_blank');
      return;
    }

    if (plataforma === 'android') {
      const link = document.createElement('a');
      link.href = this.guiaUrl;
      link.download = 'Guia-Loteros.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (plataforma === 'ios') {
      await Browser.open({
        url: this.guiaUrl,
        presentationStyle: 'popover'
      });
      return;
    }

    window.open(this.guiaUrl, '_blank');
  }
}

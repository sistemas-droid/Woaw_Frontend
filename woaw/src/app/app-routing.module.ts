import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./guards/auth.guard";
import { NotAuthGuard } from "./guards/notauth.guard";
import { AuthPhoneGuard } from "./guards/auth-phone.guard";
/* import { asesoresGuard } from './guards/asesores-guard'; */
const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  {
    path: "inicio",
    loadChildren: () =>
      import("./pages/inicio/inicio.module").then((m) => m.InicioPageModule),
    canActivate: [NotAuthGuard],
    data: { title: "Iniciar sesión | woaw" },
  },
  /* {
    path: "asesores",
    loadChildren: () =>
    import("./pages/asesores/asesores.module").then(
      (m) => m.AsesoresPageModule
    ),
    canActivate: [asesoresGuard],
    data: { title: "Asesores | woaw" },
  }, */
  {
    path: "autenticacion-user",
    loadChildren: () =>
      import("./pages/autenticacion-user/autenticacion-user.module").then(
        (m) => m.AutenticacionUserPageModule
      ),
  },
  {
    path: "",

    children: [
      {
        path: "home",
        loadChildren: () =>
          import("./pages/home/home.module").then((m) => m.HomePageModule),
        data: { title: "Compra, vende, renta y arrenda tu auto en WOAW" },
      },
      {
        path: "seguros",
        redirectTo: "seguros/disponibles",
        pathMatch: "full",
        data: { title: "seguros | woaw" },
      },
      {
        path: "nuevos",
        loadChildren: () =>
          import("./pages/coches/nuevos/nuevos.module").then(
            (m) => m.NuevosPageModule
          ),
        data: { title: "Autos nuevos | woaw" },
      },
      {
        path: "seminuevos",
        loadChildren: () =>
          import("./pages/coches/seminuevos/seminuevos.module").then(
            (m) => m.SeminuevosPageModule
          ),
        data: { title: "Autos seminuevos | woaw" },
      },
      {
        path: "usados",
        loadChildren: () =>
          import("./pages/coches/usados/usados.module").then(
            (m) => m.UsadosPageModule
          ),
        data: { title: "Autos usados | woaw" },
      },
      {
        path: "favoritos",
        loadChildren: () =>
          import("./pages/faviritos/faviritos.module").then(
            (m) => m.FaviritosPageModule
          ),
        canActivate: [AuthGuard],
        data: { title: "Mis favoritos | woaw" },
      },
      {
        path: "mensajes",
        loadChildren: () =>
          import("./pages/mensajes/mensajes.module").then(
            (m) => m.MensajesPageModule
          ),
        canActivate: [AuthGuard],
        data: { title: "Mensajes | woaw" },
      },
      {
        path: "mis-autos",
        loadChildren: () =>
          import("./pages/coches/mis-autos/mis-autos.module").then(
            (m) => m.MisAutosPageModule
          ),
        canActivate: [AuthGuard],
        data: { title: "Mis autos publicados | woaw" },
      },
      {
        path: "update-car/:tipo/:id",
        loadChildren: () =>
          import("./pages/coches/update-car/update-car.module").then(
            (m) => m.UpdateCarPageModule
          ),
        canActivate: [AuthGuard],
        data: { title: "Editar vehículo | woaw" },
      },
      {
        path: "new-car",
        loadChildren: () =>
          import("./pages/new-car/new-car.module").then(
            (m) => m.NewCarPageModule
          ),
        canActivate: [AuthPhoneGuard],
        data: { title: "Publicar nuevo vehículo | woaw" }
      },
      {
        path: "mis-motos",
        loadChildren: () =>
          import("./pages/motos/mis-motos/mis-motos.module").then(
            (m) => m.MisMotosPageModule
          ),
        data: { title: "Mis motos publicados | woaw" },
      },
      {
        path: "m-nuevos",
        loadChildren: () =>
          import("./pages/motos/nuevos/nuevos.module").then(
            (m) => m.NuevosPageModule
          ),
        data: { title: "Motos en venta | woaw" },
      },
      {
        path: "m-seminuevos",
        loadChildren: () =>
          import("./pages/motos/seminuevos/seminuevos.module").then(
            (m) => m.SeminuevosPageModule
          ),
      },
      {
        path: "m-usados",
        loadChildren: () =>
          import("./pages/motos/usados/usados.module").then(
            (m) => m.UsadosPageModule
          ),
      },
      {
        path: "arrendamiento",
        loadChildren: () =>
          import("./pages/arrendamiento/arrendamiento.module").then(
            (m) => m.ArrendamientoPageModule
          ),
        data: { title: "Arrendamiento | woaw" },
      },
      {
        path: "search/vehiculos/:termino",
        loadChildren: () =>
          import("./pages/search/search.module").then(
            (m) => m.SearchPageModule
          ),
      },
      {
        path: "politicas",
        loadChildren: () =>
          import("./pages/politicas/politicas.module").then(
            (m) => m.PoliticasPageModule
          ),
      },
      {
        path: "eliminacion-cuenta",
        loadChildren: () =>
          import("./pages/eliminacion-cuenta/eliminacion-cuenta.module").then(
            (m) => m.EliminacionCuentaPageModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: "menu-vehiculos/:tipo",
        loadChildren: () =>
          import("./pages/menu-vehiculos/menu-vehiculos.module").then(
            (m) => m.MenuVehiculosPageModule
          ),
      },
      {
        path: "camiones/todos",
        loadChildren: () =>
          import("./pages/camiones/todos/todos.module").then(
            (m) => m.TodosPageModule
          ),
      },
      {
        path: "mis-camiones",
        loadChildren: () =>
          import("./pages/camiones/mis-camiones/mis-camiones.module").then(
            (m) => m.MisCamionesPageModule
          ),
      },
      {
        path: "conocenos",
        loadChildren: () =>
          import("./pages/nosotros/nosotros.module").then(
            (m) => m.NosotrosPageModule
          ),
      },
      {
        path: "disponibilidad-car/:id",
        loadChildren: () =>
          import("./pages/disponibilidad-car/disponibilidad-car.module").then(
            (m) => m.DisponibilidadCarPageModule
          ),
      },

      // ---- Rutas de seguros ----

      {
        path: "seguros/autos",
        loadChildren: () =>
          import("./pages/seguro/seguros/seguros.module").then(
            (m) => m.SegurosPageModule
          ),
        data: { title: "seguros | woaw" },
      },
      {
        path: "seguros/persona",
        loadChildren: () =>
          import("./pages/seguro/persona/persona.module").then(
            (m) => m.PersonaPageModule
          ),
      },
      {
        path: "seguros/poliza",
        loadChildren: () =>
          import("./pages/seguro/poliza/poliza.module").then(
            (m) => m.PolizaPageModule
          ),
        data: { title: "Crear Poliza | WOAW" }
      },
      {
        path: "seguros/disponibles",
        loadChildren: () =>
          import("./pages/seguro/elige-seguro/elige-seguro.module").then(
            (m) => m.EligeSeguroPageModule
          ),
        data: { title: "Seguros de autos" },
      },
      {
        path: 'seguros/cotiza/:tipo',
        loadChildren: () => import('./pages/seguro/cotiza-moto-camion-ert/cotiza-moto-camion-ert.module').then(m => m.CotizaMotoCamionErtPageModule)
      },
      {
        path: "seguros/ver-polizas",
        loadChildren: () =>
          import("./pages/seguro/ver-polizas/ver-polizas.module").then(
            (m) => m.VerPolizasPageModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: "seguros/detalle-poliza",
        loadChildren: () =>
          import("./pages/seguro/detalle-poliza/detalle-poliza.module").then(
            (m) => m.DetallePolizaPageModule
          ),
      },
      {
        path: 'seguros/cotizar-manual',
        loadChildren: () => import('./pages/seguro/cotizar-manual/cotizar-manual.module').then(m => m.CotizarManualPageModule)
      },



      // ---------------------
      // ----- LOTES
      // ---------------------
      {
        path: 'add-lote',
        loadChildren: () => import('./pages/lote/add-lote/add-lote.module').then(m => m.AddLotePageModule)
      },
      {
        path: 'lote',
        loadChildren: () => import('./pages/lote/lote/lote.module').then(m => m.LotePageModule)
      },
      {
        path: "lotes",
        loadChildren: () =>
          import("./pages/lote/lotes/lotes.module").then((m) => m.LotesPageModule),
        data: { title: "lotes | woaw" },
      },
      {
        path: "lote-edit/:id",
        loadChildren: () =>
          import("./pages/lote/lote-edit/lote-edit.module").then(
            (m) => m.LoteEditPageModule
          ),
        canActivate: [AuthGuard],
        data: { title: "lote | woaw" },
      },
      {
        path: "lote/:nombre/:id",
        loadChildren: () =>
          import("./pages/lote/lote/lote.module").then((m) => m.LotePageModule),
        data: { title: "lotes | woaw" },
      },
      {
        path: 'lote/welcome-lote',
        loadChildren: () => import('./pages/lote/welcome-lote/welcome-lote.module').then(m => m.WelcomeLotePageModule)
      },
      {
        path: 'lote/upload-document/:nombre/:id/:tipoDoc',
        loadChildren: () => import('./pages/lote/upload-document/upload-document.module').then(m => m.UploadDocumentPageModule)
      },
      {
        path: 'lote/documentos/:nombre/:id',
        loadChildren: () => import('./pages/lote/documentos/documentos.module').then(m => m.DocumentosPageModule)
      },
      {
        path: 'lote/welcome-lote/:nombre/:id',
        loadChildren: () => import('./pages/lote/welcome-lote/welcome-lote.module').then((m) => m.WelcomeLotePageModule)
      },
      {
        path: 'lote/lote-verificacion',
        loadChildren: () => import('./pages/lote/lote-verificacion/lote-verificacion.module').then(m => m.LoteVerificacionPageModule)
      },
      // ---------------------
      // ---------------------




      // ---------------------
      // ----- RENTA 
      // ---------------------
      {
        path: 'renta/add-coche',
        loadChildren: () => import('./pages/renta/add-coche/add-coche.module').then(m => m.AddCochePageModule)
      },
      {
        path: "edit-renta/:id",
        loadChildren: () =>
          import("./pages/edit-renta/edit-renta.module").then(
            (m) => m.EditRentaPageModule
          ),
      },
      {
        path: "reservas/:id",
        loadChildren: () =>
          import("./pages/reservas/reservas.module").then(
            (m) => m.ReservasPageModule
          ),
      },
      {
        path: "renta",
        loadChildren: () =>
          import("./pages/renta/renta-ciudades/renta-ciudades.module").then(
            (m) => m.RentaCiudadesPageModule
          ),
      },
      {
        path: "checkin/:id",
        loadChildren: () =>
          import("./pages/renta/checkin/checkin.module").then(
            (m) => m.CheckInPageModule
          ),
      },
      {
        path: "checkout/:id",
        loadChildren: () =>
          import("./pages/renta/checkout/checkout.module").then(
            (m) => m.CheckoutPageModule
          ),
      },
      {
        path: "mis-reservas",
        loadChildren: () =>
          import("./pages/renta/mis-reservas/mis-reservas.module").then(
            (m) => m.MisReservasPageModule
          ),
      },
      {
        path: "renta-ficha/:id",
        loadChildren: () =>
          import("./pages/renta-ficha/renta-ficha.module").then(
            (m) => m.RentaFichaPageModule
          ),
      },
      {
        path: "renta-coches",
        loadChildren: () =>
          import("./pages/renta-coches/renta-coches.module").then(
            (m) => m.RentaCochesPageModule
          ),
        data: { title: "renta | woaw" },
      },
      // ---------------------
      // ---------------------

      {
        path: 'soporte',
        loadChildren: () => import('./pages/soporte/soporte.module').then(m => m.SoportePageModule)
      },

      {
        path: 'asesores',
        loadChildren: () => import('./pages/asesor/asesores/asesores.module').then(m => m.AsesoresPageModule)
      },
      {
        path: 'registro-asesor',
        loadChildren: () => import('./pages/asesor/registro-asesor/registro-asesor.module').then(m => m.RegistroAsesorPageModule)
      },

      {
        path: 'asesores-edit/:id',
        loadChildren: () => import('./pages/asesor/asesores-edit/asesores-edit.module').then(m => m.AsesoresEditPageModule)
      },

      {
        path: 'asesor/perfil',
        loadChildren: () => import('./pages/asesor/perfil/perfil.module').then(m => m.PerfilPageModule)
      },

      {
        path: 'publicar',
        loadChildren: () => import('./pages/coches/publicar/publicar.module').then(m => m.PublicarPageModule)
      },

      // ---------------------
      // FICHAS 
      // ---------------------
      {
        path: "ficha/:tipo/:id",
        loadChildren: () =>
          import("./pages/ficha/ficha.module").then((m) => m.FichaPageModule),
        data: { title: "Detalle del vehículo | woaw" },
      },
      {
        path: 'fichas/autos/:id',
        loadChildren: () => import('./pages/coches/ficha-auto/ficha-auto.module').then(m => m.FichaAutoPageModule),
        data: { title: "Detalle del vehículo | woaw" },
      },
      // {
      //   path: 'ficha/motos/:id',
      //   loadChildren: () => import('./pages/motos/ficha-motos/ficha-motos.module').then(m => m.FichaMotosPageModule)
      // },
      // {
      //   path: 'ficha/camiones/:id',
      //   loadChildren: () => import('./pages/camiones/ficha-camiones/ficha-camiones.module').then(m => m.FichaCamionesPageModule)
      // },

      // ---------------------
      // ---------------------
    ],
  },
  {
    path: "**",
    loadChildren: () =>
      import("./pages/error/error.module").then((m) => m.ErrorPageModule),
    data: { title: "Página no encontrada | woaw" },
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }

---
name: Logout y foto actuar
overview: Reemplazar el ícono de logout del ejecutor en Mis Reclamos por `IconLogout`. El tema de "Tomar foto" en Actuar se descarta — en notebook el selector de archivos es el comportamiento esperado; en móvil `capture="environment"` ya funciona.
todos:
  - id: logout-icon
    content: Reemplazar IconArrowLeft por IconLogout en botón de logout del ejecutor (MisReclamosClient.tsx)
    status: completed
  - id: split-photo-inputs
    content: Separar inputs cámara/galería y dos botones de evidencia reutilizando patrón de FotoUploader
    status: cancelled
  - id: evidence-grid-css
    content: Agregar clase mis-reclamos-evidence-btn--full para botón GPS en styles.css
    status: cancelled
isProject: false
---

# Ícono de logout representativo (ejecutor)

## Contexto

En [`.anotaciones.md`](.anotaciones.md) se reportaba también un problema con "Tomar foto" en la vista Actuar. Ese comportamiento **no requiere cambios**: en notebook/desktop los navegadores ignoran `capture` y abren el selector de archivos, que es lo correcto. En móvil, el input actual con `capture="environment"` ya abre la cámara.

El único cambio pendiente es el botón de logout.

## Problema

Para el rol `ejecutor`, el header usa el mismo estilo de botón "volver" (`mis-reclamos-back-btn`) pero con `IconArrowLeft`, lo que parece navegación hacia atrás y no cierre de sesión:

```375:388:src/app/(frontend)/mis-reclamos/MisReclamosClient.tsx
<button
  className="mis-reclamos-back-btn mis-reclamos-back-btn--danger"
  title="Cerrar Sesión"
  onClick={async () => { /* logout */ }}
>
  <IconArrowLeft size={20} />
</button>
```

En el dashboard ya existe el patrón correcto con `IconLogout` en [`DashboardShell.tsx`](<src/app/(frontend)/dashboard/DashboardShell.tsx>).

## Cambio

En [`MisReclamosClient.tsx`](<src/app/(frontend)/mis-reclamos/MisReclamosClient.tsx>):

1. Agregar `IconLogout` al import de `@tabler/icons-react`.
2. Reemplazar `<IconArrowLeft size={20} />` por `<IconLogout size={20} />` en el botón de logout del ejecutor (líneas ~387).
3. Mantener `title="Cerrar Sesión"`, la clase `--danger` y la lógica de logout sin cambios.

El botón "Volver al Dashboard" para roles distintos de ejecutor sigue usando `IconArrowLeft` — sin tocar.

## Verificación

1. **Ejecutor:** en `/mis-reclamos`, el botón superior izquierdo muestra ícono de salida y cierra sesión.
2. **Admin/otros:** sigue mostrando flecha "Volver al Dashboard".

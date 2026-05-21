# Plan: Mobile UI Improvements

## Contexto
El usuario reporta que la interfaz en Android (Brave/Chromium) es difícil de usar:
- Navegación vía hamburger no es intuitiva en móvil
- Botones demasiado pequeños (< 44px touch target)
- El SVG del timer ocupa ~70% del ancho de pantalla en móvil
- Todo ocupa demasiado espacio vertical

**Solución:** Reemplazar la navegación hamburger en móvil por una bottom nav bar fija, y corregir tamaños de botones y el SVG del timer en todas las páginas.

---

## 1. NEW: `src/components/layout/BottomNav.tsx`

Componente nuevo, visible solo en móvil (`lg:hidden`). Barra fija en la parte inferior con los 5 nav items del Sidebar (mismos hrefs y labels):

```
{ href: '/dashboard',    label: 'Inicio',   icon: LayoutDashboard }
{ href: '/temporizador', label: 'Timer',    icon: Timer }
{ href: '/habits',       label: 'Hábitos',  icon: Target }
{ href: '/actividades',  label: 'Act.',     icon: Zap }
{ href: '/sessions',     label: 'Sesiones', icon: BookOpen }
```

- `fixed bottom-0 left-0 right-0 z-40 lg:hidden`
- Fondo: `bg-[var(--color-surface)] border-t border-[var(--color-border)]`
- Altura: `h-16` con `.pb-safe` (safe area para gestos de Android)
- Cada item: icon (20px) + label (9px), active state en `var(--color-accent)`
- Detectar ruta activa con `window.location.pathname`

---

## 2. MODIFY: `src/components/layout/AppLayout.tsx`

- Importar `BottomNav` y renderizarlo dentro del layout
- Añadir `pb-20 lg:pb-0` al div interior del `<main>` para que el contenido no quede tapado por la bottom nav
- Cambiar `pt-16 lg:pt-8` → `pt-4 lg:pt-8` en móvil

---

## 3. MODIFY: `src/components/timer/TimerContent.tsx`

### SVG responsive (líneas 83-114)
Envolver el SVG en un div con tamaño CSS responsivo y añadir `viewBox`:

```tsx
<div className="relative w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] mx-auto mb-6">
  <svg viewBox="0 0 300 300" className="w-full h-full transform -rotate-90">
    {/* sin cambios internos — viewBox mantiene el sistema de coordenadas */}
  </svg>
  <div className="absolute inset-0 ..."> {/* sin cambios */}
```

La `circumference = 2 * Math.PI * 140` sigue siendo correcta (coordenadas SVG, no CSS).

### Botones de control (líneas 118-147)
- Reset: `w-10 h-10` → `w-12 h-12`
- Skip: `w-10 h-10` → `w-12 h-12`

### Botones de actividad (línea 189)
- `px-3 py-2` → `px-3 py-3`

### Indicadores de ciclo (línea 206)
- `w-8 h-8` → `w-10 h-10`

### SessionNotesForm — botones mood/productividad (líneas 336, 356)
- `py-2` → `py-3`

### SessionNotesForm — submit/cancel (líneas 369, 376)
- `py-2.5` → `py-3.5`

---

## 4. MODIFY: Resto de páginas de contenido

Leer antes de editar: `DashboardContent.tsx`, `HabitsContent.tsx`, `ActivitiesContent.tsx`, `SessionsContent.tsx`

Cambios generales:
- Progress bars con ancho fijo (`w-24`) → `flex-1`
- Botones de acción pequeños: añadir `py-1` extra donde `py` < 2
- Activity cards con layout apretado: revisar si necesitan `flex-wrap`

---

## 5. MODIFY: `src/styles/global.css`

Añadir utility class para safe area de Android/iOS:

```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## Resumen de archivos a tocar

| Archivo | Acción |
|---------|--------|
| `src/components/layout/BottomNav.tsx` | **CREAR** |
| `src/components/layout/AppLayout.tsx` | Añadir BottomNav, ajustar padding |
| `src/components/timer/TimerContent.tsx` | SVG responsive, touch targets |
| `src/styles/global.css` | Añadir `.pb-safe` |
| `src/components/DashboardContent.tsx` | Touch targets, progress bars |
| Otros `*Content.tsx` | Touch targets según revisión |

## Verificación

1. Abrir en DevTools con perfil móvil (375px ancho)
2. Confirmar que bottom nav muestra 5 items y navega correctamente
3. Confirmar que el timer SVG mide ~200px en móvil y ~280px en tablet
4. Confirmar que reset/skip/activity buttons son al menos 44px de alto
5. Confirmar que el contenido no queda tapado por la bottom nav (`pb-20`)
6. Verificar en dispositivo real Android/Brave

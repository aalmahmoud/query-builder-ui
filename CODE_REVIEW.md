# Code Review: querydsl-admin

## Overall Impression

Well-organized Angular 21 admin application. The folder structure follows good conventions (core/features/shared), uses modern Angular patterns (standalone components, signals, functional guards), and the feature set is solid. Below are the remaining issues beyond duplication, grouped by category.

---

## Security

### JWT Token Stored Insecurely in localStorage

`localStorage` is accessible to any JavaScript on the page, making the token vulnerable to XSS attacks. Consider using `HttpOnly` cookies instead.

**File:** `src/app/core/auth/auth.service.ts`

### No Token Expiry Check

The app blindly uses whatever token is in `localStorage` until the server returns a 401. A proactive expiry check (e.g. decoding the JWT `exp` claim) would avoid unnecessary failed requests and improve UX.

**File:** `src/app/core/auth/auth.service.ts`

### Token Stored Redundantly

The token is written to both `auth_token` (raw) and inside the `auth_user` JSON blob. This doubles the attack surface and introduces a subtle sync risk if one is cleared without the other.

**File:** `src/app/core/auth/auth.service.ts` (lines 8–9, 35–36)

---

## Reliability

### Dashboard forkJoin Has No Error Handler

If any of the four count requests fail, the entire `forkJoin` errors out silently. The dashboard shows zeros with no indication of failure.

**File:** `src/app/features/dashboard/dashboard.component.ts` (lines 36–48)

```typescript
// Current — no error callback
forkJoin({ ... }).subscribe({
  next: (data) => { ... },
});

// Fixed
forkJoin({ ... }).subscribe({
  next: (data) => { ... },
  error: () => this.notification.error('Failed to load dashboard stats'),
});
```

### ErrorResponse / ValidationError Interfaces Are Defined but Never Used

`query.model.ts` exports `ErrorResponse` and `ValidationError` but no code references them. Either wire them into a centralized error handler or remove them.

**File:** `src/app/core/models/query.model.ts` (lines 51–64)

### No Centralized Error Handling Strategy

Error handling is ad-hoc per `.subscribe()` call:

- Form components extract `err.error?.message`
- List components use generic strings only
- Dashboard has no error handling at all

Consider an Angular `ErrorHandler` or a shared utility:

```typescript
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.message ?? fallback;
  }
  return fallback;
}
```

---

## Configuration

### Production API URL Points to localhost

`environment.prod.ts` has `apiUrl: 'http://localhost:8080'` — identical to dev. This will break any real deployment.

**File:** `src/environments/environment.prod.ts`

---

## Performance

### `getResourceGroups()` Rebuilds on Every Change Detection Cycle

This method is called from the template but allocates a new `Map`, iterates all permissions, and builds a new array on every CD cycle. Since the component already uses signals, this should be a `computed()` signal.

**File:** `src/app/features/roles/role-form/role-form.component.ts` (lines 76–84)

```typescript
// Current — called from template, runs every cycle
getResourceGroups(): { resource: string; permissions: Permission[] }[] { ... }

// Fixed — computed once per signal change
resourceGroups = computed(() => {
  const map = new Map<string, Permission[]>();
  for (const p of this.allPermissions()) {
    const list = map.get(p.resource) ?? [];
    list.push(p);
    map.set(p.resource, list);
  }
  return Array.from(map.entries()).map(([resource, permissions]) => ({ resource, permissions }));
});
```

### No OnPush Change Detection

Despite using signals, none of the 10+ components set `ChangeDetectionStrategy.OnPush`. This means Angular runs full change detection on every browser event, negating much of the performance benefit of signals.

---

## Memory

### No Subscription Cleanup

Every component that calls `.subscribe()` never unsubscribes. While HTTP observables auto-complete, dialog `afterClosed()` and mid-navigation scenarios can leak.

```typescript
// Fix with DestroyRef + takeUntilDestroyed
private destroyRef = inject(DestroyRef);

this.someObservable$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);
```

### downloadBlob Leaks Object URLs

`RoleListComponent` and `PermissionListComponent` inline the blob download logic and never call `URL.revokeObjectURL()`, leaking browser memory on each export. `UserListComponent` handles this correctly and should be the model.

**Files:** `src/app/features/roles/role-list/role-list.component.ts` (line 98), `src/app/features/permissions/permission-list/permission-list.component.ts` (line 98)

---

## Validation

### Template-Driven Forms with No Validation

All forms use `FormsModule` with plain object binding. There are no `Validators`, no `FormGroup`, no custom validation, and no per-field error messages.

Missing validations:

- No email format validation
- No password strength enforcement
- No min/max length on any field
- No nationalId format check

`ReactiveFormsModule` with typed `FormGroup` would significantly improve correctness and testability.

---

## Maintainability

### Role Strings Are Scattered Magic Strings

`'ROLE_ADMIN'`, `'ROLE_MANAGER'`, `'ROLE_USER'` appear as raw literals in at least 4 files (`app.routes.ts`, `layout.component.ts`, `dashboard.component.html`, templates). A single change requires finding and updating every occurrence.

```typescript
// Fix — define once, use everywhere
export const Roles = {
  ADMIN: 'ROLE_ADMIN',
  MANAGER: 'ROLE_MANAGER',
  USER: 'ROLE_USER',
} as const;
```

### Dead @ViewChild References

All three list components declare `@ViewChild(MatPaginator)` and `@ViewChild(MatSort)` with non-null assertions (`!`), but these are never referenced in TypeScript — pagination and sorting are handled via server-side requests. This is dead code.

### Inconsistent API Style

The codebase mixes old and new Angular patterns in the same project:

| Pattern | Old Style (used in) | Modern Style (used in) |
|---|---|---|
| Dependency injection | `constructor(private http: HttpClient)` — services, components | `inject(HttpClient)` — guards, interceptor |
| Component inputs | `@Input() fields` — QueryBuilder | `input()` signal function |
| Component outputs | `@Output() search = new EventEmitter()` — QueryBuilder | `output()` signal function |
| Dialog data injection | `@Inject(MAT_DIALOG_DATA)` — dialogs | `inject(MAT_DIALOG_DATA)` |

Pick one style and normalize.

### Hard-Coded Page Sizes

`RoleService.getAll()` and `PermissionService.getAll()` default to `size = 100` while `UserService` defaults to `size = 10`. These magic numbers should be named constants.

---

## UX

### No 404 Page

`{ path: '**', redirectTo: '' }` silently redirects unknown routes to home. A dedicated `NotFoundComponent` improves user clarity and debuggability.

### No Loading Skeleton for Async Dropdowns

The role dropdown in `UserFormComponent` loads asynchronously but shows no loading indicator while roles are being fetched.

---

## Testing

### Zero Test Coverage

No `.spec.ts` files exist. For an admin panel with auth guards, role-based access, and a complex query builder, this is a significant gap. Priority areas for first tests:

1. `AuthService` — login, logout, role/permission checks
2. `authGuard` / `roleGuard` — route protection logic
3. `QueryBuilderComponent` — condition building and emission
4. `NotificationService` — trivial but establishes the testing pattern

---

## What's Done Well

- **Clean folder structure** — core/features/shared is well-established
- **Standalone components** — no NgModules, fully modern
- **Signals for state** — `signal()` and `computed()` used correctly in auth and loading states
- **Functional guards/interceptors** — modern, concise, correct
- **Lazy-loaded routes** — good for bundle size
- **Typed models** — strong TypeScript interfaces throughout
- **Consistent naming** — files and classes follow Angular conventions
- **Good shared components** — QueryBuilder, ConfirmDialog, ExportDialog are well-factored
- **Role-based nav filtering** — the layout's `computed()` signal for nav items is elegant

---

## Summary

| Category | Issue | Severity |
|---|---|---|
| **Security** | JWT in localStorage, no expiry check | Medium |
| **Security** | Token stored redundantly | Low |
| **Config** | Production API URL is `localhost` | High |
| **Reliability** | Dashboard forkJoin has no error handler | Medium |
| **Reliability** | No centralized error handling; unused error interfaces | Medium |
| **Performance** | `getResourceGroups()` rebuilds every CD cycle | Medium |
| **Performance** | No `OnPush` change detection | Low |
| **Memory** | No subscription cleanup in any component | Medium |
| **Memory** | `downloadBlob` leaks Object URLs in 2 of 3 list components | Low |
| **Validation** | No form validation beyond HTML `required` | Medium |
| **Maintainability** | Role strings are magic strings in 4+ files | Medium |
| **Maintainability** | Dead `@ViewChild` references with `!` assertions | Low |
| **Maintainability** | Inconsistent old/new Angular API patterns | Low |
| **Maintainability** | Hard-coded magic page sizes | Low |
| **UX** | No 404 page | Low |
| **UX** | No loading state for async dropdowns | Low |
| **Testing** | Zero test coverage | High |

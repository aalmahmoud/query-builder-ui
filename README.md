# QuerydslAdmin

Angular 21 admin UI for the [`query-builder-be`](../query-builder-be) JSON query engine.
It's a **metadata-driven** front end: field lists, operations, and types come from the
backend's `/{entity}/metadata` endpoint, so each entity (User / Role / Permission) gets the
full toolset with no hard-coded field lists.

Features: a recursive **AND/OR** nested-group query builder, a **projection** column picker,
an **aggregation** panel (group-by + COUNT/SUM/AVG/MIN/MAX), and **saved queries**.

> **Demo walkthrough** (UI steps + API): see [`docs/DEMO.md`](../query-builder-be/docs/DEMO.md)
> in the backend repo. The shared request/response contract lives in
> [`docs/CONTRACT.md`](../query-builder-be/docs/CONTRACT.md).

The backend API base URL is configured in `src/environments/`. This project was generated
with [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

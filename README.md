[![npm](https://img.shields.io/npm/v/@egomobile/openapi-schema-validator.svg)](https://www.npmjs.com/package/@egomobile/openapi-schema-validator)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/openapi-schema-validator/pulls)

# @egomobile/openapi-schema-validator

> Additional and strict validation of OpenAPI documents in context of [@egomobile/http-server](https://github.com/egomobile/node-http-server).

<a name="toc"></a>

## Table of contents

- [Install](#install)
- [Usage](#usage)
- [Credits](#credits)
- [Documentation](#documentation)
- [See also](#see-also)

<a name="install"></a>

## Install [<a href="#toc">↑</a>]

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save @egomobile/openapi-schema-validator
```

<a name="usage"></a>

## Usage [<a href="#toc">↑</a>]

<a name="quick-example"></a>

### Quick example [<a href="#usage">↑</a>]

```typescript
import createServer from "@egomobile/http-server";
import { validateSwaggerDocument } from "@egomobile/openapi-schema-validator";

const app = createServer();

const result = app.controllers();

// validate document schema
// and documents of controller methods
await validateSwaggerDocument({
  controllerMethods: result.methods,
  documentation: result.documentation,
});

await app.listen(8080);
```

<a name="credits"></a>

## Credits [<a href="#toc">↑</a>]

The module makes use of:

- [@open-api](https://github.com/kogosoftwarellc/open-api)

<a name="documentation"></a>

## Documentation [<a href="#toc">↑</a>]

The API documentation can be found
[here](https://egomobile.github.io/node-openapi-schema-validator/).

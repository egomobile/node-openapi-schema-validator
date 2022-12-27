/* eslint-disable spaced-comment */

// This file is part of the @egomobile/openapi-schema-validator distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/openapi-schema-validator is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/openapi-schema-validator is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import type { IControllerMethodInfo } from "@egomobile/http-server";
import OpenAPISchemaValidator from "openapi-schema-validator";
import type { OpenAPIV3 } from "openapi-types";
import type { Nilable } from "./types/internal";
import { isDescriptionValid, isExampleNameValid, isMimeTypeValid, isNil, isSummaryValid } from "./utils/internal";

/**
 * An error in `IValidateSwaggerDocumentResult.errors`.
 */
export interface IValidateSwaggerDocumentError {
    /**
     * The context.
     */
    context: ValidateSwaggerDocumentErrorContext;
    /**
     * The instance path.
     */
    instancePath: string;
    /**
     * The message.
     */
    message: string;
    /**
     * The type.
     */
    type: ValidateSwaggerDocumentErrorType;
}

/**
 * Options for `validateSwaggerDocument()` function.
 */
export interface IValidateSwaggerDocumentOptions {
    /**
     * Controller methods.
     */
    controllerMethods?: Nilable<IControllerMethodInfo[]>;
    /**
     * The document(ation).
     */
    documentation: OpenAPIV3.Document;
}

/**
 * A result of a `validateSwaggerDocument()` call.
 */
export interface IValidateSwaggerDocumentResult {
    /**
     * The errors.
     */
    errors: IValidateSwaggerDocumentError[];
}

/**
 * The context of an error.
 */
export enum ValidateSwaggerDocumentErrorContext {
    /**
     * Content
     */
    Content = "content",
    /**
     * Options
     */
    Options = "options",
    /**
     * (JSON) Schema
     */
    Schema = "Schema",
}

/**
 * Error types.
 */
export enum ValidateSwaggerDocumentErrorType {
    /**
     * Error
     */
    Error = "error",
    /**
     * Warning
     */
    Warning = "warning"
}

/**
 * Validates a Swagger document in HTTP server context.
 *
 * @param {IValidateSwaggerDocumentOptions} options The options.
 *
 * @returns {Promise<IValidateSwaggerDocumentResult>} The promise with the validation result.
 *
 * @example
 * ```
 * import createServer from "@egomobile/http-server"
 * import { validateSwaggerDocument } from "@egomobile/openapi-schema-validator"
 *
 * const app = createServer()
 *
 * // validate document schema
 * // and documents of controller methods
 * await validateSwaggerDocument({
 *   controllerMethods: result.methods,
 *   documentation: result.documentation,
 * })
 *
 * await app.listen(8080)
 * ```
 */
export async function validateSwaggerDocument(options: IValidateSwaggerDocumentOptions): Promise<IValidateSwaggerDocumentResult> {
    const {
        documentation,
        "controllerMethods": methods
    } = options;

    if (!isNil(methods)) {
        if (!Array.isArray(methods)) {
            throw new TypeError("options.methods must be of type array");
        }

        if (methods.some((m => {
            return typeof m !== "object";
        }))) {
            throw new TypeError("All items of options.methods must be of type object");
        }
    }

    const result: IValidateSwaggerDocumentResult = {
        "errors": []
    };

    const { errors } = result;

    if (typeof documentation !== "object") {
        errors.push({
            "type": ValidateSwaggerDocumentErrorType.Error,
            "context": ValidateSwaggerDocumentErrorContext.Options,
            "instancePath": "",
            "message": "document is no valid object"
        });

        return result;
    }

    // schema
    {
        const validationResult = new OpenAPISchemaValidator({
            "version": 3
        }).validate(documentation);

        validationResult.errors.forEach((error) => {
            errors.push({
                "type": ValidateSwaggerDocumentErrorType.Error,
                "context": ValidateSwaggerDocumentErrorContext.Schema,
                "instancePath": error.instancePath,
                "message": error.message || ""
            });
        });
    }

    if (methods?.length) {
        for (const controllerMethod of methods) {
            const { method, rawPath } = controllerMethod;

            // collect URL parameters
            const urlParams = rawPath.split("/")
                .filter((up) => {
                    return up.startsWith(":");
                })
                .map((up) => {
                    return up.substring(1);
                });

            for (const operation of controllerMethod.swaggerOperations) {
                const addOperationError = (
                    instancePath: string,
                    message: string,
                    type: ValidateSwaggerDocumentErrorType = ValidateSwaggerDocumentErrorType.Error
                ) => {
                    errors.push({
                        type,
                        "context": ValidateSwaggerDocumentErrorContext.Content,
                        "instancePath": `[${method.toUpperCase()} ${rawPath}] ${instancePath}`,
                        message
                    });
                };

                const operationSummary = operation.summary || "";
                if (!isSummaryValid(operationSummary)) {
                    // invalid value for operation.summary
                    addOperationError("operation.summary", "No clean and meaningful summary");
                }

                if (urlParams.length) {
                    // we have URL parameters, lets check if all available

                    if (operation.parameters?.length) {
                        for (const up of urlParams) {
                            // search for matching
                            // `OpenAPIV3.ParameterObject`s
                            const matchingParameters = operation.parameters
                                .map((p, i) => {
                                    return {
                                        "parameter": p as OpenAPIV3.ParameterObject,
                                        "index": i
                                    };
                                })
                                .filter(({ "parameter": p }) => {
                                    return !("$ref" in p) &&
                                        p["in"] === "path" &&
                                        p.name === up;
                                });

                            if (matchingParameters.length < 1) {
                                // operation.parameters has no matching entry
                                // for the current URL parameter `up`
                                addOperationError("operation.parameters", `No entry found for '${up}'`);
                            }
                            else if (matchingParameters.length === 1) {
                                const { index, parameter } = matchingParameters[0];

                                if (parameter.required !== true) {
                                    // operation.parameters[index].required
                                    // is not `true`
                                    addOperationError(`parameters["${index}"].required`, "Value must be 'true'");
                                }
                            }
                            else if (matchingParameters.length > 1) {
                                // operation.parameters has more than one matching entry
                                // for the current URL parameter `up`
                                addOperationError("operation.parameters", `${matchingParameters.length} matching entries found for '${up}'`);
                            }
                        }

                        // now check entries itself
                        for (let i = 0; i < operation.parameters.length; ++i) {
                            const parameterOrRef = operation.parameters[i];

                            if ("$ref" in parameterOrRef) {
                                // TODO: check reference
                                // OpenAPIV3.ReferenceObject

                                addOperationError(
                                    `operation.parameters[${i}]`,
                                    "$ref not supported yet",
                                    ValidateSwaggerDocumentErrorType.Warning
                                );
                            }
                            else {
                                // OpenAPIV3.ParameterObject

                                const parameterDescription = parameterOrRef.description || "";
                                if (!isDescriptionValid(parameterDescription)) {
                                    addOperationError(
                                        `operation.parameters[${i}].description`,
                                        "No clean and meaningful description"
                                    );
                                }
                            }
                        }
                    }
                    else {
                        // operation.parameters has no entry
                        addOperationError("operation.parameters", "No enties found");
                    }
                }

                const responseEntries = Object.entries(operation.responses);
                if (responseEntries.length) {
                    for (const [statusCode, responseOrRef] of responseEntries) {
                        const status = parseInt(statusCode);
                        if (Number.isNaN(status)) {
                            // `statusCode` is no integer
                            addOperationError(`operation.responses["${statusCode}"]`, "Key is no valid integer");
                            continue;
                        }

                        if (status < 100 || status >= 600) {
                            // `status` is out of range
                            addOperationError(`operation.responses["${statusCode}"]`, "Key must be an integer between 100 and 599");
                            continue;
                        }

                        if ("$ref" in responseOrRef) {
                            // TODO: check reference
                            // OpenAPIV3.ReferenceObject

                            addOperationError(
                                `operation.responses["${statusCode}"]`,
                                "$ref not supported yet",
                                ValidateSwaggerDocumentErrorType.Warning
                            );
                        }
                        else {
                            // OpenAPIV3.ResponseObject

                            const responseDescription = responseOrRef.description || "";
                            if (!isDescriptionValid(responseDescription)) {
                                // no valid description in operation.responses[statusCode]
                                addOperationError(`operation.responses["${statusCode}"].description`, "No clean and meaningful description");
                            }

                            if ([204].includes(status)) {
                                if (typeof responseOrRef.content !== "undefined") {
                                    // no `content` prop allowed in operation.responses[statusCode]
                                    addOperationError(`operation.responses["${statusCode}"].content`, "No content description allowed");
                                }
                            }
                            else {
                                if (typeof responseOrRef.content === "object") {
                                    const contentEntries = Object.entries(responseOrRef.content);
                                    if (contentEntries.length) {
                                        for (const [mimeType, mimeTypeObject] of contentEntries) {
                                            if (isMimeTypeValid(mimeType)) {
                                                if (typeof mimeTypeObject.examples === "object") {
                                                    const exampleEntries = Object.entries(mimeTypeObject.examples);
                                                    if (exampleEntries.length) {
                                                        for (const [exampleName, exampleOrRef] of exampleEntries) {
                                                            if (isExampleNameValid(exampleName)) {
                                                                if ("$ref" in exampleOrRef) {
                                                                    // TODO: check reference
                                                                    // OpenAPIV3.ReferenceObject

                                                                    addOperationError(
                                                                        `responses["${status}"].content["${mimeType}"].examples[${exampleName}]`,
                                                                        "$ref not supported yet",
                                                                        ValidateSwaggerDocumentErrorType.Warning
                                                                    );
                                                                }
                                                                else {
                                                                    // OpenAPIV3.ExampleObject

                                                                    if (typeof exampleOrRef.value === "undefined") {
                                                                        // no `value` prop in operation.responses[statusCode].content[mimeType].examples[exampleName]
                                                                        addOperationError(`responses["${status}"].content["${mimeType}"].examples[${exampleName}].value`, "No value defined");
                                                                    }
                                                                }
                                                            }
                                                            else {
                                                                // `exampleName` is no valid key for operation.responses[statusCode].content[mimeType].examples
                                                                addOperationError(`responses["${status}"].content["${mimeType}"].examples`, `Key '${exampleName}' is invalid`);
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        // no entry found in operation.responses[statusCode].content[mimeType].examples
                                                        addOperationError(`operation.responses[${statusCode}].content[${mimeType}].examples`, "No entries found");
                                                    }
                                                }
                                                else {
                                                    // no `examples` prop in operation.responses[statusCode].content[mimeType]
                                                    addOperationError(`operation.responses[${statusCode}].content[${mimeType}].examples`, "No object found");
                                                }
                                            }
                                            else {
                                                // `mimeType` is no valid key for operation.responses[statusCode].content
                                                addOperationError(`operation.responses[${statusCode}].content`, `Key '${mimeType}' is invalid`);
                                            }
                                        }
                                    }
                                    else {
                                        // no entry found in operation.responses[statusCode].content
                                        addOperationError(`operation.responses[${statusCode}].content`, "No entries found");
                                    }
                                }
                                else {
                                    // no `content` prop in operation.responses[statusCode]
                                    addOperationError(`operation.responses[${statusCode}].content`, "No object found");
                                }
                            }
                        }
                    }
                }
                else {
                    // operation.responses has no entry
                    addOperationError("operation.responses", "No enties found");
                }
            }
        }
    }

    return result;
}

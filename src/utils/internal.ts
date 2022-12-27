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

export function isDescriptionValid(description: string): boolean {
    // at least 10 chars
    return /^([A-Z]{1})(.){8,}(\S+)$/i.test(description);
}

export function isExampleNameValid(description: string): boolean {
    // at least 5 chars
    return /^([A-Z]{1})(.){3,}(\S+)$/i.test(description);
}

export function isMimeTypeValid(mimeType: string): boolean {
    // two parts without whitespaces, separated by `/`
    return /^(\S+)(\/)(\S+)$/i.test(mimeType);
}

export function isNil(val: unknown): val is (null | undefined) {
    return typeof val === "undefined" ||
        val === null;
}

export function isSummaryValid(summary: string): boolean {
    // at least 10 chars
    return /^([A-Z]{1})(.){8,}(\S+)$/i.test(summary);
}

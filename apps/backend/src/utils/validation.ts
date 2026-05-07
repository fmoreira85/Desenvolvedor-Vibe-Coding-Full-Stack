import { AppError } from "../errors/AppError";

export const assertString = (value: unknown, fieldName: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`Field "${fieldName}" is required.`, 400);
  }

  return value.trim();
};

export const assertOptionalString = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError("Invalid string value received.", 400);
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const assertBoolean = (value: unknown, fieldName: string) => {
  if (typeof value !== "boolean") {
    throw new AppError(`Field "${fieldName}" must be a boolean.`, 400);
  }

  return value;
};

export const assertArray = <T>(value: unknown, fieldName: string) => {
  if (!Array.isArray(value)) {
    throw new AppError(`Field "${fieldName}" must be an array.`, 400);
  }

  return value as T[];
};

export const assertUuid = (value: unknown, fieldName: string) => {
  const normalized = assertString(value, fieldName);
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(normalized)) {
    throw new AppError(`Field "${fieldName}" must be a valid UUID.`, 400);
  }

  return normalized;
};

export const assertOptionalUuid = (value: unknown, fieldName: string) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return assertUuid(value, fieldName);
};

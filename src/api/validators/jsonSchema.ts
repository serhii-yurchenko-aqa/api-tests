import Ajv from 'ajv';
export const ajv = new Ajv({ allErrors: true, strict: false });

export function validateWith(schema: object, data: unknown) {
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if (!ok) throw new Error('Schema validation failed: ' + JSON.stringify(validate.errors));
}

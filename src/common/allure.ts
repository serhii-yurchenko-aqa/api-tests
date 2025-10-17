/**
 * Безопасные обёртки для Allure.
 * По умолчанию ничего не пишут (ALLURE_ACTIVE != '1'),
 * чтобы не падать/не висеть при отсутствии валидного контекста.
 *
 * Включить вложения можно так:
 *   ALLURE_ACTIVE=1 npm test
 */

export function isAllureActive(): boolean {
  return process.env.ALLURE_ACTIVE === '1';
}

export async function attachJson(_name: string, _data: unknown): Promise<void> {
  if (!isAllureActive()) return;
  try {
    const commons = await import('allure-js-commons');
    await commons.attachment(_name, JSON.stringify(_data, null, 2), commons.ContentType.JSON);
  } catch {
  }
}

export async function step<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  if (!isAllureActive()) return await fn();
  try {
    const commons = await import('allure-js-commons');
    return commons.step(name, fn);
  } catch {
    return await fn();
  }
}

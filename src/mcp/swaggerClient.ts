/**
 * Заглушка клиента MCP. Здесь вы можете реализовать вызовы к локально запущенному Swagger MCP Server.
 * Пока возвращаем несколько негативных кейсов для POST /pet.
 */
export interface NegativeCase {
  title: string;
  payload: unknown;
  expectedStatus?: number;
}

export function proposeNegativeCases(endpoint: string): NegativeCase[] {
  if (endpoint === 'POST /pet') {
    return [
      { title: 'payload: отсутствует name',         payload: { status: 'available', photoUrls: ['http://ex.com/i.jpg'] }, expectedStatus: 400 },
      { title: 'payload: id как строка',            payload: { id: 'oops', name: 'Bad', photoUrls: [] },                  expectedStatus: 400 },
      { title: 'payload: слишком длинное name',     payload: { name: 'x'.repeat(500), photoUrls: [] },                    expectedStatus: 400 },
      { title: 'payload: неверный тип photoUrls',   payload: { name: 'Bad', photoUrls: 'not-array' },                     expectedStatus: 400 },
    ];
  }
  return [];
}

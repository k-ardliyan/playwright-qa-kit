export type JsonParseResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: 'INVALID_JSON';
        message: string;
      };
    };
export declare function safeJsonParse<T>(raw: string): JsonParseResult<T>;
//# sourceMappingURL=json-parser.d.ts.map

declare module "papaparse" {
  export type ParseError = {
    type: string;
    code: string;
    message: string;
    row?: number;
  };

  export type ParseResult<T> = {
    data: T[];
    errors: ParseError[];
    meta: Record<string, unknown>;
  };

  export type ParseConfig<T> = {
    header?: boolean;
    skipEmptyLines?: boolean;
    dynamicTyping?: boolean;
    complete?: (results: ParseResult<T>) => void;
  };

  const Papa: {
    parse<T>(csvString: string, config?: ParseConfig<T>): ParseResult<T>;
  };

  export default Papa;
}

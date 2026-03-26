export interface CliArgs {
  configPath?: string;
  silent?: boolean;
  daemon?: boolean;
  printConfig?: boolean;
  validateConfig?: boolean;
  version?: boolean;
  dsn?: string;
  port?: number;
  logLevel?: string;
  transport?: 'stdio' | 'http';
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  const tokens = argv.slice(2);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    switch (token) {
      case '--config':
      case '-c':
        args.configPath = tokens[++i];
        break;
      case '--silent':
      case '-s':
        args.silent = true;
        break;
      case '--daemon':
      case '-d':
        args.daemon = true;
        break;
      case '--print-config':
        args.printConfig = true;
        break;
      case '--validate-config':
        args.validateConfig = true;
        break;
      case '--version':
      case '-v':
        args.version = true;
        break;
      case '--dsn':
        args.dsn = tokens[++i];
        break;
      case '--port':
        args.port = parseInt(tokens[++i], 10);
        break;
      case '--log-level':
        args.logLevel = tokens[++i];
        break;
      case '--transport':
        args.transport = tokens[++i] as 'stdio' | 'http';
        break;
    }
  }

  return args;
}

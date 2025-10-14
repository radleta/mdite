import chalk from 'chalk';

export class Logger {
  constructor(private colors: boolean = true) {}

  header(message: string): void {
    console.log('');
    console.log(this.colors ? chalk.bold(message) : message);
    console.log(this.colors ? chalk.gray('─'.repeat(50)) : '-'.repeat(50));
  }

  info(message: string): void {
    const icon = this.colors ? chalk.blue('ℹ') : 'i';
    console.log(`${icon} ${message}`);
  }

  success(message: string): void {
    const icon = this.colors ? chalk.green('✓') : '✓';
    console.log(`${icon} ${message}`);
  }

  error(message: string, error?: Error): void {
    const icon = this.colors ? chalk.red('✗') : '✗';
    console.error(`${icon} ${message}`);
    if (error && process.env['DEBUG']) {
      console.error(error.stack);
    }
  }

  log(message: string): void {
    console.log(message);
  }

  line(): void {
    console.log('');
  }
}

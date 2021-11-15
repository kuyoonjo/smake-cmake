import { ICommand, Toolchain } from 'smake';
import { magenta } from 'colors/safe';
import { resolve } from 'path';

declare type TargetType =
  | 'x86_64-apple-darwin'
  | 'arm64-apple-darwin'
  | 'x86_64-linux-gnu'
  | 'aarch64-linux-gnu'
  | 'arm-linux-gnueabihf'
  | 'x86_64-pc-windows-msvc';

export class Cmake extends Toolchain {
  constructor(public projectDir: string, public target: TargetType) {
    super(projectDir.replace(/\//g, '-').replace(/\./g, '_') + '-' + target);
  }

  searchPaths: string[] = [];
  flags: string = '';
  env: {
    [k: string]: string;
  } = {};

  async generateCommands(_first: boolean, _last: boolean): Promise<ICommand[]> {
    return [
      {
        label: magenta(
          `Generate cmake files for ${this.projectDir} ${this.target}`
        ),
        cmd: (() => {
          let cmd = [
            `cmake -B ${this.buildDir} ${this.projectDir}`,
            `-DCMAKE_TOOLCHAIN_FILE=${resolve(__dirname, '..', 'cmake').replace(
              /\\/g,
              '/'
            )}/${this.target}.cmake`,
            `-DCMAKE_INSTALL_PREFIX=${this.installDir}`,
          ].join(' ');
          if (this.target.includes('windows'))
            cmd += ` -DCMAKE_BUILD_TYPE=${
              process.env.mode === 'debug' ? 'Debug' : 'Release'
            }`;
          if (this.searchPaths.length)
            cmd += ` -DCMAKE_PREFIX_PATH='${this.searchPaths.join(';')}'`;
          if (this.flags) cmd += ' ' + this.flags;
          if (process.argv.includes('--verbose'))
            cmd += ' -DCMAKE_VERBOSE_MAKEFILE=ON';
          const entries = Object.entries(this.env);
          if (entries.length)
            cmd = `cmake -E ${entries
              .map((e) => `env ${e[0]}="${e[1]}"`)
              .join(' ')} ${cmd}`;
          return cmd;
        })(),
      },
      {
        label: magenta(`Build ${this.projectDir} ${this.target}`),
        cmd: `cmake --build ${this.buildDir}${
          this.target.includes('windows') ? ' --config Release' : ''
        } --target install`,
      },
    ];
  }

  get includeDir() {
    return this.installDir + '/include';
  }
  get linkDir() {
    return this.installDir + '/lib';
  }

  get installDir() {
    return `.smake/cmake/install/${this.id}`;
  }

  get buildDir() {
    return `.smake/cmake/build/${this.id}`;
  }
}

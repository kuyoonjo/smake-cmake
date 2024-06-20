import { ICommand, Toolchain } from 'smake';
import { magenta } from 'colors/safe';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

declare type TargetType =
  | 'x86_64-apple-darwin'
  | 'arm64-apple-darwin'
  | 'x86_64-linux-gnu'
  | 'aarch64-linux-gnu'
  | 'arm-linux-gnueabihf'
  | 'x86_64-pc-windows-msvc';

export class Autotools extends Toolchain {
  constructor(public projectDir: string, public target: TargetType) {
    super(projectDir.replace(/\//g, '-').replace(/\./g, '_') + '-' + target);
  }

  prefix = process.env.SMAKE_LLVM_PREFIX || '';

  get CC() {
    return `${this.prefix}clang`;
  }
  get CXX() {
    return `${this.prefix}clang++`;
  }
  get AR() {
    return `${this.prefix}llvm-ar`;
  }
  get LD() {
    return `${this.prefix}clang++`;
  }
  get NM() {
    return `${this.prefix}llvm-nm`;
  }
  get OBJDUMP() {
    return `${this.prefix}llvm-objdump`;
  }
  get RANLIB() {
    return `${this.prefix}llvm-ranlib`;
  }

  get CPPFLAGS() {
    let str = `-target ${this.target}`;
    const sysroot =
      process.env[
        `SMAKE_LLVM_SYSROOT_${this.target.replace(/-/g, '_').toUpperCase}`
      ];
    if (sysroot) str += ` --sysroot=${sysroot}`;
    return str;
  }

  get LDFLAGS() {
    return '-fuse-ld=lld -Wl,--no-undefined -Wl,--as-needed';
  }

  searchPaths: string[] = [];
  flags: string = '';
  env: {
    [k: string]: string;
  } = {};

  async generateCommands(_first: boolean, _last: boolean): Promise<ICommand[]> {
    mkdirSync(this.buildDir, { recursive: true });
    console.log(
      'env',
      Object.entries({
        CC: this.CC,
        CXX: this.CXX,
        AR: this.AR,
        LD: this.LD,
        NM: this.NM,
        OBJDUMP: this.OBJDUMP,
        RANLIB: this.RANLIB,
        CFLAGS: this.CPPFLAGS,
        CXXFLAGS: this.CPPFLAGS,
        LDFLAGS: this.LDFLAGS,
        ...this.env,
      })
        .map((x) => `${x[0]}="${x[1]}"`)
        .join(' '),
      `${resolve(this.projectDir, 'configure')}`
    );
    return [
      {
        label: magenta(
          `Generate make files for ${this.projectDir} ${this.target}`
        ),
        fn: async () => {
          execSync(`${resolve(this.projectDir, 'configure')}`, {
            cwd: this.buildDir,
            env: {
              CC: this.CC,
              CXX: this.CXX,
              AR: this.AR,
              LD: this.LD,
              NM: this.NM,
              OBJDUMP: this.OBJDUMP,
              RANLIB: this.RANLIB,
              CFLAGS: this.CPPFLAGS,
              CXXFLAGS: this.CPPFLAGS,
              LDFLAGS: this.LDFLAGS,
              ...this.env,
            },
            stdio: 'inherit',
          });
        },
      },
      // {
      //   label: magenta(`Build ${this.projectDir} ${this.target}`),
      //   cmd: `cmake --build ${this.buildDir}${this.target.includes('windows') ? ' --config Release' : ''
      //     } --target install`,
      // },
    ];
  }

  get includeDir() {
    return this.installDir + '/include';
  }
  get linkDir() {
    return this.installDir + '/lib';
  }

  get installDir() {
    return `.smake/autotools/install/${this.id}`;
  }

  get buildDir() {
    return `.smake/autotools/build/${this.id}`;
  }
}

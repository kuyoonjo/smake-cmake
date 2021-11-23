import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { ICommand, Toolchain } from 'smake';
import { join } from 'smake/lib/join';
import { generateProfile } from './generateProfile';
import { magenta } from 'colors/safe';
import { execSync } from 'child_process';
import { resolve } from 'path';

declare type TargetType =
  | 'x86_64-apple-darwin'
  | 'arm64-apple-darwin'
  | 'x86_64-linux-gnu'
  | 'aarch64-linux-gnu'
  | 'arm-linux-gnueabihf'
  | 'x86_64-pc-windows-msvc';

export class Conan extends Toolchain {
  static compilerVersion = {
    'x86_64-apple-darwin': '12.0',
    'arm64-apple-darwin': '12.0',
    'x86_64-linux-gnu': '13.0',
    'aarch64-linux-gnu': '13.0',
    'arm-linux-gnueabihf': '13.0',
    'x86_64-pc-windows-msvc': '16',
  };
  private static _packageInfo: {
    [id: string]: string[];
  };
  private static savePackageInfo() {
    const p = join('.smake', 'conan', 'packageInfo.json');
    writeFileSync(p, JSON.stringify(Conan.packageInfo, null, 2));
  }
  static get packageInfo() {
    if (!Conan._packageInfo) {
      const p = join('.smake', 'conan', 'packageInfo.json');
      if (existsSync(p))
        Conan._packageInfo = JSON.parse(readFileSync(p).toString());
      else Conan._packageInfo = {};
    }
    return Conan._packageInfo;
  }
  constructor(public libId: string, public target: TargetType) {
    super(libId.replace(/\//, '-') + '-' + target);
  }
  options: string[] = [];
  async generateCommands(_first: boolean, _last: boolean): Promise<ICommand[]> {
    const profilePath = join(
      this.buildDir,
      `.${this.libId.replace(/\//, '-')}-${this.target}.profile`
    );
    const profileContent = generateProfile(
      this.target,
      Conan.compilerVersion[this.target]
    );
    let buildCmd = `conan install ${this.libId}@ -pr:b default -pr:h ${profilePath}`;
    if (this.options.length)
      buildCmd += this.options.map((x) => ` -o ${x}`).join('');
    if (this.target.includes('linux')) buildCmd += ' --build=missing';
    return [
      {
        label: magenta(`Generate profile for ${this.libId} ${this.target}`),
        cmd: '',
        fn: async () => {
          mkdirSync(this.buildDir, { recursive: true });
          writeFileSync(profilePath, profileContent);
        },
      },
      {
        label: magenta(`Build ${this.libId} ${this.target}`),
        cmd: buildCmd,
      },
      {
        label: magenta(`Finalize ${this.libId} ${this.target}`),
        cmd: '',
        fn: async () => {
          execSync(
            `conan info ${
              this.libId
            }@ -pr:b default -pr:h ${profilePath}${this.options
              .map((x) => ` -o ${x}`)
              .join('')} --paths --json ${this.jsonInfoPath}`
          );
          const json = JSON.parse(readFileSync(this.jsonInfoPath).toString());
          Conan.packageInfo[this.id] = json.map((x: any) => x.package_folder);
          Conan.savePackageInfo();
          rmSync(this.jsonInfoPath, { force: true });
          rmSync(profilePath, { recursive: true, force: true });
        },
      },
    ];
  }

  private get jsonInfoPath() {
    return resolve(this.buildDir, 'conan', this.id + '.json');
  }

  get includeDirs() {
    return this.installDirs.map((x) => x + '/include');
  }
  get linkDirs() {
    return this.installDirs.map((x) => x + '/lib');
  }

  get installDirs() {
    if (!Conan.packageInfo[this.id]) {
      const profilePath = join(
        this.buildDir,
        `.${this.libId.replace(/\//, '-')}-${this.target}.profile`
      );
      const profileContent = generateProfile(
        this.target,
        Conan.compilerVersion[this.target]
      );
      mkdirSync(this.buildDir, { recursive: true });
      writeFileSync(profilePath, profileContent);
      execSync(
        `conan info ${
          this.libId
        }@ -pr:b default -pr:h ${profilePath}${this.options
          .map((x) => ` -o ${x}`)
          .join('')} --paths --json ${this.jsonInfoPath}`
      );
      const json = JSON.parse(readFileSync(this.jsonInfoPath).toString());
      rmSync(this.jsonInfoPath, { force: true });
      rmSync(profilePath, { recursive: true, force: true });
      Conan.packageInfo[this.id] = json.map((x: any) => x.package_folder);
      Conan.savePackageInfo();
    }
    return Conan.packageInfo[this.id];
  }
}

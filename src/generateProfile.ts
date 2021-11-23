import { generateLinuxProfile } from './generateLinuxProfile';

export function generateProfile(target: string, compilerVersion: string) {
  if (target.includes('linux'))
    return generateLinuxProfile(target, compilerVersion);
  switch (target) {
    case 'x86_64-pc-windows-msvc':
      return `[settings]
os=Windows
arch=x86_64
compiler=Visual Studio
compiler.runtime=MT
compiler.version=${compilerVersion}
build_type=Release`;
    case 'x86_64-apple-darwin':
      return `[settings]
os=Macos
arch=x86_64
compiler=apple-clang
compiler.version=${compilerVersion}
compiler.libcxx=libc++
build_type=Release`;
    case 'arm64-apple-darwin':
      return `[settings]
os=Macos
arch=${
        target.startsWith('x86_64')
          ? 'x86_64'
          : target.startsWith('aarch64')
          ? 'armv8'
          : 'armv7hf'
      }
compiler=apple-clang
compiler.version=${compilerVersion}
compiler.libcxx=libc++
build_type=Release`;
  }
  return '';
}

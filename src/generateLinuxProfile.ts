import { resolve } from 'path';

export function generateLinuxProfile(target: string, compilerVersion: string) {
  const cmakeToolchainDir = resolve(__dirname, '..', 'cmake').replace(
    /\\/g,
    '/'
  );
  return `llvm_path=${process.env.SMAKE_LLVM_PREFIX}
target_host=${target}
toolchain=${
    process.env['SMAKE_LLVM_SYSROOT_' + target.toUpperCase().replace(/-/g, '_')]
  }
cc_compiler=clang
cxx_compiler=clang++
ar_compiler=llvm-ar
nm_compiler=llvm-nm
objdump_compiler=llvm-objdump
ranlib_compiler=llvm-ranlib

[env]
CONAN_CMAKE_TOOLCHAIN_FILE=${cmakeToolchainDir}/$target_host.cmake
CONAN_CMAKE_FIND_ROOT_PATH=$toolchain  # Optional, for CMake to find things in that folder
CONAN_CMAKE_SYSROOT=$toolchain  # Optional, if we want to define sysroot
CHOST=$target_host

CC=$llvm_path$cc_compiler
CXX=$llvm_path$cxx_compiler
AR=$llvm_path$ar_compiler
LD=$llvm_path$cxx_compiler
NM=$llvm_path$nm_compiler
OBJDUMP=$llvm_path$objdump_compiler
RANLIB=$llvm_path$ranlib_compiler

CXXFLAGS=-target $target_host --sysroot=$toolchain -O3
CFLAGS=-target $target_host --sysroot=$toolchain -O3
LDFLAGS=-fuse-ld=lld

[settings]
os=Linux
arch=armv8
compiler=clang
compiler.version=${compilerVersion}
compiler.libcxx=libstdc++11
build_type=Release`;
}

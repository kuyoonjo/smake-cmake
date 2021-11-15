llvm_path=/opt/homebrew/opt/llvm/bin/
target_host=aarch64-linux-gnu
toolchain=/opt/sysroots/ubuntu14.04-$target_host
cc_compiler=clang
cxx_compiler=clang++

[env]
CONAN_CMAKE_TOOLCHAIN_FILE=/Users/yu/Projects/kuyoonjo/smake-cmake/$target_host.cmake
CONAN_CMAKE_FIND_ROOT_PATH=$toolchain  # Optional, for CMake to find things in that folder
CONAN_CMAKE_SYSROOT=$toolchain  # Optional, if we want to define sysroot
CHOST=$target_host

CC=$llvm_path/$cc_compiler
CXX=$llvm_path/$cxx_compiler
AR=$llvm_path/llvm-ar
LD=$llvm_path/$cxx_compiler
NM=$llvm_path/llvm-nm
OBJDUMP=$llvm_path/llvm-objdump
RANLIB=$llvm_path/llvm-ranlib

CXXFLAGS=-target $target_host --sysroot=$toolchain
CFLAGS=-target $target_host --sysroot=$toolchain
LDFLAGS=-fuse-ld=lld -Wl,--no-undefined -Wl,--as-needed

[settings]
os=Linux
arch=armv8
compiler=clang
compiler.version=12
compiler.libcxx=libstdc++11
build_type=Release
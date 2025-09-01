Z80E_REPO = deps/z80e
Z80E_DIST_FILE = ${Z80E_REPO}/build/z80e.wasm

all: ${Z80E_DIST_FILE}

${Z80E_DIST_FILE}:
	cd ${Z80E_REPO} && \
		cmake -S . -B build -DZ80E_WEBASM=ON && \
		cmake --build build

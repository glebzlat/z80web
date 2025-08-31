import sys
import json

from z80asm import (
    Z80AsmParser,
    Z80AsmCompiler,
    Z80AsmLayouter,
    Instruction,
    Directive,
    DirectiveKind
)


def get_end_addr(stmt: Instruction | Directive) -> int:
    if isinstance(stmt, Directive) and stmt.kind == DirectiveKind.org:
        return stmt.addr
    return stmt.addr + len(stmt.encoded)


def get_encoded(stmt: Instruction | Directive) -> list[bytes]:
    if isinstance(stmt, Directive):
        if stmt.kind == DirectiveKind.org:
            return [0x00] * (stmt.addr - stmt.length)
    return stmt.encoded


def assemble() -> list[tuple[int, str, tuple[int, ...]]]:
    program = Z80AsmParser().parse_stream(sys.stdin)
    Z80AsmLayouter().layout_program(program)
    Z80AsmCompiler().compile_program(program)

    for stmt in program:
        if isinstance(stmt, (Instruction, Directive)):
            print(json.dumps([
                stmt.lineno,
                stmt.line,
                get_end_addr(stmt),
                get_encoded(stmt)
            ]))

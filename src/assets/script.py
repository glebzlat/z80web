import sys
import json

from z80asm import (
    Z80AsmParser,
    Z80AsmCompiler,
    Z80AsmLayouter,
    Instruction,
    Directive
)


def assemble() -> list[tuple[int, str, tuple[int, ...]]]:
    program = Z80AsmParser().parse_stream(sys.stdin)
    Z80AsmLayouter().layout_program(program)
    Z80AsmCompiler().compile_program(program)

    for stmt in program:
        if isinstance(stmt, (Instruction, Directive)):
            print(json.dumps([stmt.lineno, stmt.line, stmt.encoded]))

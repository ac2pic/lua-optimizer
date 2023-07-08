const invalidInstruction = {

	getName() {
		return "Invalid";
	},
	getSummary() {
		return {
			name: invalidInstruction.getName()
		};
	},
};

class LuaInstructionsIterator {
	constructor(instructions) {
		this.instructions = instructions;
		this.pc = 0;
	}

	jump(offset) {
		this.pc += offset;
	}

	pcAt(offset = 1) {
		const currInstruction = this.pc - 1;
		return currInstruction + offset;
	}

	getPc() {
		return this.pc;
	}

	[Symbol.iterator]() {
		this.pc = 0;
		return {
			next: () => {
				const pc = this.pc;
				const value = this.next();
				
				return {
					value: [pc, value],
					done: (this.pc == this.instructions.length)
				}
			}
		}
	}

	next() {
		return this.instructions[this.pc++];
	}

	peek(i = 1) {
		return this.instructions[this.pc - 1 + i] || invalidInstruction;
	}

}
exports.LuaInstructionsIterator = LuaInstructionsIterator;

class LuaByteCodeWalker {
	constructor(iterator, mainFunction) {
		this.iterator = iterator;
		this.func = mainFunction;
	}

	walk(walker) {
		for (const [offset, instruction] of this.iterator) {
			const func = walker[instruction.getName()];
			walker.preStep(offset);
			if (func) {
				func.apply(walker, [instruction.getSummary(), offset]);
			}	
			walker.postStep(offset);
		}	
		return walker.finish();
	}
}

exports.LuaByteCodeWalker = LuaByteCodeWalker;

class Walker {
	constructor(iterator, func) {
		this.iterator = iterator;
		this.func = func;
	}
	finish() { return null;}
	preStep() {}	
	postStep() {}
	MOVE(instruction, functionData) {}
	LOADK(instruction, functionData) {}
	LOADKX(instruction, functionData) {}
	LOADBOOL(instruction, functionData) {}
	LOADNIL(instruction, functionData) {}
	GETUPVAL(instruction, functionData) {}
	GETTABUP(instruction, functionData) {}
	GETTABLE(instruction, functionData) {}
	SETTABUP(instruction, functionData) {}
	SETUPVAL(instruction, functionData) {}
	SETTABLE(instruction, functionData) {}
	NEWTABLE(instruction, functionData) {}
	SELF(instruction, functionData) {}
	ADD(instruction, functionData) {}
	SUB(instruction, functionData) {}
	MUL(instruction, functionData) {}
	DIV(instruction, functionData) {}
	MOD(instruction, functionData) {}
	POW(instruction, functionData) {}
	UNM(instruction, functionData) {}
	NOT(instruction, functionData) {}
	LEN(instruction, functionData) {}
	CONCAT(instruction, functionData) {}
	JMP(instruction, functionData) {}
	EQ(instruction, functionData) {}
	LT(instruction, functionData) {}
	LE(instruction, functionData) {}
	TEST(instruction, functionData) {}
	TESTSET(instruction, functionData) {}
	CALL(instruction, functionData) {}
	TAILCALL(instruction, functionData) {}
	RETURN(instruction, functionData) {}
	FORLOOP(instruction, functionData) {}
	FORPREP(instruction, functionData) {}
	TFORCALL(instruction, functionData) {}
	TFORLOOP(instruction, functionData) {}
	SETLIST(instruction, functionData) {}
	CLOSURE(instruction, functionData) {}
	VARARG(instruction, functionData) {}
	EXTRAARG(instruction, functionData) {}
}
exports.Walker = Walker;

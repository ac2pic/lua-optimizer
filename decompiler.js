class LuaDecompiler {
	constructor(luaBin) {
		this.binary = luaBin;
		this.code = "";
		this.metadata = {};
		this.indent = 0;
	}
	
	decompileGETTABUP(instr, funcData) {
		if (instr.A != 0) {
			// Need to do extra stuff
			this.code += "";
		}
		if (instr.B < 0) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.B, false);
			this.code += constant + " = ";
		} else {
			this.code += "lVAR" + instr.B + " = ";
		}

		if (instr.C < 0) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.C, false);
			this.code += constant;
		} else {
			this.code += "lVAR" + instr.C;
		}

		this.code += "\n";

	}

	decompileSETTABUP(instr, funcData) {
		if (instr.A != 0) {
			// Need to do extra stuff
			// if it's not zero then we are access
			// a different table
			this.code += "";
		}
		if (instr.B < 0) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.B, false);
			this.code += constant + " = ";
		}

		if (instr.C < 0) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.C);
			this.code += constant;
		} else {
			this.code += "lVAR" + instr.C;
		}

		this.code += "\n";

	}

	decompileInstruction(instr, funcData) {
		const summary = instr.getSummary();
		const funcName = "decompile" + summary.name;
		const func = this[funcName];
		if (func) {
			func.apply(this, [summary, funcData]);
		} else {
			console.log(instr.getPrettySummary(1));
			console.log(funcName, "is not implemented.");
		}
	}

	decompileCode(code, funcData) {
		for(const instr of code) {
			this.decompileInstruction(instr, funcData);
		}
	}

	decompileFunction(funcData) {
		const {
			linedefined, 
			lastlinedefined,
			code,
		} = funcData;
		const isMain = linedefined != lastlinedefined;
		if (!isMain) {
			this.indent++;
		}

		this.decompileCode(code, funcData);

		if (!isMain) {
			this.indent--;
		}
	}

	decompile() {
		this.decompileFunction(this.binary.main);
		return this.code;
	}
}

exports.LuaDecompiler = LuaDecompiler;

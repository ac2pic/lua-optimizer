class LuaDecompiler {
	constructor(luaBin) {
		this.binary = luaBin;
		this.code = "";
		this.metadata = {};
		this.registers = {};
		this.indent = 0;
	}

	defineRegister(register) {
		const alreadyDefined = this.registers[register] === true;
		if (!alreadyDefined) {
			this.registers[register] = true;
		}
		return alreadyDefined;
	}

	decompileLOADNIL(instr, funcData) {
		const minRegister = instr.A;
		const maxRegister = instr.A + instr.B;
		for(let i = minRegister; i <= maxRegister; i++) {
			const register = i;
			const isDefined = this.defineRegister(register);	
			if (!isDefined) {
				this.code += 'local ';
			}
			this.code += `L${register} = nil\n`;
		}
	}

	decompileLOADK(instr, funcData) {
		// Assume it's a local
		let constant = this.binary.getConstant(funcData.constants, ~instr.Bx);
		const register = instr.A;
		const isDefined = this.defineRegister(register);	
		if (!isDefined) {
			this.code += 'local ';
		}
		this.code += `L${register} = ${constant}\n`;
			
	}
	
	decompileNEWTABLE(instr, funcData) {
		const register = instr.A;
		const isDefined = this.defineRegister(register);	
		if (!isDefined) {
			this.code += 'local ';
		}
		this.code += `L${register} = {}\n`;
	}

	decompileSETLIST(instr, funcData) {
		const listRegister = instr.A;
		const maxRegister = instr.B;
		const indexRegister = instr.C;
		const LFIELDS_PER_FLUS = 50;
		for (let i = 1; i <= maxRegister; i++) {
			const idx = (indexRegister - 1) * LFIELDS_PER_FLUS + i;
			const valRegister = listRegister + i;
			this.code += `L${listRegister}[${idx}] = L${valRegister}\n`;
		}
	}
	decompileSETTABLE(instr, funcData) {
		const register = instr.A;
		let index = "";
		if (instr.B < 0) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.B, true);
			index = constant;
		} else {
			index = "L" + instr.B;
		}
		let value = "";
		if (instr.C < 0) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.C, true);
			value = constant;
		} else {
			value = "L" + instr.C;
		}
		this.code += `L${register}[${index}] = ${value}\n`;
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
			this.code += "L" + instr.B + " = ";
		}

		if (instr.C < 0) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.C, false);
			this.code += constant;
		} else {
			this.code += "L" + instr.C;
		}

		this.code += "\n";

	}

	decompileSETTABUP(instr, funcData) {
		if (instr.A != 0) {
			// Need to do extra stuff
			// if it's not zero then we are accessing
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
			this.code += "L" + instr.C;
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
			// console.log(instr.getPrettySummary(1));
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

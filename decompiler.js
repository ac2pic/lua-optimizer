class LuaDecompiler {
	constructor(luaBin,debug = true) {
		this.binary = luaBin;
		this.code = "";
		this.metadata = {};
		this.registers = {};
		this.upvalues = [-1];
		this.indent = 0;
		this.debug = debug;
	}

	writeRegister(register) {
		const isDefined = this.defineRegister(register);	
		if (!isDefined) {
			this.code += 'local ';
		}
		this.code += `L${register}`;
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
			this.writeRegister(register);
			this.code += ` = nil\n`;
		}
	}

	decompileLOADK(instr, funcData) {
		// Assume it's a local
		let constant = this.binary.getConstant(funcData.constants, ~instr.Bx);
		const register = instr.A;
		this.writeRegister(register);
		this.code += ` = ${constant}\n`;
			
	}

	decompileCALL(instr, funcData) {
		this.writeRegister(instr.A);
		this.code += `() -- todo add arguments\n`;
	}
	
	decompileNEWTABLE(instr, funcData) {
		const register = instr.A;
		this.writeRegister(register);
		this.code += ` = {}\n`;
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
		this.writeRegister(instr.A);
		this.code += " = ";
		// _ENV
		console.log(instr.B)
		if (this.upvalues[instr.B] == -1) {
			let constant = this.binary.getConstant(funcData.constants, ~instr.C, false);
			this.code += constant;
		} else {
			this.code += "UV" + instr.B + "[";
	
			let constant = this.binary.getConstant(funcData.constants, ~instr.C, true);
			this.code += constant + "]";

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
			if (this.debug) this.code += `-- ${funcName} \n`;
			func.apply(this, [summary, funcData]);
		} else {
			// console.log(instr.getPrettySummary(1));
			if (this.debug) this.code += `-- ${funcName} is not implemented.\n`;
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

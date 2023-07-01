const fs = require("fs");
const {
	LUAC_DATA,
	LUA_SIGNATURE,
	LUASIZE_INT,
	LUASIZE_SIZET,
	LUASIZE_INSTRUCTION,
	LUASIZE_NUMBER,
	LUA_OPMODES,
	iABC,
	iABx,
	iAsBx,
	iAx,
	OpArgN,
	OpArgU,
	OpArgR,
	OpArgK,
	OPCODE_NAMES,
	SIZE_C,
	SIZE_B,
	SIZE_Bx,
	SIZE_A,
	SIZE_Ax,
	SIZE_OP,
	POS_A,
	POS_C,
	POS_B,
	POS_Bx,
	POS_Ax,
} = require('./constants.js');

class BinaryReader {
	constructor(buffer) {
		this.buffer = buffer;
		this.offset = 0;
	}
	getByte() {
		return this.buffer[this.offset++];
	}

	getSlice(length) {
		const start = this.offset;
		const end = this.offset + length;
		const byteSlice = this.buffer.slice(this.offset, end);
		this.offset = end;
		return byteSlice;
	}
	
}
exports.BinaryReader = BinaryReader;
class LuaBinaryInstruction {
	constructor(instruction) {
		this.instruction = instruction.readUInt32LE();
		this.opcode = this.instruction & 0b11_11_11;
		this.opmode = LUA_OPMODES[this.opcode];
	}

	getFormat() {
		switch(this.opmode & 0b11) {
			case iABC:
				return "iABC";
			case iABx:
				return "iABx";
			case iAsBx:
				return "iAsBx";
			case iAx:
				return "iAx";
		}
		return "unknown";
	}

	getBMode() {
		return this.opmode >> 4 & 0b11;
	}

	getCMode() {
		return this.opmode >> 2 & 0b11;
	}


	getArg(argName) {
		const instr = this.instruction;
		let data = 0;
		let checkIfConstant = 
			argName === "B" ||
			argName === "C";

		if (argName === "A") {
			let argData = (instr >> POS_A);
			data = argData & (2**SIZE_A - 1);
		} else if (argName === "B") {
			let argData = (instr >> POS_B);
			data = argData & (2**SIZE_B - 1);
		} else if (argName === "C") {
			let argData = (instr >> POS_C);
			data = argData & (2**SIZE_C - 1);
		} else if (argName === "Bx" || argName == "sBx") {
			let argData = (instr >> POS_Bx);
			data = argData & (2**SIZE_Bx - 1);
		} else if (argName === "Ax") {
			let argData = (instr >> POS_Ax);
			data = argData & (2**SIZE_Ax - 1);

		}

		if (argName === "sBx") {
			// Subtract by MAX_Bx / 2
			data -= 0x1FFFF;
		}

		if (checkIfConstant) {
			const BIT_RK = 1 << 8;
			if ((data & BIT_RK) == BIT_RK) {
				// 9th bit tells what register it is
				// the remaining bits are the raw value
				// The value will never be negative
				data = ~(data & 0xFF);
			}
		}
		return data;
	}

	getPrettySummary(idx) {
		const summary = this.getSummary();

		let prettySummary = `\t`;
		prettySummary += ("" + idx).padEnd(4, " ");
		prettySummary += `[-] `;
		prettySummary += `${summary.name}`.padEnd(9, " ");
		prettySummary += "\t";
		if (summary.format == "iABC") {
			prettySummary += `${summary.A} `;
			if (this.getBMode() != OpArgN) {
				prettySummary += `${summary.B} `;
			}
			if (this.getCMode() != OpArgN) {
				prettySummary += `${summary.C} `;
			}
		} else if (summary.format == "iABx") {
			prettySummary += `${summary.A} `;
			if (this.getBMode() != OpArgN) {
				prettySummary += `${summary.Bx} `;
			}
		} else if (summary.format == "iAsBx") {
			prettySummary += `${summary.A} ${summary.sBx} `;
		} else if (summary.format == "iAx") {
			prettySummary += `${summary.Ax} `;
		} else {
			prettySummary += ' Unknown format ';
		}
		return prettySummary;
	}

	getSummary() {
		const format = this.getFormat();
		const summary = {
			name: OPCODE_NAMES[this.opcode],
			format,
		};
		if (format == "iABC") {
			summary.A = this.getArg("A");
			if (this.getBMode() != OpArgN) {
				summary.B = this.getArg("B");
			}

			if (this.getCMode() != OpArgN) {
				summary.C = this.getArg("C");
			}
		} else if (format == "iABx") {
			summary.A = this.getArg("A");
			if (this.getBMode() == OpArgK) {
				summary.Bx = ~(this.getArg("Bx") >>> 0);
			} else if (this.getBMode() == OpArgU) {
				summary.Bx = this.getArg("Bx");
			}
		} else if (format == "iAsBx") {
			summary.A = this.getArg("A");
			summary.sBx = this.getArg("sBx");
		} else if (format == "iAx") {
			summary.Ax = ~(this.getArg("Ax") >>> 0);
		}
		return summary;
	}
}
exports.LuaBinaryInstruction = LuaBinaryInstruction;
class LuaBinary {
	constructor(reader) {
		this.reader = reader;
		this.main = null;
	}
	
	checkHeader() {
		const header = {};
		if(Buffer.compare(this.reader.getSlice(4), LUA_SIGNATURE) != 0) {
			throw Error("Invalid signature");
		}
		if(this.reader.getByte() != 0x52) {
			throw Error("Invalid version");
		}
		if(this.reader.getByte() != 0) {
			throw Error("Invalid format");
		}

		// endianness
		if (this.reader.getByte() == 0) {
			throw Error("Big endian format not supported");
		}
		if(this.reader.getByte() != LUASIZE_INT) {
			throw Error("Unsupported int size");
		}
		
		if(this.reader.getByte() != LUASIZE_SIZET) {
			throw Error("Unsupported size_t size");
		}
	
		if(this.reader.getByte() != LUASIZE_INSTRUCTION) {
			throw Error("Unsupported instruction size");
		}
	
		if(this.reader.getByte() != LUASIZE_NUMBER) {
			throw Error("Unsupported number size");
		}

		if (this.reader.getByte() != 0) {
			throw Error("Number represented as an integer, but only support double representation.");
		}
	
		if(Buffer.compare(this.reader.getSlice(6), LUAC_DATA) != 0) {
			throw Error("Invalid data portion");
		}
		return header;
	}

	getInt() {
		const intBuffer = this.reader.getSlice(LUASIZE_INT);
		return intBuffer.readInt32LE();
	}

	getUInt() {
		const intBuffer = this.reader.getSlice(LUASIZE_INT);
		return intBuffer.readUInt32LE();
	}


	getInstruction() {
		const instrBuffer = this.reader.getSlice(LUASIZE_INT);
		const instr = new LuaBinaryInstruction(instrBuffer);
		return instr;
	}

	getCode() {
		const codeCount = this.getInt();
		const code = [];
		for (let i = 0; i < codeCount; i++) {
			const instruction = this.getInstruction();
			code.push(instruction);
			
		}
		return code;
	}

	getString() {
		// This is good enough because strings will never exceed
		// 2**48 bytes 
		const stringRaw = this.reader.getSlice(LUASIZE_SIZET);
		const stringLength = stringRaw.readUIntLE(0, 6);
		if(stringLength == 0) {
			return "";
		} 
		// Null terminated so remove the last character
		const stringBuffer = this.reader.getSlice(stringLength - 1);
		const stringValue = stringBuffer.toString("latin1");
		// Remove null terminator
		this.reader.getByte();
		return stringValue;
	}

	getConstants() {
		const constCount = this.getInt();
		const constants = {
			booleans: [],
			numbers: [],
			strings : [],
			encodings: [],
		};
		for(let i = 0; i < constCount; i++) {
			const constType = this.reader.getByte();

			const LUA_TNIL = 0;
			const LUA_TBOOLEAN = 1;
			const LUA_TNUMBER = 3;
			const LUA_TSTRING = 4;
			let encoding = 0;
			switch(constType) {
			case LUA_TNIL:
				encoding = ((0 << 30) | 0) >>> 0;
				break;
			case LUA_TBOOLEAN:
				encoding = ((1 << 30) | constants.booleans.length) >>> 0;
				constants.booleans.push(this.reader.getByte() != 0);
				break;
			case LUA_TNUMBER:
				encoding = ((2 << 30) | constants.numbers.length) >>> 0;
				const numberRaw = this.reader.getSlice(LUASIZE_NUMBER);
				const number = numberRaw.readDoubleLE(0);
				constants.numbers.push(number);
				break;
			case LUA_TSTRING:	
				encoding = ((3 << 30) | constants.strings.length) >>> 0;
				constants.strings.push(this.getString());
				break
			default:
				throw Error("Did not expect " + constType);
			}
			constants.encodings.push(encoding);
		}
		return constants;
	}


	getUpvalues() {
		const upvalCount = this.getInt();
		const upvalues = {
			count: upvalCount,
			table: [],
		};
		for(let i = 0; i < upvalCount; i++) {
			// instack
			upvalues.table.push(this.reader.getByte());
			// idx
			upvalues.table.push(this.reader.getByte());
		}
		return upvalues;
	}

	getDebugLineInfo() {
		const n = this.getInt();
		const lineinfo = [];
		for (let i = 0; i < n; i++) {
			lineinfo.push(this.getInt());
		}

		return lineinfo;
	}

	getDebug() {
		// We ignore this
		const code = this.getString();
		const debug = {
			// lineinfo
			lineinfo: this.getDebugLineInfo(),
			vars : [],
			upvalues:[],

		};
		// count
		const varCount = this.getInt();
		for (let i = 0; i < varCount; i++) {
			const varInfo = {};
			// var name
			varInfo.name = this.getString();
			// startpc
			varInfo.startpc = this.getInt();
			// endpc
			varInfo.endpc = this.getInt();
			debug.vars.push(varInfo);
		}
		// upvalues
		const upvalues = this.getInt();
		for (let i = 0; i < upvalues; i++) {
			debug.upvalues.push(this.getString());
		}
		return debug;
	}

	getFunction() {
		const funcData = {
			linedefined: this.getInt(),
			lastlinedefined: this.getInt(),
			numparams: this.reader.getByte(),
			is_vararg: this.reader.getByte() == 1,
			maxstacksize: this.reader.getByte(),
			code: this.getCode(),
			constants: this.getConstants(),
			functions: [],
		};
		// Functions are actually defined inside constants
		// I decided to move it here just to make it
		// more readable
		const funcCount = this.getInt();
		for (let i = 0; i < funcCount; i++) {
			const func = this.getFunction();
			funcData.functions.push(func);
		}
		// Upvalues are after functions
		funcData.upvalues = this.getUpvalues();
		funcData.debug = this.getDebug();
		return funcData;
	}


	construct() {
		this.checkHeader();
		this.main = this.getFunction();
	}

	getConstant(constants, index, addQuotes = true) {
		const encoding = constants.encodings[index];
		const constType = (encoding >> 30) & 0b11;
		const constOffset = encoding & 0x3FFFFFFF;
		if (constType == 0) {
			return "nil";
		}
		if (constType == 1) {
			return constants.booleans[constOffset] == 1 ? "true" : "false";
		}

		if (constType == 2) {
			return constants.numbers[constOffset].toString();
		}

		if (constType == 3) {
			if (addQuotes) {
				return `"${constants.strings[constOffset]}"`;
			} else {
				return constants.strings[constOffset];
			}
		}
		return "";

	}
}
exports.LuaBinary = LuaBinary;

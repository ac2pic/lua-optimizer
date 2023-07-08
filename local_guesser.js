const {Walker} = require('./walker.js');

class LocalGuesser extends Walker {
	constructor(iterator,func) {
		super(iterator, func);
		this.registers = {};
		this.temporary = [];
		this.locals = [];
	}


	postStep(offset) {
		// console.log(offset, this.locals);
	}
	finish() {
		for (const temp of this.temporary) {
			if (temp == null) {
				continue;
			}
			const register = temp[0];
			const registerInfo = this.registers[register] || { assignments: [temp[1]]};
			if (registerInfo.temporary) {
				continue;
			}

			if (registerInfo.condition) {
				registerInfo.assignments = registerInfo.assignments ||  [temp[1]];
				for (const assignOffset of registerInfo.assignments) {
					const assignTemp = [register, assignOffset, 1];
					this.locals.push(assignTemp);
				}
			} else {
				this.locals.push(temp);
			}
		}
		return this.locals.sort((e, i) => e[1] - i[1]);
	}

	LOADK({A}, offset) {
		if (this.registers[A] == null || this.registers[A].global || this.registers[A].temporary) {
			this.registers[A] = {
				constant: true,
				condition: false,
				temporary: false,
				local: false,
				assignments: [offset],
			};
			this.temporary[A] = [A, offset, 1];
		} else {
			this.registers[A].condition = false;
			this.registers[A].global = false;
			this.registers[A].temporary = false;
			this.registers[A].assignments.push(offset);
			this.temporary[A][2]++;

		}
	}
	
	TEST({A}, offset) {
		if (this.registers[A].hasLocal) {
			this.registers[A].temporary = true;
		} else if (!this.registers[A].global) {
			this.registers[A].condition = true;
			this.temporary[A][2]++;
		}
	}
	
	EQ({B,C}, offset) {
		// if one has a local then both are temporary 
		let isTemporary = B >= 0 ? this.registers[B].hasLocal : false;
		isTemporary |= C >= 0 ? this.registers[C].hasLocal : false;
		if (B >= 0) {
			if (isTemporary) {
				this.registers[B].temporary = true;
			} else if (!this.registers[B].global) {
				this.registers[B].condition = true;
				this.temporary[B][2]++;
			}
		}

		if (C >= 0) {
			if (isTemporary) {
				this.registers[C].temporary = true;
			} else if (!this.registers[C].global) {
				this.registers[C].condition = true;
				this.temporary[C][2]++;
			}
		}
	}
	GETTABUP({A}) {
		this.registers[A] = this.registers[A] || {};
		this.registers[A].global = true;

	}

	JMP() {
		// is the last one a test?
		const lastInstruction = this.iterator.peek(-1).getSummary();
		const {name} = lastInstruction;
		if (name == "TEST") {
			const {A} = lastInstruction;
			if (!this.registers[A].global) {
				this.temporary[A][2]++;
			}
		}
	}

	ADD({A,B,C}, offset) {
		// B is a register

		if (B >= 0) {
			if (this.registers[B].global) {
			} else if (B == A) {
				this.temporary[B][2]++;
			} else if (this.registers[B].constant) {
				// It could have been inlined but it wasn't
				// so it's a local
				this.locals.push(this.temporary[B])
				this.temporary[B] = null;
				this.registers[B].local = true;
				this.registers[B].constant = false;
			}

		}
		if (C >= 0) {
			if (this.registers[C].global) {
			} else if (C == A) {
				this.temporary[B][2]++;
			} if (this.registers[C].constant) {
				// It could have been inlined but it wasn't
				// so it's a local
				this.locals.push(this.temporary[C])
				this.temporary[C] = null;
				this.registers[C].constant = false;
				this.registers[C].local = true;
			}
		}

		if (A != B && A != C) {
			this.temporary[A] = [A, offset, 1];
			let hasLocal = B >= 0 ? this.registers[B].local : false;
			hasLocal |= C >= 0 ? this.registers[C].local : false;
			this.registers[A] = this.registers[A] || {temporary: false};
			this.registers[A].hasLocal = hasLocal;
		}
	}

	MOVE({A, B}, offset) {
		if (this.registers[B].constant) {
			this.locals.push(this.temporary[B]);
			this.temporary[B] = null;
			this.registers[B].constant = false;
			this.registers[B].local = true;
		}
		this.registers[A] = this.registers[A] || {temporary: true};
		this.temporary[A] = [A, offset, 1];
	}

	CALL({A,B,C}, offset) {
		let minRegister = A;
		let maxRegister = A + B - 1;
		for(let i = minRegister; i <= maxRegister; i++) {
			const registerInfo = this.registers[i];
			if (registerInfo.constant) {
				this.registers[i].temporary = true;
				this.temporary[i] = [i, offset, 1];
			}
		}
	}
}

exports.LocalGuesser = LocalGuesser;

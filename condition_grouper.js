const {Walker} = require('./walker.js');

function _inc(pair, index) {
	if (pair == null) {
		return [index, 1];
	}
	const lastIndex = pair[0] + pair[1];
	if (lastIndex == index) {
		pair[1] += 1;
		return pair;
	} else {
		pair[0] = index;
		pair[1] = 1;
		return pair;
	}
}

function _upd(registers, offset, minRegister, maxRegister) {
	for(let i = minRegister; i <= maxRegister; i++) {
		registers[i] = _inc(registers[i], offset);
	}
}
const binaryOperator = function({A}, _, offset) {
	_upd(this.registers, offset, A, A);
};


class ConditionGrouper extends Walker {
	constructor() {
		super();
		this.registers = [];
		this.init();
		this.conditionPairs = [];
		this.conditionBranches = [];
	}

	init() {
		const binaryOps = [
			"ADD",
			"MUL",
		];
		for(const binaryOp of binaryOps) {
			this[binaryOp] = binaryOperator.bind(this);
		}

	}
	finish() {
		for (let i = 1; i < this.conditionBranches.length; i++) {
			let bi = i - 1;
			let lastFocus = this.conditionBranches[bi];
			let focus = this.conditionBranches[i];
			const isOr = lastFocus[0] == focus[0];
			const isAnd = lastFocus[1] == focus[1];
			let shouldCombine = isOr || isAnd;
			// Since and/or are binary operators
			// We can always assume that they will be close to each other when evaluating
			if (!shouldCombine) {
				// preferred path comparision
				// If any of these are true then
				// there is a not somewhere
				shouldCombine = lastFocus[0] == focus[1];
				shouldCombine |= lastFocus[1] == focus[0];
			}

			if (shouldCombine) {	
				const p1 = this.conditionPairs[bi];
				const p2 = this.conditionPairs[i];
				// Join them to make one
				this.conditionPairs.splice(bi, 2, [p1[0], p2[1]]);
				this.conditionBranches.splice(bi, 1);
				i = 0;
			}

		}
		return this.conditionPairs;
	}
	
	LEN({A}, _, offset) {
		_upd(this.registers, offset, A, A);
	}

	CALL({A,B,C}, _, offset) {
		if (C == 1 || C == 0) {
			return;
		}
		_upd(this.registers, offset, A, (A + C - 2));
	}

	VARARG({A,B}, _, offset) {
		// Need to figure out this but we will assume
		// this never happens within a condition
		if (B == 0) {
			return;
		}
		_upd(this.registers, offset, A, (A + B - 1));
	}

	LOADNIL({A,B}, _, offset) {
		// _upd(this.registers, offset, A, (A + B));
	}

	LOADK({A}, _, offset) {
		// _upd(this.registers, offset, A, A);
	}

	GETTABUP({A}, _, offset) {
		_upd(this.registers, offset, A, A);
	}

	MOVE({A},_, offset) {
		// _upd(this.registers, offset, A, A);
	}

	EQ({A, B,C}, _, offset, peek) {
		const defaultPair = [offset, 0];
		const bPair = this.registers[B] || defaultPair;
		const cPair = this.registers[C] || defaultPair;
		let minPair;
		let maxPair;
		if (bPair[0] <= cPair[0]) {
			minPair = bPair;	
			maxPair = cPair;
		} else {
			minPair = cPair;	
			maxPair = bPair;

		}
		if (minPair[0] + minPair[1] != maxPair[0]) {
			// It is disjointed so change min pair to max pair
			// minPair is not a part of the expression so ignore it.
			minPair = maxPair;
		}

		if (maxPair[0] + maxPair[1] != offset) {
			console.log("What happened? 2");
			return;
		}
		const conditionPair = [minPair[0], offset + 1];
		this.conditionPairs.push(conditionPair);
		const matchJmp = offset + 2;
		const altJmp = peek().getSummary().sBx + (offset + 1) + 1;
		const boolEval = !(!!A);
		let jmpPair = [0, 0, !boolEval, "=="];
		jmpPair[0] = boolEval ? matchJmp: altJmp;
		jmpPair[1] = boolEval ? altJmp: matchJmp;
		const distance = Math.abs(matchJmp - altJmp);
		this.conditionBranches.push(jmpPair);

		if (distance != 1) {
			return;
		}
		let idx = boolEval ? 0 : 1;
		const newTrueJmp = peek(2).getSummary().sBx + jmpPair[idx] + 1;
		jmpPair[idx] = newTrueJmp;
	}


	TEST({A, C}, _, offset, peek) {
		const aPair = this.registers[A] || [offset, 0];
		if (aPair[0] + aPair[1] != offset) {
			console.log("What happened?");
			return;
		}
		const conditionPair = [aPair[0], offset + 1];
		const matchJmp = offset + 2;
		const altJmp = peek().getSummary().sBx + (offset + 1) + 1;
		this.conditionPairs.push(conditionPair);

		const boolEval = !(!!C);
		let jmpPair = [0, 0, boolEval, "t="];
		jmpPair[0] = boolEval ? matchJmp: altJmp;
		jmpPair[1] = boolEval ? altJmp: matchJmp;
		const distance = Math.abs(matchJmp - altJmp);
		this.conditionBranches.push(jmpPair);
		if (distance != 1) {
			return;
		}
		let idx = boolEval ? 0 : 1;
		const newTrueJmp = peek(2).getSummary().sBx + jmpPair[idx] + 1;

		jmpPair[idx] = newTrueJmp;
	}
}

exports.ConditionGrouper = ConditionGrouper;

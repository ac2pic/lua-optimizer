const fs = require('fs');
const {
	BinaryReader,
	LuaBinary,
} =  require('./binary.js');

const {LuaDecompiler} = require('./decompiler.js');


//const data = new BinaryReader(fs.readFileSync("lua/global.lua"));
const data = new BinaryReader(fs.readFileSync("luac.out"));
const luaBin = new LuaBinary(data);
luaBin.construct();

const luaDecompiler = new LuaDecompiler(luaBin);

const decompiledCode = luaDecompiler.decompile();

const luaparse = require("luaparse");
const luacodegen = require("luacodegen");
class Visitor {
	visit(node) {
		const visitFunc = "visit_" + node["type"];
		if (this[visitFunc]) {
			this[visitFunc](node);
		} else {
			console.warn(visitFunc + " does not exist");
		}
	}

	visit_Chunk(node) {
		for (const childNode of node["body"]) {
			this.visit(childNode);
		}
	}
	visit_FunctionDeclaration(node) {
		console.log(node);
	}
}

const tree = luaparse.parse(decompiledCode);

const visitor = new Visitor();

visitor.visit(tree);
const code = luacodegen(tree);
console.log(code);

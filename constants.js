const SIZE_C = 9;
const SIZE_B = 9;
const SIZE_Bx = SIZE_C + SIZE_B;
const SIZE_A = 8;
const SIZE_Ax = SIZE_C + SIZE_B + SIZE_A;
const SIZE_OP = 6;
const POS_A = SIZE_OP;
const POS_C = POS_A + SIZE_A;
const POS_B = POS_C + SIZE_C;
const POS_Bx = POS_C;
const POS_Ax = POS_A;

exports.SIZE_C = SIZE_C;
exports.SIZE_B = SIZE_B;
exports.SIZE_Bx = SIZE_Bx;
exports.SIZE_A = SIZE_A;
exports.SIZE_Ax = SIZE_Ax;
exports.SIZE_OP = SIZE_OP;
exports.POS_A = POS_A;
exports.POS_C = POS_C;
exports.POS_B = POS_B;
exports.POS_Bx = POS_Bx;
exports.POS_Ax = POS_Ax;

exports.LUA_SIGNATURE = Buffer.from("\x1bLua");
exports.LUAC_DATA = Buffer.from("\x19\x93\r\n\x1a\n", "latin1");
exports.LUASIZE_INT = 4;
exports.LUASIZE_SIZET = 8;
exports.LUASIZE_INSTRUCTION = 4;
exports.LUASIZE_NUMBER = 8;
exports.iABC = 0;
exports.iABx = 1;
exports.iAsBx = 2;
exports.iAx = 3;
exports.OpArgN = 0;  /* argument is not used */
exports.OpArgU = 1;  /* argument is used */
exports.OpArgR = 2;  /* argument is a register or a jump offset */
exports.OpArgK = 3;   /* argument is a constant or register/constant */
exports.LUA_OPMODES = [
    96,
    113,
    65,
    84,
    80,
    80,
    92,
    108,
    60,
    16,
    60,
    84,
    108,
    124,
    124,
    124,
    124,
    124,
    124,
    96,
    96,
    96,
    104,
    34,
    188,
    188,
    188,
    132,
    228,
    84,
    84,
    16,
    98,
    98,
    4,
    98,
    20,
    81,
    80,
    23
];
exports.OPCODE_NAMES = [
  "MOVE",
  "LOADK",
  "LOADKX",
  "LOADBOOL",
  "LOADNIL",
  "GETUPVAL",
  "GETTABUP",
  "GETTABLE",
  "SETTABUP",
  "SETUPVAL",
  "SETTABLE",
  "NEWTABLE",
  "SELF",
  "ADD",
  "SUB",
  "MUL",
  "DIV",
  "MOD",
  "POW",
  "UNM",
  "NOT",
  "LEN",
  "CONCAT",
  "JMP",
  "EQ",
  "LT",
  "LE",
  "TEST",
  "TESTSET",
  "CALL",
  "TAILCALL",
  "RETURN",
  "FORLOOP",
  "FORPREP",
  "TFORCALL",
  "TFORLOOP",
  "SETLIST",
  "CLOSURE",
  "VARARG",
  "EXTRAARG"
];

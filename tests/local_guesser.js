const test = require('node:test');
const assert = require('node:assert');
const {LocalGuesser} = require('../local_guesser.js');

const {
	walkGenerator,
	patchAssert,
} = require('./utils.js');

patchAssert(assert);
const walk = walkGenerator(LocalGuesser);

test('simple assignments', (t) => {
	const expected = [[0,0,1]];
	const result = walk("fixtures/single_assignment.luac");
	assert.deepEqual(expected, result, "Local variable constant assignment not detected.");
});

test('2 constants vars, one var sum of constant vars', (t) => {
	const expected = [
		[0,0,1],
		[1,1,1],
		[2,2,1]
	];
	const result = walk("fixtures/binary_assign_var_constants.luac");
	assert.deepEqual(expected, result, "All locals were not detected.");
});

test('one ternary_or local', (t) => {
	const expected = [
		[0,0,4],
	];
	const result = walk("fixtures/ternary_or.luac");
	assert.deepEqual(expected, result, "ternary not properly detected");
});


test('one if with a local', (t) => {
	const expected = [
		[0,0,1],
	];
	const result = walk("fixtures/if_condition_single_var.luac");
	assert.deepEqual(expected, result, "local not properly detected");
});

test('one if with two locals', (t) => {
	const expected = [
		[0,0,1],
		[1,1,1],
	];
	const result = walk("fixtures/if_condition_two_vars.luac");
	assert.deepEqual(expected, result, "locals not properly detected");
});

test('addition op reassign local', (t) => {
	const expected = [
		[0,0,2],
	];
	const result = walk("fixtures/binary_local_reused.luac");
	assert.deepEqual(expected, result, "locals not properly detected");
});

test('only global variables if condition', (t) => {
	const expected = [];
	const result = walk("fixtures/no_locals_if_condition.luac");
	assert.deepEqual(expected, result, "globals treated as locals.");
});

test('only locals if condition', (t) => {
	const expected = [
		[0,0, 1],
		[1,1, 1],
	];
	const result = walk("fixtures/locals_eq_if_condition.luac");
	assert.deepEqual(expected, result, "locals not properly detected");
});

test('global variable to local variable', (t) => {
	const expected = [
		[0,1,1],
	];
	const result = walk("fixtures/global_to_local.luac");
	assert.deepEqual(expected, result, "locals not properly detected");
});

test('Nested if with single var assignment', (t) => {
	const expected = [
		[0,0,1],
		[0,3,1],
	];
	const result = walk("fixtures/nested_ifs_single_local.luac");
	assert.deepEqual(expected, result, "locals not properly detected");
});

test('global call with constant as first argument', (t) => {
	const expected = [];
	const result = walk("fixtures/call_single_constant.luac");
	assert.deepEqual(expected, result, "there should be no local variables.");
});

test('global call with local as first argument', (t) => {
	const expected = [
		[0,0, 1],
	];
	const result = walk("fixtures/call_single_local.luac");
	assert.deepEqual(expected, result, "there should be no local variables.");
});

test('single local with inlined addition in if condition', (t) => {
	const expected = [
		[0,0, 1],
	];
	const result = walk("fixtures/if_condition_one_local_one_temporary.luac");
	assert.deepEqual(expected, result, "there should be only one local variable.");
});

test('two local with two inlined additions in if condition', (t) => {
	const expected = [
		[0,0, 1],
		[1,1, 1],
	];
	const result = walk("fixtures/if_condition_two_locals_two_temporaries.luac");
	assert.deepEqual(expected, result, "there should be two local variables.");
});

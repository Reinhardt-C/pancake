const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

let g = {
	stacks: [],
	condition: undefined,
	notcondition: undefined,
	pancake: undefined,
};

init();

function init() {
	rl.question("> ", function (input) {
		Pancake.run(input);
	});
}

function runFile(path) {
	fs.readFile(path, "utf8", function (err, script) {
		if (err) throw err;
		Pancake.run(script);
	});
}

function out(arg) {
	console.log(arg);
}

class Pancake {
	static lex(str) {
		let currentPosition = 0;
		let buffer = "";
		let currentType = null;
		let tokens = [];
		while (currentPosition < str.length) {
			let char = str[currentPosition];
			if (char == "\n") {
				currentPosition++;
				continue;
			}
			if (/[\s\n\r]/.test(char) && buffer.length > 0 && currentType !== "STRING") {
				tokens.push(new Token(currentType, buffer));
				currentType = null;
				buffer = "";
				currentPosition++;
				continue;
			}
			if (currentType == null) {
				if (char == "'") {
					currentType = "STRING";
				} else if (/\d/.test(char)) {
					currentType = "NUMBER";
				} else if (/\w/.test(char)) {
					currentType = "KEYWORD";
				}
			} else {
				if (currentType == "STRING" && char == "'" && buffer[buffer.length - 1] !== "\\") {
					buffer += char;
					tokens.push(new Token("STRING", buffer));
					buffer = "";
					currentType = null;
					currentPosition++;
					continue;
				} else if (currentType == "NUMBER" && !/\d/.test(char))
					throw "SyntaxError: Unexpected " + char;
				else if (currentType == "KEYWORD" && /\d/.test(char))
					throw "SyntaxError: Unexpected " + char;
			}
			buffer += char;
			currentPosition++;
		}
		if (buffer.length > 0) {
			tokens.push(new Token(currentType, buffer));
			currentType = null;
			buffer = "";
		}
		return tokens;
	}

	static parse(tokens) {
		let stacks = g.stacks;
		let condition = g.condition,
			notcondition = g.notcondition;
		let pancake = g.pancake;
		while (tokens.length > 0) {
			let token = tokens.shift();
			if (token.type !== "KEYWORD") continue;
			if (condition !== undefined && pancake !== condition) {
				condition = undefined;
				continue;
			}
			condition = undefined;
			if (notcondition !== undefined && pancake == notcondition) {
				notcondition = undefined;
				continue;
			}
			notcondition = undefined;
			switch (token.value) {
				case "plate":
					stacks[tokens.shift().value] = [];
					break;
				case "bake":
					pancake = tokens.shift().raw;
					break;
				case "flip":
					out(pancake);
					break;
				case "push":
					stacks[tokens.shift().value].push(pancake);
					pancake = undefined;
					break;
				case "pop":
					pancake = stacks[tokens.shift().value].pop();
					break;
				case "butter":
					pancake++;
					break;
				case "melt":
					pancake--;
					break;
				case "require":
					let t = tokens.shift();
					condition = t.raw || stacks[t.value][stacks[t.value].length - 1];
					break;
				case "requirenot":
					let s = tokens.shift();
					notcondition = s.raw || stacks[s.value][stacks[s.value].length - 1];
					break;
			}
			g = { stacks: stacks, condition: condition, notcondition: notcondition, pancake: pancake };
		}
	}

	static run(str) {
		Pancake.parse(Pancake.lex(str));
		init();
	}
}

class Token {
	constructor(type, value) {
		this.type = type;
		this.value = type == "STRING" ? value : value.replace(/\s/, "");
	}

	get raw() {
		if (this.type == "STRING") return this.value.slice(1, -1);
		if (this.type == "NUMBER") return parseFloat(this.value);
		return "";
	}
}

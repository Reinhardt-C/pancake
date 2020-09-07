const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

init();

function init() {
	rl.question("> ", function (input) {
		let instruct = input.split(" ");
		switch (instruct[0]) {
			case "pancake":
				runFile(instruct.slice(1).join(" "));
				break;
			case "help":
				console.log("pancake [path] - run the pancake file at path");
				init();
				break;
			default:
				console.log("Unknown command " + instruct[0]);
				init();
		}
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
		let permtokens = [...tokens];
		let stacks = {};
		let orders = {};
		let condition = null,
			notcondition = null;
		let pancake;
		while (tokens.length > 0) {
			let token = tokens.shift();
			if (token.type !== "KEYWORD") continue;
			if (condition !== null && pancake !== condition) {
				condition = null;
				continue;
			}
			condition = null;
			if (notcondition !== null && pancake == notcondition) {
				notcondition = null;
				continue;
			}
			notcondition = null;
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
				case "neworder":
					orders[tokens.shift().value] = permtokens.length - tokens.length + 1;
					break;
				case "order":
					let v = orders[tokens.shift().value];
					tokens = permtokens.slice(v);
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
